import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import Stripe from 'stripe';
import * as schema from '../db/schema';
import { OrdersGateway } from '../gateway/orders.gateway';

@Injectable()
export class PaymentsService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(
    @Inject('DB') private db: NeonHttpDatabase<typeof schema>,
    private ordersGateway: OrdersGateway,
  ) {
    // initialise Stripe with the secret key
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createPaymentIntent(orderId: string, customerId: string) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) throw new NotFoundException('Order not found');

    if (order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is no longer pending');
    }

    // create payment intent — amount must be in smallest currency unit (cents)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.totalAmount) * 100), // e.g. $8.99 → 899 cents
      currency: 'usd',
      metadata: {
        orderId: order.id, // attach orderId so we can find it in the webhook
      },
    });

    // save paymentIntentId to order so webhook can match it
    await this.db
      .update(schema.orders)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(schema.orders.id, orderId));

    return { clientSecret: paymentIntent.client_secret };
  }

  // fast-path confirmation called by the app right after the payment sheet
  // succeeds. Verifies the payment intent against Stripe so a client can't
  // confirm an order it hasn't actually paid for. The webhook remains the
  // source of truth in production; this just removes the dependency on it
  // being delivered (e.g. when stripe listen isn't running locally).
  async confirmPayment(
    orderId: string,
    paymentIntentId: string,
    customerId: string,
  ) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) throw new NotFoundException('Order not found');

    if (order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'CONFIRMED') return order;

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is no longer pending');
    }

    if (order.stripePaymentIntentId !== paymentIntentId) {
      throw new BadRequestException('Payment intent does not match this order');
    }

    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not been completed');
    }

    if (paymentIntent.metadata.orderId !== orderId) {
      throw new BadRequestException('Payment intent does not match this order');
    }

    const [updated] = await this.db
      .update(schema.orders)
      .set({ status: 'CONFIRMED', updatedAt: new Date() })
      .where(eq(schema.orders.id, order.id))
      .returning();

    return updated;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: ReturnType<typeof this.stripe.webhooks.constructEvent>;

    try {
      // verify webhook signature — ensures the request is genuinely from Stripe
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      type StripePaymentIntent = Awaited<
        ReturnType<typeof this.stripe.paymentIntents.create>
      >;
      const paymentIntent = event.data.object as StripePaymentIntent;

      const [order] = await this.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.stripePaymentIntentId, paymentIntent.id));

      if (!order) return { received: true }; // order not found — ignore

      // idempotency check — skip if already confirmed (Stripe can resend webhooks)
      if (order.status === 'CONFIRMED') return { received: true };

      const [updated] = await this.db
        .update(schema.orders)
        .set({ status: 'CONFIRMED', updatedAt: new Date() })
        .where(eq(schema.orders.id, order.id))
        .returning();

      this.ordersGateway.emitOrderUpdate(updated);
    }

    return { received: true }; // always return 200 to Stripe
  }
}

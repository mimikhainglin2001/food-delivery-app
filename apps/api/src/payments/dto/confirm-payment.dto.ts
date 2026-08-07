import { IsString, IsUUID, Matches } from 'class-validator';

export class ConfirmPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  @Matches(/^pi_/)
  paymentIntentId!: string;
}

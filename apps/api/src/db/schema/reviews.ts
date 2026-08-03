import {integer, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import {restaurants} from "./restaurants";
import {users} from "./users";
import { orders } from './orders';

export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
        .notNull()
        .references(() => users.id),
    restaurantId: uuid('restaurant_id')
        .notNull()
        .references(() => restaurants.id),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, {onDelete: 'cascade'}),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id),
    driverId: uuid('driver_id')
        .references(() => users.id),
    restaurantRating: integer('restaurant_rating').notNull(),
    driverRating: integer('driver_rating'),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
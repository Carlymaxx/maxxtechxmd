import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { servicesTable } from "./services";

export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "in_progress", "completed", "cancelled", "failed"]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  targetUrl: text("target_url").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 4 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  startCount: integer("start_count"),
  currentCount: integer("current_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

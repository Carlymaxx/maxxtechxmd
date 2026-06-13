import { pgTable, text, serial, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceQualityEnum = pgEnum("service_quality", ["standard", "premium", "vip"]);

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pricePerThousand: numeric("price_per_thousand", { precision: 10, scale: 4 }).notNull(),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  deliveryTime: text("delivery_time").notNull(),
  quality: serviceQualityEnum("quality").notNull().default("standard"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;

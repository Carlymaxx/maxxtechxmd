import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const panelUsers = pgTable("panel_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 255 }).notNull(),
  xdBalance: integer("xd_balance").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredById: integer("referred_by_id"),
  resetToken: varchar("reset_token", { length: 64 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  avatarUrl: text("avatar_url"),
  oauthProvider: varchar("oauth_provider", { length: 20 }),
  oauthId: varchar("oauth_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const panelBots = pgTable("panel_bots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  botName: varchar("bot_name", { length: 255 }).notNull(),
  herokuAppName: varchar("heroku_app_name", { length: 255 }).unique(),
  sessionId: text("session_id").notNull(),
  ownerNumber: varchar("owner_number", { length: 50 }).notNull(),
  prefix: varchar("prefix", { length: 10 }).notNull().default("."),
  workMode: varchar("work_mode", { length: 20 }).notNull().default("public"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  planName: varchar("plan_name", { length: 20 }).notNull().default("basic"),
  xdPerDay: integer("xd_per_day").notNull().default(17),
  autoRenew: boolean("auto_renew").notNull().default(false),
  lastBilledAt: timestamp("last_billed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const panelAnnouncements = pgTable("panel_announcements", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const panelNotifications = pgTable("panel_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const panelTransactions = pgTable("panel_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  amountXd: integer("amount_xd").notNull(),
  amountKes: numeric("amount_kes", { precision: 10, scale: 2 }),
  paystackRef: varchar("paystack_ref", { length: 255 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPanelUserSchema = createInsertSchema(panelUsers).omit({
  id: true,
  createdAt: true,
  xdBalance: true,
  isAdmin: true,
  isBanned: true,
  referralCode: true,
  referredById: true,
});

export const insertPanelBotSchema = createInsertSchema(panelBots).omit({
  id: true,
  createdAt: true,
  lastBilledAt: true,
  herokuAppName: true,
  status: true,
});

export const insertPanelTransactionSchema = createInsertSchema(
  panelTransactions
).omit({ id: true, createdAt: true });

export type PanelUser = typeof panelUsers.$inferSelect;
export type InsertPanelUser = z.infer<typeof insertPanelUserSchema>;
export type PanelBot = typeof panelBots.$inferSelect;
export type InsertPanelBot = z.infer<typeof insertPanelBotSchema>;
export type PanelTransaction = typeof panelTransactions.$inferSelect;
export type InsertPanelTransaction = z.infer<typeof insertPanelTransactionSchema>;
export type PanelNotification = typeof panelNotifications.$inferSelect;

import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const dbUrl =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL.replace(/\?.*$/, "") + "?sslmode=require"
    : process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  tablesFilter: ["!pg_stat_*", "!pg_*", "!information_schema.*"],
});

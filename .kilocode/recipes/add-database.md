# Recipe: Add Database

Add SQLite database support with Drizzle ORM for data persistence.

## When to Use

- User needs to store data (users, posts, comments, etc.)
- Application requires authentication with user accounts
- Any feature requiring persistent state

## Prerequisites

- Base template already set up
- Understanding of the data model needed

## Environment

Database credentials (`DB_URL`, `DB_TOKEN`) are automatically provided by the sandbox environment.

## Setup Steps

### Step 1: Install Dependencies

```bash
bun add github:Kilo-Org/app-builder-db#main drizzle-orm && bun add -D drizzle-kit
```

### Step 2: Create All Required Files

⚠️ **Important**: Create ALL files before running generate. Setup fails if any are missing.

#### `src/db/schema.ts` - Table definitions

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Add more tables as needed
```

#### `src/db/index.ts` - Database client

```typescript
import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

export const db = createDatabase(schema);
```

#### `src/db/migrate.ts` - Migration script

```typescript
import { runMigrations } from "@kilocode/app-builder-db";
import { db } from "./index";

await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
```

#### `drizzle.config.ts` - Drizzle configuration (project root)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
});
```

### Step 3: Add Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/db/migrate.ts"
  }
}
```

### Step 4: Generate Migrations

```bash
bun db:generate
```

### Step 5: Commit and Push

```bash
bun typecheck && bun lint && git add -A && git commit -m "Add database support" && git push
```

Migrations run automatically in the sandbox after push.

⚠️ **Never run `bun db:migrate` manually** - it won't work locally.

## Usage Examples

Database operations only work in Server Components and Server Actions.

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Select all users
const allUsers = await db.select().from(users);

// Select by ID
const user = await db.select().from(users).where(eq(users.id, 1));

// Insert new user
await db.insert(users).values({ name: "John", email: "john@example.com" });

// Update user
await db.update(users).set({ name: "Jane" }).where(eq(users.id, 1));

// Delete user
await db.delete(users).where(eq(users.id, 1));
```

## Memory Bank Updates

After implementing, update `.kilocode/rules/memory-bank/context.md`:

- Add database to "Recently Completed" section
- Document the schema tables created
- Note any API routes or server actions added

Also update `.kilocode/rules/memory-bank/tech.md`:

- Add Drizzle ORM to dependencies
- Document database file structure

import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL?.trim() ||
  process.env.MYSQL_URL?.trim() ||
  process.env.PRISMA_DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("Defina DATABASE_URL, MYSQL_URL ou PRISMA_DATABASE_URL para drizzle-kit");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});

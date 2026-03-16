import { defineConfig } from "prisma/config";

function withSchema(databaseUrl: string, schema: string): string {
  try {
    const parsed = new URL(databaseUrl);
    parsed.searchParams.set("schema", schema);
    return parsed.toString();
  } catch {
    const sep = databaseUrl.includes("?") ? "&" : "?";
    return `${databaseUrl}${sep}schema=${schema}`;
  }
}

const rawUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL;

const appSchema = process.env.POSTGRES_APP_SCHEMA ?? "loavish";

export default defineConfig({
  schema: "./packages/db/prisma/schema.prisma",
  datasource: {
    url: rawUrl ? withSchema(rawUrl, appSchema) : undefined,
    shadowDatabaseUrl: rawUrl
      ? withSchema(rawUrl, `${appSchema}_shadow`)
      : undefined,
  },
});

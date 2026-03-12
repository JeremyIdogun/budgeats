import { defineConfig } from "prisma/config";

function withSchema(databaseUrl: string, schema: string): string {
  try {
    const parsed = new URL(databaseUrl);
    parsed.searchParams.set("schema", schema);
    return parsed.toString();
  } catch {
    const separator = databaseUrl.includes("?") ? "&" : "?";
    return `${databaseUrl}${separator}schema=${schema}`;
  }
}

const rawDatabaseUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL;
const appSchema = process.env.POSTGRES_APP_SCHEMA ?? "loavish";
const databaseUrl = rawDatabaseUrl ? withSchema(rawDatabaseUrl, appSchema) : undefined;

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
    shadowDatabaseUrl:
      process.env.POSTGRES_SHADOW_DATABASE_URL ??
      (rawDatabaseUrl ? withSchema(rawDatabaseUrl, `${appSchema}_shadow`) : undefined),
  },
});

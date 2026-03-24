// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaPromise: Promise<any | null> | null = null;

export async function getOptionalPrisma(): Promise<unknown | null> {
  if (prismaPromise) return prismaPromise;

  prismaPromise = (async () => {
    const url =
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL;

    if (!url) return null;

    try {
      const { PrismaClient } = await import("@prisma/client");
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: url });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new PrismaPg(pool as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = new PrismaClient({ adapter } as any);
      return client;
    } catch {
      return null;
    }
  })();

  return prismaPromise;
}

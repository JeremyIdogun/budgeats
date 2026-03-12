type PrismaModule = {
  prisma: unknown;
};

let prismaPromise: Promise<unknown | null> | null = null;

export async function getOptionalPrisma(): Promise<unknown | null> {
  if (prismaPromise) return prismaPromise;

  prismaPromise = (async () => {
    const hasUrl =
      Boolean(process.env.POSTGRES_URL_NON_POOLING) ||
      Boolean(process.env.POSTGRES_PRISMA_URL) ||
      Boolean(process.env.DATABASE_URL);

    if (!hasUrl) return null;

    try {
      const mod = (await import("../../../packages/db/src/index")) as PrismaModule;
      return mod.prisma ?? null;
    } catch {
      return null;
    }
  })();

  return prismaPromise;
}

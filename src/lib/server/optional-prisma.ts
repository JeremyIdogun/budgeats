let prismaPromise: Promise<null> | null = null;

// Build-safe fallback for environments where the workspace DB package
// dependencies are not installed in the web app runtime.
export async function getOptionalPrisma(): Promise<null> {
  if (prismaPromise) return prismaPromise;
  prismaPromise = Promise.resolve(null);
  return prismaPromise;
}

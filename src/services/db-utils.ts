export async function runSafeDbQuery<T>(fallback: T, query: () => Promise<T>) {
  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  try {
    return await query();
  } catch (error) {
    console.error("[db] Query failed", error);
    return fallback;
  }
}

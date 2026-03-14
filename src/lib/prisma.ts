import { PrismaClient } from "@prisma/client";

declare global {
  var __meowmarketPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__meowmarketPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__meowmarketPrisma__ = prisma;
}

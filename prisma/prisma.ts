import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/models/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:prisma/dev.db" });
const prismaGlobal = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = prismaGlobal.prisma ?? new PrismaClient({ adapter });

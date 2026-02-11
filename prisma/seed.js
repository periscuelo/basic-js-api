import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

try {
  console.log("🌱 Seeding database...");

  // -------------------
  // USERS
  // -------------------
  const passwordHashAdm = await argon2.hash("Admin12@");
  const passwordHashDefault = await argon2.hash("Aa12345!");

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@email.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@email.com",
      password: passwordHashAdm
    }
  });

  // User
  await prisma.user.upsert({
    where: { email: "user@email.com" },
    update: {},
    create: {
      name: "User",
      email: "user@email.com",
      password: passwordHashDefault
    }
  });
} catch (error) {
  console.error("❌ Erro no seed:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

import { prisma } from "../lib/prisma";

async function run() {
  try {
    console.log("Connecting to database...");
    const party = await prisma.party.findFirst();
    console.log("Database connection successful!");
    console.log("Sample Party:", party);
  } catch (error) {
    console.error("Database connection failed!", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

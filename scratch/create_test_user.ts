import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function createTestUser() {
  try {
    // 1. Get or create a party
    let party = await prisma.party.findFirst();
    if (!party) {
      party = await prisma.party.create({
        data: {
          partyCode: "P-001",
          tradeName: "Test Kisan",
          mobiles: ["9876543210"],
        }
      });
      console.log("Created new party:", party.tradeName);
    }

    // 2. Create user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.upsert({
      where: { username: "kisan123" },
      update: {
        password: hashedPassword,
        role: "CUSTOMER",
        partyId: party.id,
      },
      create: {
        name: "Test Kisan User",
        username: "kisan123",
        password: hashedPassword,
        role: "CUSTOMER",
        partyId: party.id,
        status: true,
      }
    });

    console.log("SUCCESS: Test user created!");
    console.log("Username: kisan123");
    console.log("Password: password123");
    console.log("Linked Party:", party.tradeName);
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

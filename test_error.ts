import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const party = await prisma.party.findFirst();
  if (!party) return console.log("No party");
  const res = await fetch(`http://localhost:3000/api/masters/party/${party.id}/balance`);
  console.log("Status:", res.status);
  console.log("Data:", await res.json());
}
check().finally(() => prisma.$disconnect());

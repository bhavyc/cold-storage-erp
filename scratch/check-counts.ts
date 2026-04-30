import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const partyCount = await prisma.party.count();
  const itemCount = await prisma.item.count();
  const unitCount = await prisma.unit.count();
  console.log(JSON.stringify({ partyCount, itemCount, unitCount }));
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const parties = await prisma.party.findMany({
    select: { tradeName: true, mobiles: true }
  });
  console.log(JSON.stringify(parties, null, 2));
}

main().finally(() => prisma.$disconnect());

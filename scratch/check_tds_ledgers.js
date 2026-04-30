const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ledgers = await prisma.ledger.findMany({
    where: {
      name: {
        contains: 'TDS',
        mode: 'insensitive'
      }
    }
  });
  console.log(JSON.stringify(ledgers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

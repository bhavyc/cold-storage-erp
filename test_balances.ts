import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const ledgers = await prisma.ledger.findMany({ include: { group: true } });
  let opAsset = 0;
  let opLiab = 0;
  
  ledgers.forEach(l => {
    console.log(l.name.padEnd(30), l.group.groupType.padEnd(10), l.openingMode.padEnd(8), l.openingBalance);
    
    // According to accounting, Asset has Dr balance, Liab has Cr balance
    if (l.group.groupType === 'Asset') {
      if (l.openingMode === 'Debit') opAsset += Number(l.openingBalance);
      else opAsset -= Number(l.openingBalance);
    } else if (l.group.groupType === 'Liability') {
      if (l.openingMode === 'Credit') opLiab += Number(l.openingBalance);
      else opLiab -= Number(l.openingBalance);
    }
  });

  console.log('Total Opening Assets:', opAsset);
  console.log('Total Opening Liabs :', opLiab);
  console.log('Difference          :', opAsset - opLiab);
}
run().finally(() => prisma.$disconnect());

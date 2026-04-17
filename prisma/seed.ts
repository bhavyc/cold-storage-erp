import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";

//   YAHAN ADD KIYA - prisma variable define karna zaroori tha
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding Cold Storage Data ---');

  // 1. MASTER DATA: Category
  const category = await prisma.category.upsert({
    where: { code: 'CAT01' },
    update: {},
    create: { code: 'CAT01', name: 'VEGETABLES', minLot: 1, maxLot: 9999 }
  });

  // 2. MASTER DATA: Unit (Jute Bag)
  const unit = await prisma.unit.upsert({
    where: { code: 'U01' },
    update: {},
    create: { 
        code: 'U01', 
        name: 'JUTE BAG (50KG)', 
        type: 'Company', 
        emptyWeight: new Prisma.Decimal(0.500),
        rateToContractorIn: new Prisma.Decimal(8.00),
        rateToContractorOut: new Prisma.Decimal(8.00)
    }
  });

  // 3. MASTER DATA: Chamber
  const chamber = await prisma.chamber.upsert({
    where: { code: 'CH01' },
    update: {},
    create: { code: 'CH01', name: 'CHAMBER NO 1', type: 'CS', capacityMode: 'Exact', totalCapacity: 5000 }
  });

  // 4. ACCOUNTING: Groups
  const groupDebtors = await prisma.accountGroup.create({
    data: { code: 'G01', name: 'Sundry Debtors', reportType: 'Balance Sheet', groupType: 'Asset' }
  });
  const groupCash = await prisma.accountGroup.create({
    data: { code: 'G07', name: 'Cash In Hand', reportType: 'Balance Sheet', groupType: 'Asset' }
  });
  const groupExp = await prisma.accountGroup.create({
    data: { code: 'G05', name: 'Indirect Expenses', reportType: 'Profit Loss', groupType: 'Expense' }
  });

  // 5. ACCOUNTING: System Ledgers
  const cashLedger = await prisma.ledger.create({
    data: { code: 'CASH01', name: 'Main Cash Account', groupId: groupCash.id, openingBalance: 10000, openingMode: 'Debit' }
  });
  const labourLedger = await prisma.ledger.create({
    data: { code: 'LABOUR_EXPENSE', name: 'Labour Contractor Account', groupId: groupExp.id }
  });

  // 6. SYSTEM SETTINGS
  /*
  await prisma.systemSettings.createMany({
    data: [
        { key: 'CASH_LEDGER_ID', value: cashLedger.id },
        { key: 'LABOUR_EXPENSE_ID', value: labourLedger.id }
    ]
  });
  */

  // 7. PARTY: Rahul Kumar
  const party = await prisma.party.create({
    data: {
        partyCode: 'P-101',
        tradeName: 'Rahul Kumar (Farmer)',
        gstType: 'Unregistered',
        graceDays: 10,
        maxAllowedCredit: 50000,
        openingBalance: 0
    }
  });

  // 8. STOCK: Create a Lot (Initial Stock)
  const lot = await prisma.lot.create({
    data: {
        lotNo: '1001',
        mrNo: 'MR-501',
        partyId: party.id,
        itemId: (await prisma.item.create({ data: { code: 'ITM01', name: 'POTATO (JYOTI)', categoryId: category.id }})).id,
        unitId: unit.id,
        chamberId: chamber.id,
        receivedQty: 100,
        balanceQty: 100,
        perUnitWgt: 50.500,
        totalTareWgt: 50.000,
        totalNetWgt: 5000.000,
        arrivalDate: new Date('2026-03-01'),
    }
  });

  console.log('--- Seed Completed Successfully ---');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1. Database Connection Logic (Aapke adapter ke hisab se)
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Seeding Professional ERP Data...");

  // 1. STANDARD ACCOUNT GROUPS (DNA of Accounting)
  const groups = [
    { code: "G01", name: "SUNDRY DEBTORS (PARTIES)", reportType: "Balance Sheet", groupType: "Asset" },
    { code: "G07", name: "CASH IN HAND", reportType: "Balance Sheet", groupType: "Asset" },
    { code: "G08", name: "BANK ACCOUNTS", reportType: "Balance Sheet", groupType: "Asset" },
    { code: "G05", name: "INDIRECT EXPENSES (OFFICE)", reportType: "Profit Loss", groupType: "Expense" },
    { code: "G06", name: "DIRECT EXPENSES (LABOUR)", reportType: "Profit Loss", groupType: "Expense" },
    { code: "G04", name: "DIRECT INCOMES (RENT)", reportType: "Profit Loss", groupType: "Income" },
     { code: 'G02', name: 'SUNDRY CREDITORS', reportType: 'Balance Sheet', groupType: 'Liability' },
  ];

  for (const g of groups) {
    await prisma.accountGroup.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    }); 
  }
  console.log("Account Groups Created.");

  // 2. DEFAULT SYSTEM LEDGERS
  const cashGroup = await prisma.accountGroup.findUnique({ where: { code: "G07" } });
  const labourGroup = await prisma.accountGroup.findUnique({ where: { code: "G06" } });

  if (!cashGroup || !labourGroup) throw new Error("Groups missing!");




 const creditorsGroup = await prisma.accountGroup.upsert({
  where: { code: 'G02' },
  update: {},
  create: { 
    code: 'G02', 
    name: 'SUNDRY CREDITORS', 
    reportType: 'Balance Sheet', 
    groupType: 'Liability' 
  }
});

console.log("Sundry Creditors Group Created!");
  // Main Cash Account (Galla)
  const cashLedger = await prisma.ledger.upsert({
    where: { code: "CASH01" },
    update: {},
    create: {
      code: "CASH01",
      name: "MAIN CASH ACCOUNT (GALLA)",
      groupId: cashGroup.id,
      openingBalance: 0,
      openingMode: "Debit",
    },
  });

  // Labour Expense Account
  const labourLedger = await prisma.ledger.upsert({
    where: { code: "LAB01" },
    update: {},
    create: {
      code: "LAB01",
      name: "LABOUR EXPENSE ACCOUNT",
      groupId: labourGroup.id,
      openingBalance: 0,
      openingMode: "Debit",
    },
  });
  console.log("✅ Default Ledgers Created.");

  // 3. AUTO-MAPPINGS (System Settings)
  const settings = [
    { key: "CASH_LEDGER_ID", value: cashLedger.id },
    { key: "LABOUR_EXPENSE_ID", value: labourLedger.id },
  ];

  for (const s of settings) {
    await prisma.systemSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✅ System Mappings Set.");

  console.log("⭐ SEEDING COMPLETED! Your ERP is ready to use.");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Pool ko band karna zaroori hai
  });

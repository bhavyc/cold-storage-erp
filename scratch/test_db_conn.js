require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function run() {
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log("Connecting using DATABASE_URL:", connectionString);
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    console.log("Querying first party...");
    const party = await prisma.party.findFirst();
    console.log("Database connection successful!");
    console.log("Sample Party tradeName:", party ? party.tradeName : "No parties found");
    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error("Database connection failed!", error);
  }
}

run();

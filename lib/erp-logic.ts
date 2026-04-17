// src/lib/erp-logic.ts

import { Prisma } from "@prisma/client";

// import { Decimal } from "@prisma/client/runtime";
/**
 * 1. WEIGHT ENGINE
 * Logic: Total Weight - (Qty * Tare per unit)
 */


/**
 * 2. LABOR SPLIT ENGINE (Images 14 & 45 reference)
 * Logic: Kisan pays ₹20, Contractor gets ₹8 on Inward and ₹8 on Outward.
 * Margin stays in Cold Storage account.
 */
export const calculateLaborLiability = (
  qty: number, 
  rate: number, // Customer Rate (e.g., 20)
  contractorInRate: number, // (e.g., 8)
  contractorOutRate: number // (e.g., 8)
) => {
  return {
    customerTotalCharge: new Prisma.Decimal(qty).mul(rate),
    contractorInCredit: new Prisma.Decimal(qty).mul(contractorInRate),
    contractorOutCredit: new Prisma.Decimal(qty).mul(contractorOutRate),
    storageMargin: new Prisma.Decimal(qty).mul(rate - (contractorInRate + contractorOutRate))
  };
};

/**
 * 3. RENT PERIOD CALCULATOR (The "Red Button" Logic)
 * Logic: (End Date - Start Date) - Grace Days
 */
export const calculateRentDays = (arrivalDate: Date, billingDate: Date, graceDays: number): number => {
  const diffTime = Math.abs(billingDate.getTime() - arrivalDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const billableDays = diffDays - graceDays;
  return billableDays > 0 ? billableDays : 0;
};


export const calculateNetWeight = (qty: number, grossWeight: number, unitTare: number): number => {
  if (!qty || qty <= 0) return 0; // Fix
  const totalTare = qty * unitTare;
  return Math.max(0, grossWeight - totalTare);
};
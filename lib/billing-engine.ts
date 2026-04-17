import { Prisma } from "@prisma/client";

export class BillingEngine {
  // Logic from Image 11 & 51
  static applyPartyRules(party: any, lot: any) {
    let finalRentRate = lot.item.itemUnits[0].rentRate;
    
    // Rule 1: Special Rate override
    const specialRate = party.specialRates.find((r: any) => r.itemId === lot.itemId);
    if (specialRate) {
      finalRentRate = specialRate.csRent;
    }

    // Rule 2: Grace Days logic
    const graceDays = party.graceDays;

    return {
      finalRentRate,
      graceDays
    };
  }

  // Add logic for CA Bill (Commission Agent)
  static calculateCASurcharge(baseAmount: Prisma.Decimal, caRate: Prisma.Decimal) {
    return baseAmount.mul(caRate).div(100);
  }
}
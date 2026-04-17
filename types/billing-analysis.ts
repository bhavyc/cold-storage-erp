import { Prisma } from "@prisma/client";

export interface BillingAnalysisResponse {
  totals: {
    count: number;
    revenue: Prisma.Decimal;
    taxable: Prisma.Decimal;
    gst: Prisma.Decimal;
    rentOnly: Prisma.Decimal;
    labourOnly: Prisma.Decimal;
  };
  typeBreakdown: {
    billingType: string;
    _sum: { netAmount: Prisma.Decimal };
    _count: { id: number };
  }[];
  status: {
    paid: Prisma.Decimal;
    unpaid: Prisma.Decimal;
  };
  mis: {
    contractorExpense: Prisma.Decimal;
    netMargin: Prisma.Decimal;
  };
}
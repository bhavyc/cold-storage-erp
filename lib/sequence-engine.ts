import { prisma } from "./prisma";

export async function getNextNumber(entityType: string, tx: any) {
  // 1. Sequence table mein number badhao (Atomic Update - No Race Condition)
  const sequence = await tx.systemSequence.upsert({
    where: { entityType },
    update: { lastNumber: { increment: 1 } },
    create: { entityType, lastNumber: 1, prefix: "" }
  });

  // 2. Format karke bhejo (e.g., 1 -> "0001")
  const paddedNumber = sequence.lastNumber.toString().padStart(4, '0');
  const finalId = sequence.prefix ? `${sequence.prefix}${paddedNumber}` : paddedNumber;

  return finalId;
}

export async function peekNextNumber(entityType: string) {
  const sequence = await prisma.systemSequence.findUnique({
    where: { entityType }
  });

  const nextNum = (sequence?.lastNumber || 0) + 1;
  const paddedNumber = nextNum.toString().padStart(4, '0');
  const finalId = sequence?.prefix ? `${sequence.prefix}${paddedNumber}` : paddedNumber;

  return finalId;
}

/*
  Warnings:

  - You are about to drop the column `bankLedgerId` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `cashLedgerId` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `cgstLedgerId` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contractorLedgerId` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `labourExpenseId` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `sgstLedgerId` on the `SystemSettings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `SystemSettings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `SystemSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `SystemSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "bankLedgerId",
DROP COLUMN "cashLedgerId",
DROP COLUMN "cgstLedgerId",
DROP COLUMN "contractorLedgerId",
DROP COLUMN "labourExpenseId",
DROP COLUMN "sgstLedgerId",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "value" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

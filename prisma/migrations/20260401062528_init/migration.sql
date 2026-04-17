/*
  Warnings:

  - You are about to drop the column `maxMR` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `minMR` on the `Category` table. All the data in the column will be lost.
  - You are about to alter the column `length` on the `Chamber` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `breadth` on the `Chamber` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `height` on the `Chamber` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `discount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to alter the column `totalRent` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `totalLabour` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `taxableValue` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `cgst` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `sgst` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `igst` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `roundOff` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `netAmount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to drop the column `periodDays` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to alter the column `rentRate` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `labourRate` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `rentAmt` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `labourAmt` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to drop the column `grossWeight` on the `InwardEntry` table. All the data in the column will be lost.
  - You are about to drop the column `netWeight` on the `InwardEntry` table. All the data in the column will be lost.
  - You are about to drop the column `tareWeight` on the `InwardEntry` table. All the data in the column will be lost.
  - You are about to alter the column `gstRate` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `rentRate` on the `ItemUnitConfig` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `labourRate` on the `ItemUnitConfig` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `openingBalance` on the `Ledger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `maxCredit` on the `Ledger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to drop the column `netWeight` on the `Lot` table. All the data in the column will be lost.
  - You are about to drop the column `transReq` on the `OutwardEntry` table. All the data in the column will be lost.
  - You are about to alter the column `netWeight` on the `OutwardEntry` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to drop the column `agreementQty` on the `Party` table. All the data in the column will be lost.
  - You are about to drop the column `transportRate` on the `Party` table. All the data in the column will be lost.
  - You are about to alter the column `maxAllowedCredit` on the `Party` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `csRent` on the `PartyItemRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `csLab` on the `PartyItemRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `caRent` on the `PartyItemRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `caLab` on the `PartyItemRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `freight` on the `PartyItemRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `thresholdLimit` on the `TDSMaster` table. All the data in the column will be lost.
  - You are about to alter the column `tdsPercentage` on the `TDSMaster` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `emptyWeight` on the `Unit` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `rateToContractorIn` on the `Unit` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `rateToContractorOut` on the `Unit` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `accountHeadId` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `mode` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `narration` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `referenceNo` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `tdsAmount` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the `LedgerTransaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[gpNo]` on the table `OutwardEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupType` to the `AccountGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perUnitWgt` to the `Lot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalNetWgt` to the `Lot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTareWgt` to the `Lot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chamberId` to the `Pallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group` to the `Voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vocType` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'GATEKEEPER', 'ACCOUNTANT');

-- DropForeignKey
ALTER TABLE "LedgerTransaction" DROP CONSTRAINT "LedgerTransaction_ledgerId_fkey";

-- AlterTable
ALTER TABLE "AccountGroup" ADD COLUMN     "groupType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "maxMR",
DROP COLUMN "minMR",
ADD COLUMN     "maxMrGpNo" INTEGER,
ADD COLUMN     "minMrGpNo" INTEGER;

-- AlterTable
ALTER TABLE "Chamber" ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "totalPallets" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "length" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "breadth" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "height" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "discount",
ALTER COLUMN "totalRent" DROP DEFAULT,
ALTER COLUMN "totalRent" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "totalLabour" DROP DEFAULT,
ALTER COLUMN "totalLabour" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "taxableValue" DROP DEFAULT,
ALTER COLUMN "taxableValue" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "cgst" DROP DEFAULT,
ALTER COLUMN "cgst" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "sgst" DROP DEFAULT,
ALTER COLUMN "sgst" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "igst" DROP DEFAULT,
ALTER COLUMN "igst" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "roundOff" DROP DEFAULT,
ALTER COLUMN "roundOff" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "netAmount" DROP DEFAULT,
ALTER COLUMN "netAmount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "periodDays",
ADD COLUMN     "period" INTEGER NOT NULL,
ALTER COLUMN "rentRate" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "labourRate" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "rentAmt" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "labourAmt" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "InwardEntry" DROP COLUMN "grossWeight",
DROP COLUMN "netWeight",
DROP COLUMN "tareWeight",
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "gstRate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "ItemUnitConfig" ADD COLUMN     "lotValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "period" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weight" DECIMAL(10,3) NOT NULL DEFAULT 0,
ALTER COLUMN "rentRate" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "labourRate" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Ledger" ALTER COLUMN "openingBalance" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "maxCredit" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Lot" DROP COLUMN "netWeight",
ADD COLUMN     "perUnitWgt" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "totalNetWgt" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "totalTareWgt" DECIMAL(10,3) NOT NULL;

-- AlterTable
ALTER TABLE "OutwardEntry" DROP COLUMN "transReq",
ADD COLUMN     "transportRequired" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "netWeight" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Pallet" ADD COLUMN     "chamberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Party" DROP COLUMN "agreementQty",
DROP COLUMN "transportRate",
ADD COLUMN     "aadharNo" TEXT,
ADD COLUMN     "openingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "openingMode" TEXT NOT NULL DEFAULT 'Debit',
ADD COLUMN     "partyDocs" TEXT,
ADD COLUMN     "partyPhoto" TEXT,
ALTER COLUMN "type" SET DEFAULT 'Sundry Debtors',
ALTER COLUMN "maxAllowedCredit" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "PartyItemRate" ALTER COLUMN "csRent" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "csLab" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "caRent" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "caLab" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "freight" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "TDSMaster" DROP COLUMN "thresholdLimit",
ADD COLUMN     "minThreshold" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "tdsPercentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "opBalance" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "emptyWeight" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "rateToContractorIn" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "rateToContractorOut" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'OPERATOR';

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "accountHeadId",
DROP COLUMN "amount",
DROP COLUMN "mode",
DROP COLUMN "narration",
DROP COLUMN "referenceNo",
DROP COLUMN "tdsAmount",
DROP COLUMN "type",
ADD COLUMN     "group" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "vocType" TEXT NOT NULL;

-- DropTable
DROP TABLE "LedgerTransaction";

-- CreateTable
CREATE TABLE "VoucherItem" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "narration" TEXT,

    CONSTRAINT "VoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutwardEntry_gpNo_key" ON "OutwardEntry"("gpNo");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- AddForeignKey
ALTER TABLE "VoucherItem" ADD CONSTRAINT "VoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherItem" ADD CONSTRAINT "VoucherItem_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

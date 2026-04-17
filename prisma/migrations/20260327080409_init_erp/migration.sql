-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "partyCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "proprietor" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "contactPerson" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "transportRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "agreementQty" INTEGER NOT NULL DEFAULT 0,
    "mobiles" TEXT[],
    "gstType" TEXT,
    "stateName" TEXT,
    "stateCode" TEXT,
    "panNo" TEXT,
    "gstNo" TEXT,
    "bankName" TEXT,
    "branch" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
    "holderName" TEXT,
    "billNilLot" BOOLEAN NOT NULL DEFAULT false,
    "billMonthly" BOOLEAN NOT NULL DEFAULT false,
    "billTransport" BOOLEAN NOT NULL DEFAULT false,
    "billSpace" BOOLEAN NOT NULL DEFAULT false,
    "billBalance" BOOLEAN NOT NULL DEFAULT false,
    "billItemDay" BOOLEAN NOT NULL DEFAULT false,
    "billFixed" BOOLEAN NOT NULL DEFAULT false,
    "billCyclic" BOOLEAN NOT NULL DEFAULT false,
    "billDispatch" BOOLEAN NOT NULL DEFAULT false,
    "billItem" BOOLEAN NOT NULL DEFAULT false,
    "billGeneral" BOOLEAN NOT NULL DEFAULT false,
    "billWeekly" BOOLEAN NOT NULL DEFAULT false,
    "billUntouched" BOOLEAN NOT NULL DEFAULT false,
    "billLabour" BOOLEAN NOT NULL DEFAULT false,
    "billCA" BOOLEAN NOT NULL DEFAULT false,
    "billSlip" BOOLEAN NOT NULL DEFAULT false,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "maxAllowedCredit" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minLot" INTEGER,
    "maxLot" INTEGER,
    "minMR" INTEGER,
    "maxMR" INTEGER,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "hsnCode" TEXT,
    "gstRate" DECIMAL(65,30) NOT NULL DEFAULT 18.0,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "emptyWeight" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rateToContractorIn" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rateToContractorOut" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemUnitConfig" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "rentRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "labourRate" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "ItemUnitConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyItemRate" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "csRent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "csLab" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "caRent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "caLab" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "freight" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "PartyItemRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamber" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacityMode" TEXT NOT NULL,
    "length" DECIMAL(65,30),
    "breadth" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "totalCapacity" INTEGER NOT NULL,

    CONSTRAINT "Chamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pallet" (
    "id" TEXT NOT NULL,
    "palletNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Empty',
    "lotId" TEXT,

    CONSTRAINT "Pallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "mrNo" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "variety" TEXT,
    "unitId" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "floor" TEXT,
    "pole" TEXT,
    "palletNo" TEXT,
    "marka" TEXT,
    "pMarka" TEXT,
    "receivedQty" INTEGER NOT NULL,
    "balanceQty" INTEGER NOT NULL DEFAULT 0,
    "netWeight" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "uptoDate" TIMESTAMP(3),

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardEntry" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "mrDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "truckNo" TEXT,
    "deliveryPerson" TEXT,
    "grossWeight" DECIMAL(65,30) NOT NULL,
    "tareWeight" DECIMAL(65,30) NOT NULL,
    "netWeight" DECIMAL(65,30) NOT NULL,
    "billingType" TEXT,

    CONSTRAINT "InwardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutwardEntry" (
    "id" TEXT NOT NULL,
    "gpNo" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "gpDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qty" INTEGER NOT NULL,
    "netWeight" DECIMAL(65,30) NOT NULL,
    "personName" TEXT,
    "vehicleNo" TEXT,
    "grNo" TEXT,
    "transReq" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OutwardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockShifting" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "StockShifting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demand" (
    "id" TEXT NOT NULL,
    "demandNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandItem" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "DemandItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partyId" TEXT NOT NULL,
    "billingType" TEXT NOT NULL,
    "isProforma" BOOLEAN NOT NULL DEFAULT false,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "totalQty" INTEGER NOT NULL,
    "totalRent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalLabour" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxableValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cgst" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sgst" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "igst" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "roundOff" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "irnNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "rentRate" DECIMAL(65,30) NOT NULL,
    "labourRate" DECIMAL(65,30) NOT NULL,
    "rentAmt" DECIMAL(65,30) NOT NULL,
    "labourAmt" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "accountHeadId" TEXT NOT NULL,
    "partyId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "tdsAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referenceNo" TEXT,
    "narration" TEXT,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,

    CONSTRAINT "AccountGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "openingMode" TEXT NOT NULL DEFAULT 'Debit',
    "maxCredit" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledgerId" TEXT NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referenceId" TEXT,
    "narration" TEXT,
    "type" TEXT NOT NULL,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TDSMaster" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "panStatus" BOOLEAN NOT NULL DEFAULT true,
    "thresholdLimit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tdsPercentage" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "TDSMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrationMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "vocType" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "NarrationMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Party_partyCode_key" ON "Party"("partyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Chamber_code_key" ON "Chamber"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Pallet_palletNo_key" ON "Pallet"("palletNo");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_lotNo_key" ON "Lot"("lotNo");

-- CreateIndex
CREATE UNIQUE INDEX "InwardEntry_lotId_key" ON "InwardEntry"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Demand_demandNo_key" ON "Demand"("demandNo");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_voucherNo_key" ON "Voucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_code_key" ON "AccountGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_code_key" ON "Ledger"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NarrationMaster_code_key" ON "NarrationMaster"("code");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemUnitConfig" ADD CONSTRAINT "ItemUnitConfig_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemUnitConfig" ADD CONSTRAINT "ItemUnitConfig_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyItemRate" ADD CONSTRAINT "PartyItemRate_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardEntry" ADD CONSTRAINT "InwardEntry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardEntry" ADD CONSTRAINT "OutwardEntry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockShifting" ADD CONSTRAINT "StockShifting_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandItem" ADD CONSTRAINT "DemandItem_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandItem" ADD CONSTRAINT "DemandItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

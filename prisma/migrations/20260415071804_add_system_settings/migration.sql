-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default_settings',
    "cashLedgerId" TEXT,
    "bankLedgerId" TEXT,
    "labourExpenseId" TEXT,
    "contractorLedgerId" TEXT,
    "cgstLedgerId" TEXT,
    "sgstLedgerId" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

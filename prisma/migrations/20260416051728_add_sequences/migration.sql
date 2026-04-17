-- CreateTable
CREATE TABLE "SystemSequence" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "prefix" TEXT,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSequence_entityType_key" ON "SystemSequence"("entityType");

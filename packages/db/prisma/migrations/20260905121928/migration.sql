/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,payrunId]` on the table `payslips` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payslips_employeeId_periodStart_periodEnd_key";

-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "workedHours" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankIdentifierCode" TEXT,
ADD COLUMN     "bankName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employeeId_payrunId_key" ON "payslips"("employeeId", "payrunId");

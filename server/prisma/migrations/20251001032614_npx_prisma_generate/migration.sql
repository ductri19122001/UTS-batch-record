/*
  Warnings:

  - You are about to drop the column `productionUnit` on the `BatchRecord` table. All the data in the column will be lost.
  - You are about to drop the column `deviationType` on the `Deviation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Deviation` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `EnvironmentalReading` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Equipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentCheck` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Formulation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormulationIngredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaintenanceRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaterialIssuance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PackagingIssuance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PackagingMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessStep` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSpecification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QualityCheck` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RawMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RawMaterialSpecification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sample` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `YieldCalculation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bulk` to the `BatchRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finished` to the `BatchRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intermediate` to the `BatchRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shelfLifeMonths` to the `BatchRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `BatchRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SectionType" AS ENUM ('SECTION', 'SUBSECTION');

-- CreateEnum
CREATE TYPE "public"."SectionStatus" AS ENUM ('DRAFT', 'COMPLETED', 'PENDING_APPROVAL', 'APPROVED_FOR_CHANGE');

-- DropForeignKey
ALTER TABLE "public"."BatchRecord" DROP CONSTRAINT "BatchRecord_formulationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EnvironmentalReading" DROP CONSTRAINT "EnvironmentalReading_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EnvironmentalReading" DROP CONSTRAINT "EnvironmentalReading_recordedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."EquipmentCheck" DROP CONSTRAINT "EquipmentCheck_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EquipmentCheck" DROP CONSTRAINT "EquipmentCheck_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Formulation" DROP CONSTRAINT "Formulation_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FormulationIngredient" DROP CONSTRAINT "FormulationIngredient_formulationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FormulationIngredient" DROP CONSTRAINT "FormulationIngredient_rawMaterialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaintenanceRecord" DROP CONSTRAINT "MaintenanceRecord_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaterialIssuance" DROP CONSTRAINT "MaterialIssuance_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaterialIssuance" DROP CONSTRAINT "MaterialIssuance_issuedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaterialIssuance" DROP CONSTRAINT "MaterialIssuance_rawMaterialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PackagingIssuance" DROP CONSTRAINT "PackagingIssuance_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PackagingIssuance" DROP CONSTRAINT "PackagingIssuance_packagingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProcessStep" DROP CONSTRAINT "ProcessStep_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProcessStep" DROP CONSTRAINT "ProcessStep_performedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductSpecification" DROP CONSTRAINT "ProductSpecification_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QualityCheck" DROP CONSTRAINT "QualityCheck_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QualityCheck" DROP CONSTRAINT "QualityCheck_performedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."RawMaterialSpecification" DROP CONSTRAINT "RawMaterialSpecification_rawMaterialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sample" DROP CONSTRAINT "Sample_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."YieldCalculation" DROP CONSTRAINT "YieldCalculation_batchRecordId_fkey";

-- DropIndex
DROP INDEX "public"."BatchRecord_formulationId_idx";

-- DropIndex
DROP INDEX "public"."User_employeeId_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "batchRecordSectionId" TEXT;

-- AlterTable
ALTER TABLE "public"."BatchRecord" DROP COLUMN "productionUnit",
ADD COLUMN     "bulk" BOOLEAN NOT NULL,
ADD COLUMN     "finished" BOOLEAN NOT NULL,
ADD COLUMN     "intermediate" BOOLEAN NOT NULL,
ADD COLUMN     "shelfLifeMonths" INTEGER NOT NULL,
ADD COLUMN     "templateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Deviation" DROP COLUMN "deviationType",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "packSize" DROP NOT NULL,
ALTER COLUMN "packUnit" DROP NOT NULL,
ALTER COLUMN "shelfLife" DROP NOT NULL,
ALTER COLUMN "isActive" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "department",
DROP COLUMN "employeeId",
DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."EnvironmentalReading";

-- DropTable
DROP TABLE "public"."Equipment";

-- DropTable
DROP TABLE "public"."EquipmentCheck";

-- DropTable
DROP TABLE "public"."Formulation";

-- DropTable
DROP TABLE "public"."FormulationIngredient";

-- DropTable
DROP TABLE "public"."MaintenanceRecord";

-- DropTable
DROP TABLE "public"."MaterialIssuance";

-- DropTable
DROP TABLE "public"."PackagingIssuance";

-- DropTable
DROP TABLE "public"."PackagingMaterial";

-- DropTable
DROP TABLE "public"."ProcessStep";

-- DropTable
DROP TABLE "public"."ProductSpecification";

-- DropTable
DROP TABLE "public"."QualityCheck";

-- DropTable
DROP TABLE "public"."RawMaterial";

-- DropTable
DROP TABLE "public"."RawMaterialSpecification";

-- DropTable
DROP TABLE "public"."Sample";

-- DropTable
DROP TABLE "public"."YieldCalculation";

-- DropEnum
DROP TYPE "public"."Department";

-- DropEnum
DROP TYPE "public"."DeviationStatus";

-- DropEnum
DROP TYPE "public"."DeviationType";

-- DropEnum
DROP TYPE "public"."EquipmentType";

-- DropEnum
DROP TYPE "public"."QualityStatus";

-- DropEnum
DROP TYPE "public"."SampleType";

-- DropEnum
DROP TYPE "public"."StepType";

-- CreateTable
CREATE TABLE "public"."BatchRecordTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "BatchRecordTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BatchRecordSection" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "parentSectionId" TEXT,
    "sectionData" JSONB NOT NULL,
    "sectionType" "public"."SectionType" NOT NULL,
    "status" "public"."SectionStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "previousVersionId" TEXT,
    "approvalRequestId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "BatchRecordSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalRequest" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "parentSectionId" TEXT,
    "requestType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "existingData" JSONB,
    "proposedData" JSONB,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(6),
    "reviewComments" TEXT,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchRecordSection_batchRecordId_idx" ON "public"."BatchRecordSection"("batchRecordId");

-- CreateIndex
CREATE INDEX "BatchRecordSection_parentSectionId_idx" ON "public"."BatchRecordSection"("parentSectionId");

-- CreateIndex
CREATE INDEX "BatchRecordSection_sectionId_idx" ON "public"."BatchRecordSection"("sectionId");

-- CreateIndex
CREATE INDEX "BatchRecordSection_batchRecordId_sectionId_isActive_idx" ON "public"."BatchRecordSection"("batchRecordId", "sectionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BatchRecordSection_batchRecordId_sectionId_version_key" ON "public"."BatchRecordSection"("batchRecordId", "sectionId", "version");

-- CreateIndex
CREATE INDEX "ApprovalRequest_batchRecordId_idx" ON "public"."ApprovalRequest"("batchRecordId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_sectionId_idx" ON "public"."ApprovalRequest"("sectionId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "public"."ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_parentSectionId_idx" ON "public"."ApprovalRequest"("parentSectionId");

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."BatchRecordTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecordSection" ADD CONSTRAINT "BatchRecordSection_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecordSection" ADD CONSTRAINT "BatchRecordSection_parentSectionId_fkey" FOREIGN KEY ("parentSectionId") REFERENCES "public"."BatchRecordSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecordSection" ADD CONSTRAINT "BatchRecordSection_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "public"."BatchRecordSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecordSection" ADD CONSTRAINT "BatchRecordSection_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecordSection" ADD CONSTRAINT "BatchRecordSection_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

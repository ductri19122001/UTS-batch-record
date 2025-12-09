/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."Department" AS ENUM ('PRODUCTION', 'QUALITY', 'WAREHOUSE', 'MAINTENANCE', 'RND', 'SUPPLY_CHAIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('TABLET', 'CAPSULE', 'LIQUID', 'OINTMENT', 'POWDER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EquipmentType" AS ENUM ('BALANCE', 'BLENDER', 'GRANULATOR', 'FILLING', 'PACKAGING', 'HVAC', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CheckResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "public"."StepType" AS ENUM ('WEIGHING', 'MIXING', 'GRANULATION', 'DRYING', 'MILLING', 'BLENDING', 'COMPRESSION', 'COATING', 'FILLING', 'PACKING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ProcessStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."QualityCheckType" AS ENUM ('IN_PROCESS', 'LINE_CLEARANCE', 'FINAL', 'SAMPLING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."QualityStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'REWORK');

-- CreateEnum
CREATE TYPE "public"."SampleType" AS ENUM ('IN_PROCESS', 'BULK', 'FINISHED', 'STABILITY', 'ENVIRONMENTAL');

-- CreateEnum
CREATE TYPE "public"."DeviationType" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."DeviationStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'CLOSED');

-- DropTable
DROP TABLE "public"."user";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "department" "public"."Department" NOT NULL,
    "signature" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" "public"."ProductCategory" NOT NULL,
    "packSize" DOUBLE PRECISION NOT NULL,
    "packUnit" TEXT NOT NULL,
    "shelfLife" INTEGER NOT NULL,
    "storageConditions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Formulation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FormulationIngredient" (
    "id" TEXT NOT NULL,
    "formulationId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION,
    "mixingOrder" INTEGER,

    CONSTRAINT "FormulationIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RawMaterial" (
    "id" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "supplier" TEXT,
    "grade" TEXT,
    "storageConditions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackagingMaterial" (
    "id" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "supplier" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BatchRecord" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "formulationId" TEXT NOT NULL,
    "plannedQuantity" DOUBLE PRECISION NOT NULL,
    "actualQuantity" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "status" "public"."BatchStatus" NOT NULL,
    "manufacturingDate" TIMESTAMPTZ(6) NOT NULL,
    "expiryDate" TIMESTAMPTZ(6) NOT NULL,
    "productionUnit" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMPTZ(6),
    "releasedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaterialIssuance" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "lotNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "quantityRequired" DOUBLE PRECISION NOT NULL,
    "quantityIssued" DOUBLE PRECISION NOT NULL,
    "quantityUsed" DOUBLE PRECISION,
    "quantityReturned" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMPTZ(6),

    CONSTRAINT "MaterialIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackagingIssuance" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "packagingId" TEXT NOT NULL,
    "lotNumber" TEXT,
    "quantityRequired" INTEGER NOT NULL,
    "quantityIssued" INTEGER NOT NULL,
    "quantityUsed" INTEGER,
    "quantityReturned" INTEGER,
    "quantityRejected" INTEGER,

    CONSTRAINT "PackagingIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Equipment" (
    "id" TEXT NOT NULL,
    "equipmentCode" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "equipmentType" "public"."EquipmentType" NOT NULL,
    "location" TEXT,
    "calibrationDue" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipmentCheck" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "checkResult" "public"."CheckResult" NOT NULL,
    "checkWeight" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "performedBy" TEXT,
    "performedAt" TIMESTAMPTZ(6) NOT NULL,
    "comments" TEXT,

    CONSTRAINT "EquipmentCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcessStep" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" "public"."StepType" NOT NULL,
    "startTime" TIMESTAMPTZ(6),
    "endTime" TIMESTAMPTZ(6),
    "performedById" TEXT,
    "verifiedBy" TEXT,
    "parameters" JSONB,
    "status" "public"."ProcessStatus" NOT NULL,
    "comments" TEXT,

    CONSTRAINT "ProcessStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualityCheck" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "checkType" "public"."QualityCheckType" NOT NULL,
    "samplePoint" TEXT,
    "parameter" TEXT NOT NULL,
    "specification" TEXT,
    "result" TEXT,
    "unit" TEXT,
    "status" "public"."QualityStatus" NOT NULL,
    "performedById" TEXT,
    "performedAt" TIMESTAMPTZ(6),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(6),

    CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sample" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "sampleType" "public"."SampleType" NOT NULL,
    "sampleNumber" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "takenBy" TEXT,
    "takenAt" TIMESTAMPTZ(6) NOT NULL,
    "storageLocation" TEXT,
    "testResults" JSONB,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnvironmentalReading" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION,
    "readingTime" TIMESTAMPTZ(6) NOT NULL,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "EnvironmentalReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."YieldCalculation" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "issuedWeight" DOUBLE PRECISION,
    "unusedWeight" DOUBLE PRECISION,
    "usedWeight" DOUBLE PRECISION,
    "grossWeight" DOUBLE PRECISION,
    "netWeight" DOUBLE PRECISION,
    "wastageQuantity" DOUBLE PRECISION,
    "yieldPercentage" DOUBLE PRECISION,
    "theoreticalYield" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YieldCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Deviation" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "deviationType" "public"."DeviationType" NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "reportedById" TEXT NOT NULL,
    "reportedAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "public"."DeviationStatus" NOT NULL,
    "closedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Deviation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductSpecification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "lowerLimit" DOUBLE PRECISION,
    "upperLimit" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "unit" TEXT,
    "testMethod" TEXT,

    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RawMaterialSpecification" (
    "id" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "specification" TEXT,
    "testMethod" TEXT,

    CONSTRAINT "RawMaterialSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "batchRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMPTZ(6) NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "performedAt" TIMESTAMPTZ(6) NOT NULL,
    "performedBy" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "public"."User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "public"."Product"("productCode");

-- CreateIndex
CREATE INDEX "Formulation_productId_idx" ON "public"."Formulation"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Formulation_productId_version_key" ON "public"."Formulation"("productId", "version");

-- CreateIndex
CREATE INDEX "FormulationIngredient_formulationId_idx" ON "public"."FormulationIngredient"("formulationId");

-- CreateIndex
CREATE INDEX "FormulationIngredient_rawMaterialId_idx" ON "public"."FormulationIngredient"("rawMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "FormulationIngredient_formulationId_rawMaterialId_key" ON "public"."FormulationIngredient"("formulationId", "rawMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterial_materialCode_key" ON "public"."RawMaterial"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingMaterial_materialCode_key" ON "public"."PackagingMaterial"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "BatchRecord_batchNumber_key" ON "public"."BatchRecord"("batchNumber");

-- CreateIndex
CREATE INDEX "BatchRecord_productId_idx" ON "public"."BatchRecord"("productId");

-- CreateIndex
CREATE INDEX "BatchRecord_formulationId_idx" ON "public"."BatchRecord"("formulationId");

-- CreateIndex
CREATE INDEX "BatchRecord_createdBy_idx" ON "public"."BatchRecord"("createdBy");

-- CreateIndex
CREATE INDEX "BatchRecord_approvedBy_idx" ON "public"."BatchRecord"("approvedBy");

-- CreateIndex
CREATE INDEX "MaterialIssuance_batchRecordId_idx" ON "public"."MaterialIssuance"("batchRecordId");

-- CreateIndex
CREATE INDEX "MaterialIssuance_rawMaterialId_idx" ON "public"."MaterialIssuance"("rawMaterialId");

-- CreateIndex
CREATE INDEX "MaterialIssuance_issuedById_idx" ON "public"."MaterialIssuance"("issuedById");

-- CreateIndex
CREATE INDEX "PackagingIssuance_batchRecordId_idx" ON "public"."PackagingIssuance"("batchRecordId");

-- CreateIndex
CREATE INDEX "PackagingIssuance_packagingId_idx" ON "public"."PackagingIssuance"("packagingId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_equipmentCode_key" ON "public"."Equipment"("equipmentCode");

-- CreateIndex
CREATE INDEX "EquipmentCheck_batchRecordId_idx" ON "public"."EquipmentCheck"("batchRecordId");

-- CreateIndex
CREATE INDEX "EquipmentCheck_equipmentId_idx" ON "public"."EquipmentCheck"("equipmentId");

-- CreateIndex
CREATE INDEX "ProcessStep_batchRecordId_idx" ON "public"."ProcessStep"("batchRecordId");

-- CreateIndex
CREATE INDEX "ProcessStep_performedById_idx" ON "public"."ProcessStep"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessStep_batchRecordId_stepNumber_key" ON "public"."ProcessStep"("batchRecordId", "stepNumber");

-- CreateIndex
CREATE INDEX "QualityCheck_batchRecordId_idx" ON "public"."QualityCheck"("batchRecordId");

-- CreateIndex
CREATE INDEX "QualityCheck_performedById_idx" ON "public"."QualityCheck"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_sampleNumber_key" ON "public"."Sample"("sampleNumber");

-- CreateIndex
CREATE INDEX "Sample_batchRecordId_idx" ON "public"."Sample"("batchRecordId");

-- CreateIndex
CREATE INDEX "EnvironmentalReading_batchRecordId_idx" ON "public"."EnvironmentalReading"("batchRecordId");

-- CreateIndex
CREATE INDEX "EnvironmentalReading_recordedById_idx" ON "public"."EnvironmentalReading"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "YieldCalculation_batchRecordId_key" ON "public"."YieldCalculation"("batchRecordId");

-- CreateIndex
CREATE INDEX "Deviation_batchRecordId_idx" ON "public"."Deviation"("batchRecordId");

-- CreateIndex
CREATE INDEX "Deviation_reportedById_idx" ON "public"."Deviation"("reportedById");

-- CreateIndex
CREATE INDEX "ProductSpecification_productId_idx" ON "public"."ProductSpecification"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpecification_productId_parameter_key" ON "public"."ProductSpecification"("productId", "parameter");

-- CreateIndex
CREATE INDEX "RawMaterialSpecification_rawMaterialId_idx" ON "public"."RawMaterialSpecification"("rawMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterialSpecification_rawMaterialId_parameter_key" ON "public"."RawMaterialSpecification"("rawMaterialId", "parameter");

-- CreateIndex
CREATE INDEX "AuditLog_batchRecordId_idx" ON "public"."AuditLog"("batchRecordId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Attachment_batchRecordId_idx" ON "public"."Attachment"("batchRecordId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "public"."Attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_equipmentId_idx" ON "public"."MaintenanceRecord"("equipmentId");

-- AddForeignKey
ALTER TABLE "public"."Formulation" ADD CONSTRAINT "Formulation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormulationIngredient" ADD CONSTRAINT "FormulationIngredient_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "public"."Formulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormulationIngredient" ADD CONSTRAINT "FormulationIngredient_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "public"."RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "public"."Formulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssuance" ADD CONSTRAINT "MaterialIssuance_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssuance" ADD CONSTRAINT "MaterialIssuance_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "public"."RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialIssuance" ADD CONSTRAINT "MaterialIssuance_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackagingIssuance" ADD CONSTRAINT "PackagingIssuance_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackagingIssuance" ADD CONSTRAINT "PackagingIssuance_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "public"."PackagingMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentCheck" ADD CONSTRAINT "EquipmentCheck_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentCheck" ADD CONSTRAINT "EquipmentCheck_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessStep" ADD CONSTRAINT "ProcessStep_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessStep" ADD CONSTRAINT "ProcessStep_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityCheck" ADD CONSTRAINT "QualityCheck_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityCheck" ADD CONSTRAINT "QualityCheck_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sample" ADD CONSTRAINT "Sample_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnvironmentalReading" ADD CONSTRAINT "EnvironmentalReading_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnvironmentalReading" ADD CONSTRAINT "EnvironmentalReading_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."YieldCalculation" ADD CONSTRAINT "YieldCalculation_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deviation" ADD CONSTRAINT "Deviation_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deviation" ADD CONSTRAINT "Deviation_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RawMaterialSpecification" ADD CONSTRAINT "RawMaterialSpecification_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "public"."RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `data` on the `BatchRecordTemplate` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `BatchRecordTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BatchRecordTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."BatchRecordTemplate" DROP COLUMN "data",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateRule" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleData" JSONB NOT NULL,
    "targetSectionId" TEXT,
    "targetFieldId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateVersion_templateId_idx" ON "public"."TemplateVersion"("templateId");

-- CreateIndex
CREATE INDEX "TemplateVersion_isActive_idx" ON "public"."TemplateVersion"("isActive");

-- CreateIndex
CREATE INDEX "TemplateVersion_createdBy_idx" ON "public"."TemplateVersion"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "public"."TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "TemplateRule_templateId_idx" ON "public"."TemplateRule"("templateId");

-- CreateIndex
CREATE INDEX "TemplateRule_targetSectionId_idx" ON "public"."TemplateRule"("targetSectionId");

-- CreateIndex
CREATE INDEX "TemplateRule_targetFieldId_idx" ON "public"."TemplateRule"("targetFieldId");

-- CreateIndex
CREATE INDEX "TemplateRule_isActive_idx" ON "public"."TemplateRule"("isActive");

-- CreateIndex
CREATE INDEX "BatchRecordTemplate_createdBy_idx" ON "public"."BatchRecordTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "BatchRecordTemplate_isActive_idx" ON "public"."BatchRecordTemplate"("isActive");

-- AddForeignKey
ALTER TABLE "public"."BatchRecordTemplate" ADD CONSTRAINT "BatchRecordTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."BatchRecordTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateVersion" ADD CONSTRAINT "TemplateVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateRule" ADD CONSTRAINT "TemplateRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."BatchRecordTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

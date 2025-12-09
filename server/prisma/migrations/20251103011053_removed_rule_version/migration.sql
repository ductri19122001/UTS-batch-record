/*
  Warnings:

  - You are about to drop the column `templateVersionId` on the `TemplateRule` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TemplateRule" DROP CONSTRAINT "TemplateRule_templateVersionId_fkey";

-- AlterTable
ALTER TABLE "public"."TemplateRule" DROP COLUMN "templateVersionId";

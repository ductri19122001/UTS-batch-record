/*
  Warnings:

  - Added the required column `templateVersionId` to the `TemplateRule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TemplateRule" ADD COLUMN     "templateVersionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."TemplateRule" ADD CONSTRAINT "TemplateRule_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "public"."TemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

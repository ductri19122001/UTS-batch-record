/*
  Warnings:

  - Made the column `templateVersionId` on table `BatchRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."BatchRecord" DROP CONSTRAINT "BatchRecord_templateVersionId_fkey";

-- AlterTable
ALTER TABLE "public"."BatchRecord" ALTER COLUMN "templateVersionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "public"."TemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."BatchRecord" ADD COLUMN     "templateVersionId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."BatchRecord" ADD CONSTRAINT "BatchRecord_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "public"."TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

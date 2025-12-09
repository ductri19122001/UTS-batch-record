/*
  Warnings:

  - Changed the type of `ruleType` on the `TemplateRule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."RuleType" AS ENUM ('FIELD_VALIDATION', 'SECTION_DEPENDENCY', 'BUSINESS_RULE');

-- AlterTable
ALTER TABLE "public"."TemplateRule" DROP COLUMN "ruleType",
ADD COLUMN     "ruleType" "public"."RuleType" NOT NULL;

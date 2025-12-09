-- AlterTable: Remove meaning and reason columns from ElectronicSignature
ALTER TABLE "public"."ElectronicSignature" DROP COLUMN "meaning";
ALTER TABLE "public"."ElectronicSignature" DROP COLUMN "reason";


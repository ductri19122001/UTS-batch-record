-- CreateTable: ElectronicSignature
CREATE TABLE "public"."ElectronicSignature" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "meaning" TEXT NOT NULL,
  "reason" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "batchRecordId" TEXT,
  "sectionRecordId" TEXT,

  CONSTRAINT "ElectronicSignature_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ElectronicSignature_userId_idx" ON "public"."ElectronicSignature"("userId");
CREATE INDEX "ElectronicSignature_entity_idx" ON "public"."ElectronicSignature"("entityType", "entityId");
CREATE INDEX "ElectronicSignature_batchRecordId_idx" ON "public"."ElectronicSignature"("batchRecordId");
CREATE INDEX "ElectronicSignature_sectionRecordId_idx" ON "public"."ElectronicSignature"("sectionRecordId");

-- Foreign Keys
ALTER TABLE "public"."ElectronicSignature"
  ADD CONSTRAINT "ElectronicSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."ElectronicSignature"
  ADD CONSTRAINT "ElectronicSignature_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "public"."BatchRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."ElectronicSignature"
  ADD CONSTRAINT "ElectronicSignature_sectionRecordId_fkey" FOREIGN KEY ("sectionRecordId") REFERENCES "public"."BatchRecordSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;



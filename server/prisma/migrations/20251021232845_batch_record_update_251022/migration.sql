/*
  Warnings:

  - You are about to drop the column `bulk` on the `BatchRecord` table. All the data in the column will be lost.
  - You are about to drop the column `finished` on the `BatchRecord` table. All the data in the column will be lost.
  - You are about to drop the column `formulationId` on the `BatchRecord` table. All the data in the column will be lost.
  - You are about to drop the column `intermediate` on the `BatchRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BatchRecord" DROP COLUMN "bulk",
DROP COLUMN "finished",
DROP COLUMN "formulationId",
DROP COLUMN "intermediate";

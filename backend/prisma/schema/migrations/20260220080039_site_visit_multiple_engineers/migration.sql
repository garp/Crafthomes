/*
  Warnings:

  - You are about to drop the column `engineerId` on the `SiteVisit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."SiteVisit" DROP CONSTRAINT "SiteVisit_engineerId_fkey";

-- DropIndex
DROP INDEX "public"."SiteVisit_engineerId_idx";

-- AlterTable
ALTER TABLE "SiteVisit" DROP COLUMN "engineerId";

-- CreateTable
CREATE TABLE "SiteVisitEngineer" (
    "id" TEXT NOT NULL,
    "siteVisitId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisitEngineer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisitEngineer_siteVisitId_idx" ON "SiteVisitEngineer"("siteVisitId");

-- CreateIndex
CREATE INDEX "SiteVisitEngineer_engineerId_idx" ON "SiteVisitEngineer"("engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisitEngineer_siteVisitId_engineerId_key" ON "SiteVisitEngineer"("siteVisitId", "engineerId");

-- AddForeignKey
ALTER TABLE "SiteVisitEngineer" ADD CONSTRAINT "SiteVisitEngineer_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitEngineer" ADD CONSTRAINT "SiteVisitEngineer_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

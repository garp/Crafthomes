-- CreateEnum
CREATE TYPE "SiteVisitStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED');

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "siteVisitId" TEXT;

-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "status" "SiteVisitStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "summaryText" TEXT,
    "clientSignatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVisitTaskSnapshot" (
    "id" TEXT NOT NULL,
    "siteVisitId" TEXT NOT NULL,
    "originalTaskId" TEXT,
    "taskTitle" TEXT NOT NULL,
    "statusAtVisit" TEXT NOT NULL,
    "notes" TEXT,
    "completionPercentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisitTaskSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisit_projectId_idx" ON "SiteVisit"("projectId");

-- CreateIndex
CREATE INDEX "SiteVisit_engineerId_idx" ON "SiteVisit"("engineerId");

-- CreateIndex
CREATE INDEX "SiteVisit_status_idx" ON "SiteVisit"("status");

-- CreateIndex
CREATE INDEX "SiteVisitTaskSnapshot_siteVisitId_idx" ON "SiteVisitTaskSnapshot"("siteVisitId");

-- CreateIndex
CREATE INDEX "SiteVisitTaskSnapshot_originalTaskId_idx" ON "SiteVisitTaskSnapshot"("originalTaskId");

-- CreateIndex
CREATE INDEX "Attachment_siteVisitId_createdAt_idx" ON "Attachment"("siteVisitId", "createdAt");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitTaskSnapshot" ADD CONSTRAINT "SiteVisitTaskSnapshot_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitTaskSnapshot" ADD CONSTRAINT "SiteVisitTaskSnapshot_originalTaskId_fkey" FOREIGN KEY ("originalTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

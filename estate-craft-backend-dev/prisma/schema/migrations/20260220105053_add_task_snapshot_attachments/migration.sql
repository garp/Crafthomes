-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "siteVisitTaskSnapshotId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_siteVisitTaskSnapshotId_createdAt_idx" ON "Attachment"("siteVisitTaskSnapshotId", "createdAt");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_siteVisitTaskSnapshotId_fkey" FOREIGN KEY ("siteVisitTaskSnapshotId") REFERENCES "SiteVisitTaskSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

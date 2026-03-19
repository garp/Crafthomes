-- AlterTable
ALTER TABLE "SiteVisit" ADD COLUMN     "location" TEXT,
ADD COLUMN     "scheduledEndAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SiteVisitGalleryCollection" (
    "id" TEXT NOT NULL,
    "siteVisitId" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "displayOrder" INTEGER,
    "capturedAt" TIMESTAMP(3),
    "area" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisitGalleryCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVisitGalleryAttachment" (
    "id" TEXT NOT NULL,
    "siteVisitGalleryCollectionId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "displayOrder" INTEGER,
    "caption" TEXT,
    "takenAt" TIMESTAMP(3),
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisitGalleryAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisitGalleryCollection_siteVisitId_createdAt_idx" ON "SiteVisitGalleryCollection"("siteVisitId", "createdAt");

-- CreateIndex
CREATE INDEX "SiteVisitGalleryCollection_siteVisitId_displayOrder_idx" ON "SiteVisitGalleryCollection"("siteVisitId", "displayOrder");

-- CreateIndex
CREATE INDEX "SiteVisitGalleryAttachment_siteVisitGalleryCollectionId_dis_idx" ON "SiteVisitGalleryAttachment"("siteVisitGalleryCollectionId", "displayOrder");

-- CreateIndex
CREATE INDEX "SiteVisitGalleryAttachment_taskId_idx" ON "SiteVisitGalleryAttachment"("taskId");

-- AddForeignKey
ALTER TABLE "SiteVisitGalleryCollection" ADD CONSTRAINT "SiteVisitGalleryCollection_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitGalleryCollection" ADD CONSTRAINT "SiteVisitGalleryCollection_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitGalleryAttachment" ADD CONSTRAINT "SiteVisitGalleryAttachment_siteVisitGalleryCollectionId_fkey" FOREIGN KEY ("siteVisitGalleryCollectionId") REFERENCES "SiteVisitGalleryCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitGalleryAttachment" ADD CONSTRAINT "SiteVisitGalleryAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitGalleryAttachment" ADD CONSTRAINT "SiteVisitGalleryAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

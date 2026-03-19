-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TimesheetActivity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TimesheetActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimesheetActivity_name_idx" ON "TimesheetActivity"("name");

-- CreateIndex
CREATE INDEX "TimesheetActivity_createdAt_idx" ON "TimesheetActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "TimesheetActivity" ADD CONSTRAINT "TimesheetActivity_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

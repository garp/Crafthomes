/*
  Warnings:

  - You are about to drop the column `taskId` on the `Timesheet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Timesheet" DROP CONSTRAINT "Timesheet_taskId_fkey";

-- DropIndex
DROP INDEX "public"."Timesheet_projectId_userId_taskId_idx";

-- AlterTable
ALTER TABLE "Timesheet" DROP COLUMN "taskId";

-- CreateTable
CREATE TABLE "TimesheetTask" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TimesheetTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimesheetTask_timesheetId_idx" ON "TimesheetTask"("timesheetId");

-- CreateIndex
CREATE INDEX "TimesheetTask_taskId_idx" ON "TimesheetTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetTask_timesheetId_taskId_key" ON "TimesheetTask"("timesheetId", "taskId");

-- CreateIndex
CREATE INDEX "Timesheet_projectId_userId_idx" ON "Timesheet"("projectId", "userId");

-- AddForeignKey
ALTER TABLE "TimesheetTask" ADD CONSTRAINT "TimesheetTask_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetTask" ADD CONSTRAINT "TimesheetTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

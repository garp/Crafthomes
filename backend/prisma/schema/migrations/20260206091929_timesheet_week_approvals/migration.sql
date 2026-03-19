-- CreateEnum
CREATE TYPE "TimesheetWeekStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED');

-- CreateEnum
CREATE TYPE "TimesheetDecisionTargetType" AS ENUM ('ENTRY', 'WEEK');

-- CreateEnum
CREATE TYPE "TimesheetDecisionAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'BILL');

-- CreateEnum
CREATE TYPE "TimesheetReminderRecipientScope" AS ENUM ('EMPLOYEE', 'APPROVERS', 'MANAGEMENT', 'ADMINS');

-- CreateEnum
CREATE TYPE "TimesheetReminderChannel" AS ENUM ('EMAIL', 'IN_APP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TimesheetStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "TimesheetStatus" ADD VALUE 'BILLED';

-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "billedAt" TIMESTAMP(3),
ADD COLUMN     "billedBy" TEXT,
ADD COLUMN     "billingRef" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionComment" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedBy" TEXT,
ADD COLUMN     "timesheetWeekId" TEXT;

-- CreateTable
CREATE TABLE "TimesheetWeek" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "status" "TimesheetWeekStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionComment" TEXT,
    "billedAt" TIMESTAMP(3),
    "billedBy" TEXT,
    "billingRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TimesheetWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetApproverAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TimesheetApproverAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetDecisionLog" (
    "id" TEXT NOT NULL,
    "targetType" "TimesheetDecisionTargetType" NOT NULL,
    "action" "TimesheetDecisionAction" NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,
    "actorId" TEXT NOT NULL,
    "timesheetId" TEXT,
    "timesheetWeekId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimesheetDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetReminderRule" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "missedDays" INTEGER NOT NULL,
    "recipientScope" "TimesheetReminderRecipientScope" NOT NULL,
    "channel" "TimesheetReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "sendAtHour" INTEGER,
    "sendAtMinute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TimesheetReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetReminderLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "channel" "TimesheetReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "TimesheetReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimesheetWeek_userId_weekStartDate_idx" ON "TimesheetWeek"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "TimesheetWeek_status_weekStartDate_idx" ON "TimesheetWeek"("status", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetWeek_userId_weekStartDate_key" ON "TimesheetWeek"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "TimesheetApproverAssignment_employeeId_active_idx" ON "TimesheetApproverAssignment"("employeeId", "active");

-- CreateIndex
CREATE INDEX "TimesheetApproverAssignment_approverId_active_idx" ON "TimesheetApproverAssignment"("approverId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetApproverAssignment_employeeId_approverId_key" ON "TimesheetApproverAssignment"("employeeId", "approverId");

-- CreateIndex
CREATE INDEX "TimesheetDecisionLog_actorId_createdAt_idx" ON "TimesheetDecisionLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "TimesheetDecisionLog_timesheetId_createdAt_idx" ON "TimesheetDecisionLog"("timesheetId", "createdAt");

-- CreateIndex
CREATE INDEX "TimesheetDecisionLog_timesheetWeekId_createdAt_idx" ON "TimesheetDecisionLog"("timesheetWeekId", "createdAt");

-- CreateIndex
CREATE INDEX "TimesheetReminderRule_active_missedDays_idx" ON "TimesheetReminderRule"("active", "missedDays");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetReminderRule_missedDays_recipientScope_channel_key" ON "TimesheetReminderRule"("missedDays", "recipientScope", "channel");

-- CreateIndex
CREATE INDEX "TimesheetReminderLog_userId_date_channel_idx" ON "TimesheetReminderLog"("userId", "date", "channel");

-- CreateIndex
CREATE INDEX "TimesheetReminderLog_ruleId_date_idx" ON "TimesheetReminderLog"("ruleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetReminderLog_userId_ruleId_date_channel_key" ON "TimesheetReminderLog"("userId", "ruleId", "date", "channel");

-- CreateIndex
CREATE INDEX "Timesheet_userId_date_idx" ON "Timesheet"("userId", "date");

-- CreateIndex
CREATE INDEX "Timesheet_timesheetWeekId_status_idx" ON "Timesheet"("timesheetWeekId", "status");

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetWeek" ADD CONSTRAINT "TimesheetWeek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetApproverAssignment" ADD CONSTRAINT "TimesheetApproverAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetApproverAssignment" ADD CONSTRAINT "TimesheetApproverAssignment_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDecisionLog" ADD CONSTRAINT "TimesheetDecisionLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDecisionLog" ADD CONSTRAINT "TimesheetDecisionLog_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDecisionLog" ADD CONSTRAINT "TimesheetDecisionLog_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetReminderLog" ADD CONSTRAINT "TimesheetReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetReminderLog" ADD CONSTRAINT "TimesheetReminderLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TimesheetReminderRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

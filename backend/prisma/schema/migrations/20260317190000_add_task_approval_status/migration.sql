-- CreateEnum
CREATE TYPE "TaskApprovalStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "approvalStatus" "TaskApprovalStatus" NOT NULL DEFAULT 'PENDING';

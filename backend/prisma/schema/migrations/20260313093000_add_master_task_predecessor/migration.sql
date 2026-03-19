ALTER TABLE "MasterTask"
ADD COLUMN "predecessorTaskId" TEXT;

ALTER TABLE "MasterTask"
ADD CONSTRAINT "MasterTask_predecessorTaskId_fkey"
FOREIGN KEY ("predecessorTaskId") REFERENCES "MasterTask"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "MasterTask_predecessorTaskId_idx" ON "MasterTask"("predecessorTaskId");

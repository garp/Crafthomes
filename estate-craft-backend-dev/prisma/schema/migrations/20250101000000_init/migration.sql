-- CreateEnum
CREATE TYPE "ProjectUserType" AS ENUM ('INTERNAL', 'CLIENT_CONTACT');

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'IN_REVIEW', 'DELAYED');

-- CreateEnum
CREATE TYPE "FolderStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "MOMStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'INTERIM', 'FINAL', 'NA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'DRAFT', 'PROCESSING', 'REQUESTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_TRANSFER', 'OTHER', 'NA', 'CARD');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'INR', 'RMB');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "SnagStatus" AS ENUM ('PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED', 'TEMPORARY', 'DELETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TimelineStatus" AS ENUM ('PENDING', 'PENDING_APPROVAL', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INTERNAL', 'CLIENT', 'CLIENT_CONTACT', 'VENDOR', 'VENDOR_CONTACT');

-- CreateEnum
CREATE TYPE "UserInviteState" AS ENUM ('SENT', 'ACCEPTED', 'PASSWORD_ADDED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ProjectUser" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "userType" "ProjectUserType" NOT NULL DEFAULT 'INTERNAL',

    CONSTRAINT "ProjectUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activities" (
    "id" TEXT NOT NULL,
    "activityType" TEXT,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subTaskId" TEXT,
    "activity" TEXT[],
    "fieldUpdated" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "entityType" TEXT,
    "metadata" JSONB,
    "projectId" TEXT,

    CONSTRAINT "Activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "clientId" TEXT,
    "building" TEXT NOT NULL,
    "street" TEXT,
    "locality" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL,
    "landmark" TEXT,
    "country" TEXT NOT NULL DEFAULT 'INDIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "label" TEXT,
    "vendorId" TEXT,
    "pincodeCode" INTEGER NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "taskId" TEXT,
    "subTaskId" TEXT,
    "projectId" TEXT,
    "commentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "folderId" TEXT,
    "createdBy" TEXT,
    "description" TEXT,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "updatedBy" TEXT,
    "snagId" TEXT,
    "momId" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "media" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "brandId" TEXT,
    "media" JSONB[],

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategoryBrand" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "SubCategoryBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "sNo" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "clientType" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "gstIn" TEXT,
    "organizationName" TEXT,
    "panDetails" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "taskId" TEXT,
    "subTaskId" TEXT,
    "sNo" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "Status" DEFAULT 'ACTIVE',
    "deliverableStatus" "DeliverableStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "sNo" SERIAL NOT NULL,
    "description" TEXT,
    "displayName" TEXT,
    "meta" JSONB,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "FolderStatus" NOT NULL DEFAULT 'ACTIVE',
    "parentFolderId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masterItem" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "currency" "Currency" NOT NULL DEFAULT 'INR',
    "material" TEXT,
    "categoryId" TEXT,
    "colorCode" TEXT,
    "materialCode" TEXT,
    "subCategoryId" TEXT,
    "tags" TEXT[],
    "vendorId" TEXT,
    "mrp" INTEGER,
    "primaryFile" JSONB[],
    "secondaryFile" JSONB[],
    "materialFile" JSONB[],

    CONSTRAINT "masterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterPhase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedBy" TEXT,
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "MasterPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterPhaseMasterTask" (
    "id" TEXT NOT NULL,
    "masterPhaseId" TEXT NOT NULL,
    "masterTaskId" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "MasterPhaseMasterTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterTask" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedBy" TEXT,
    "sNo" SERIAL NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "MasterTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterTaskOrder" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "masterPhaseId" TEXT NOT NULL,
    "masterTaskId" TEXT NOT NULL,
    "projectTypeId" TEXT NOT NULL,

    CONSTRAINT "MasterTaskOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MOM" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "heldOn" TEXT,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "momStatus" "MOMStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "MOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "momAttendees" (
    "id" TEXT NOT NULL,
    "momId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "momAttendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + '00:05:00'::interval),
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" INTEGER NOT NULL,
    "identifier" TEXT,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "projectId" TEXT,
    "clientId" TEXT,
    "dueDate" TIMESTAMP(3),
    "subTotalAmount" INTEGER,
    "discount" INTEGER,
    "tax" INTEGER,
    "totalAmount" INTEGER,
    "paymentType" "PaymentType",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "referenceId" TEXT,
    "otherPaymentMethod" TEXT,
    "paymentMethod" "PaymentMethod",

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "paymentId" TEXT NOT NULL,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roleId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "masterPhaseId" TEXT,
    "projectId" TEXT NOT NULL,
    "timelineId" TEXT,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseOrder" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "phaseId" TEXT,
    "projectId" TEXT,
    "masterPhaseId" TEXT NOT NULL,
    "projectTypeId" TEXT NOT NULL,

    CONSTRAINT "PhaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterPhaseOrder" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "masterPhaseId" TEXT NOT NULL,
    "projectTypeId" TEXT NOT NULL,

    CONSTRAINT "MasterPhaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pincode" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "pincode" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "circle" TEXT,
    "region" TEXT,
    "division" TEXT,
    "office" TEXT,
    "officeType" TEXT,
    "delivery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Pincode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "logo" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "gstIn" TEXT,
    "taxId" TEXT,
    "bankAccountNumber" TEXT,
    "website" TEXT,
    "termsAndConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bankBranch" TEXT,
    "bankIFSC" TEXT,
    "bankName" TEXT,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT,
    "projectTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "assignProjectManager" TEXT,
    "endDate" TIMESTAMP(3),
    "estimatedBudget" INTEGER,
    "updatedBy" TEXT,
    "projectStatus" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "sNo" SERIAL NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'INR',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "state" TEXT,
    "assignClientContact" TEXT[],
    "description" TEXT,
    "addressId" TEXT,
    "duration" INTEGER,
    "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedBy" TEXT,
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "ProjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTypeGroup" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedBy" TEXT,

    CONSTRAINT "ProjectTypeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTypeGroupProjectType" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "projectTypeGroupId" TEXT NOT NULL,
    "projectTypeId" TEXT NOT NULL,

    CONSTRAINT "ProjectTypeGroupProjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTypeGroupOrder" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "projectTypeGroupId" TEXT NOT NULL,
    "projectTypeId" TEXT NOT NULL,

    CONSTRAINT "ProjectTypeGroupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTypeMasterPhase" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "projectTypeId" TEXT NOT NULL,
    "masterPhaseId" TEXT NOT NULL,

    CONSTRAINT "ProjectTypeMasterPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "quotationId" TEXT NOT NULL,
    "masterItemId" TEXT NOT NULL,
    "discount" INTEGER,
    "gst" INTEGER NOT NULL DEFAULT 18,
    "mrp" INTEGER,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "discount" INTEGER,
    "paidAmount" INTEGER,
    "quotationStatus" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "name" TEXT NOT NULL,
    "totalAmount" INTEGER,
    "projectId" TEXT,
    "startDate" TIMESTAMP(3),
    "description" TEXT,
    "remainingAmount" INTEGER,
    "policyId" TEXT,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sidebar" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "frontendName" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Sidebar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snag" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "snagCategory" TEXT NOT NULL DEFAULT 'OTHER',
    "snagSubCategory" TEXT DEFAULT 'OTHER',
    "priority" "Priority",
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "snagStatus" "SnagStatus" NOT NULL DEFAULT 'PENDING',
    "expectedCloseDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "projectId" TEXT,
    "otherCategory" TEXT,
    "otherSubCategory" TEXT,
    "vendorId" TEXT,

    CONSTRAINT "Snag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTask" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "parentTaskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignee" TEXT,
    "duration" TEXT,
    "notes" TEXT,
    "priority" "Priority",
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "description" TEXT,
    "status" "Status" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "taskStatus" "TaskStatus" DEFAULT 'PENDING',
    "unit" TEXT,
    "progress" INTEGER,
    "predecessorTaskId" TEXT,

    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "priority" "Priority",
    "sNo" SERIAL NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "phaseId" TEXT,
    "progress" INTEGER,
    "taskStatus" "TaskStatus" DEFAULT 'PENDING',
    "unit" TEXT,
    "updatedBy" TEXT,
    "status" "Status" DEFAULT 'ACTIVE',
    "description" TEXT,
    "endDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "plannedStart" TIMESTAMP(3),
    "duration" INTEGER,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPredecessor" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "predecessorTaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TaskPredecessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "timelineStatus" "TimelineStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentToId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelinePhaseOrder" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "timelineId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,

    CONSTRAINT "TimelinePhaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeLineTaskOrder" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "timelineId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,

    CONSTRAINT "TimeLineTaskOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT,
    "department" TEXT,
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3),
    "organization" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "roleId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "userType" "UserType" NOT NULL DEFAULT 'INTERNAL',
    "inviteState" "UserInviteState",
    "reason" TEXT,
    "clientId" TEXT,
    "vendorId" TEXT,
    "invitedBy" TEXT,
    "designationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialized" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "sNo" SERIAL NOT NULL,

    CONSTRAINT "Specialized_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "sNo" SERIAL NOT NULL,
    "panDetails" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSpecialized" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "specializedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorSpecialized_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectClientContacts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectClientContacts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ProjectUser_projectId_idx" ON "ProjectUser"("projectId");

-- CreateIndex
CREATE INDEX "ProjectUser_userId_idx" ON "ProjectUser"("userId");

-- CreateIndex
CREATE INDEX "ProjectUser_userType_idx" ON "ProjectUser"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUser_projectId_userId_key" ON "ProjectUser"("projectId", "userId");

-- CreateIndex
CREATE INDEX "Activities_userId_createdAt_idx" ON "Activities"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activities_taskId_createdAt_idx" ON "Activities"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Activities_subTaskId_createdAt_idx" ON "Activities"("subTaskId", "createdAt");

-- CreateIndex
CREATE INDEX "Activities_projectId_createdAt_idx" ON "Activities"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Activities_projectId_entityType_idx" ON "Activities"("projectId", "entityType");

-- CreateIndex
CREATE INDEX "Activities_entityType_createdAt_idx" ON "Activities"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AssignUser_userId_idx" ON "AssignUser"("userId");

-- CreateIndex
CREATE INDEX "Attachment_taskId_createdAt_idx" ON "Attachment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_subTaskId_createdAt_idx" ON "Attachment"("subTaskId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_projectId_createdAt_idx" ON "Attachment"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_commentId_createdAt_idx" ON "Attachment"("commentId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_folderId_createdAt_idx" ON "Attachment"("folderId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_snagId_createdAt_idx" ON "Attachment"("snagId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_momId_createdAt_idx" ON "Attachment"("momId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_taskId_createdAt_idx" ON "Comment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_subTaskId_createdAt_idx" ON "Comment"("subTaskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_name_key" ON "Designation"("name");

-- CreateIndex
CREATE INDEX "Designation_status_idx" ON "Designation"("status");

-- CreateIndex
CREATE INDEX "Designation_name_idx" ON "Designation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_name_key" ON "Folder"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MasterPhase_name_key" ON "MasterPhase"("name");

-- CreateIndex
CREATE INDEX "MasterPhase_name_status_createdAt_idx" ON "MasterPhase"("name", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MasterPhase_sNo_idx" ON "MasterPhase"("sNo");

-- CreateIndex
CREATE INDEX "MasterPhaseMasterTask_masterPhaseId_masterTaskId_idx" ON "MasterPhaseMasterTask"("masterPhaseId", "masterTaskId");

-- CreateIndex
CREATE INDEX "MasterTask_name_status_createdAt_idx" ON "MasterTask"("name", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MasterTask_sNo_idx" ON "MasterTask"("sNo");

-- CreateIndex
CREATE INDEX "MasterTaskOrder_projectTypeId_masterPhaseId_masterTaskId_idx" ON "MasterTaskOrder"("projectTypeId", "masterPhaseId", "masterTaskId");

-- CreateIndex
CREATE INDEX "MasterTaskOrder_sNo_idx" ON "MasterTaskOrder"("sNo");

-- CreateIndex
CREATE INDEX "MOM_projectId_momStatus_idx" ON "MOM"("projectId", "momStatus");

-- CreateIndex
CREATE INDEX "MOM_status_createdAt_idx" ON "MOM"("status", "createdAt");

-- CreateIndex
CREATE INDEX "momAttendees_userId_idx" ON "momAttendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "momAttendees_momId_userId_key" ON "momAttendees"("momId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Phase_projectId_idx" ON "Phase"("projectId");

-- CreateIndex
CREATE INDEX "Phase_timelineId_idx" ON "Phase"("timelineId");

-- CreateIndex
CREATE UNIQUE INDEX "Pincode_pincode_key" ON "Pincode"("pincode");

-- CreateIndex
CREATE INDEX "Pincode_state_idx" ON "Pincode"("state");

-- CreateIndex
CREATE INDEX "Pincode_district_idx" ON "Pincode"("district");

-- CreateIndex
CREATE INDEX "Pincode_city_idx" ON "Pincode"("city");

-- CreateIndex
CREATE INDEX "Policy_companyName_createdAt_idx" ON "Policy"("companyName", "createdAt");

-- CreateIndex
CREATE INDEX "Policy_sNo_idx" ON "Policy"("sNo");

-- CreateIndex
CREATE INDEX "Project_name_status_sNo_idx" ON "Project"("name", "status", "sNo");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_projectStatus_idx" ON "Project"("projectStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectType_name_key" ON "ProjectType"("name");

-- CreateIndex
CREATE INDEX "ProjectType_name_status_createdAt_idx" ON "ProjectType"("name", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectType_sNo_idx" ON "ProjectType"("sNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTypeGroup_name_key" ON "ProjectTypeGroup"("name");

-- CreateIndex
CREATE INDEX "ProjectTypeGroup_name_status_createdAt_idx" ON "ProjectTypeGroup"("name", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectTypeGroup_sNo_idx" ON "ProjectTypeGroup"("sNo");

-- CreateIndex
CREATE INDEX "ProjectTypeGroupProjectType_projectTypeGroupId_projectTypeI_idx" ON "ProjectTypeGroupProjectType"("projectTypeGroupId", "projectTypeId");

-- CreateIndex
CREATE INDEX "ProjectTypeGroupProjectType_sNo_idx" ON "ProjectTypeGroupProjectType"("sNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTypeGroupProjectType_projectTypeGroupId_projectTypeI_key" ON "ProjectTypeGroupProjectType"("projectTypeGroupId", "projectTypeId");

-- CreateIndex
CREATE INDEX "ProjectTypeGroupOrder_projectTypeGroupId_projectTypeId_idx" ON "ProjectTypeGroupOrder"("projectTypeGroupId", "projectTypeId");

-- CreateIndex
CREATE INDEX "ProjectTypeGroupOrder_sNo_idx" ON "ProjectTypeGroupOrder"("sNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTypeGroupOrder_projectTypeGroupId_projectTypeId_key" ON "ProjectTypeGroupOrder"("projectTypeGroupId", "projectTypeId");

-- CreateIndex
CREATE INDEX "ProjectTypeMasterPhase_projectTypeId_masterPhaseId_idx" ON "ProjectTypeMasterPhase"("projectTypeId", "masterPhaseId");

-- CreateIndex
CREATE INDEX "ProjectTypeMasterPhase_sNo_idx" ON "ProjectTypeMasterPhase"("sNo");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sidebar_roleId_key" ON "Sidebar"("roleId");

-- CreateIndex
CREATE INDEX "Task_phaseId_idx" ON "Task"("phaseId");

-- CreateIndex
CREATE INDEX "Task_status_createdAt_idx" ON "Task"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Task_taskStatus_idx" ON "Task"("taskStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskPredecessor_taskId_idx" ON "TaskPredecessor"("taskId");

-- CreateIndex
CREATE INDEX "TaskPredecessor_predecessorTaskId_idx" ON "TaskPredecessor"("predecessorTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskPredecessor_taskId_predecessorTaskId_key" ON "TaskPredecessor"("taskId", "predecessorTaskId");

-- CreateIndex
CREATE INDEX "Timeline_projectId_order_idx" ON "Timeline"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSpecialized_vendorId_specializedId_key" ON "VendorSpecialized"("vendorId", "specializedId");

-- CreateIndex
CREATE INDEX "_ProjectClientContacts_B_index" ON "_ProjectClientContacts"("B");

-- CreateIndex
CREATE INDEX "_ProjectToUser_B_index" ON "_ProjectToUser"("B");

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUser" ADD CONSTRAINT "ProjectUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_subTaskId_fkey" FOREIGN KEY ("subTaskId") REFERENCES "SubTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_pincodeCode_fkey" FOREIGN KEY ("pincodeCode") REFERENCES "Pincode"("pincode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignUser" ADD CONSTRAINT "AssignUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignUser" ADD CONSTRAINT "AssignUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_momId_fkey" FOREIGN KEY ("momId") REFERENCES "MOM"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_snagId_fkey" FOREIGN KEY ("snagId") REFERENCES "Snag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_subTaskId_fkey" FOREIGN KEY ("subTaskId") REFERENCES "SubTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "SubCategoryBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_subTaskId_fkey" FOREIGN KEY ("subTaskId") REFERENCES "SubTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masterItem" ADD CONSTRAINT "masterItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masterItem" ADD CONSTRAINT "masterItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masterItem" ADD CONSTRAINT "masterItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterPhaseMasterTask" ADD CONSTRAINT "MasterPhaseMasterTask_masterPhaseId_fkey" FOREIGN KEY ("masterPhaseId") REFERENCES "MasterPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterPhaseMasterTask" ADD CONSTRAINT "MasterPhaseMasterTask_masterTaskId_fkey" FOREIGN KEY ("masterTaskId") REFERENCES "MasterTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterTaskOrder" ADD CONSTRAINT "MasterTaskOrder_masterPhaseId_fkey" FOREIGN KEY ("masterPhaseId") REFERENCES "MasterPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterTaskOrder" ADD CONSTRAINT "MasterTaskOrder_masterTaskId_fkey" FOREIGN KEY ("masterTaskId") REFERENCES "MasterTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterTaskOrder" ADD CONSTRAINT "MasterTaskOrder_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momAttendees" ADD CONSTRAINT "momAttendees_momId_fkey" FOREIGN KEY ("momId") REFERENCES "MOM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "momAttendees" ADD CONSTRAINT "momAttendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_masterPhaseId_fkey" FOREIGN KEY ("masterPhaseId") REFERENCES "MasterPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "Timeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseOrder" ADD CONSTRAINT "PhaseOrder_masterPhaseId_fkey" FOREIGN KEY ("masterPhaseId") REFERENCES "MasterPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseOrder" ADD CONSTRAINT "PhaseOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseOrder" ADD CONSTRAINT "PhaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseOrder" ADD CONSTRAINT "PhaseOrder_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterPhaseOrder" ADD CONSTRAINT "MasterPhaseOrder_masterPhaseId_fkey" FOREIGN KEY ("masterPhaseId") REFERENCES "MasterPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterPhaseOrder" ADD CONSTRAINT "MasterPhaseOrder_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_assignProjectManager_fkey" FOREIGN KEY ("assignProjectManager") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTypeGroupProjectType" ADD CONSTRAINT "ProjectTypeGroupProjectType_projectTypeGroupId_fkey" FOREIGN KEY ("projectTypeGroupId") REFERENCES "ProjectTypeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTypeGroupProjectType" ADD CONSTRAINT "ProjectTypeGroupProjectType_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTypeGroupOrder" ADD CONSTRAINT "ProjectTypeGroupOrder_projectTypeGroupId_fkey" FOREIGN KEY ("projectTypeGroupId") REFERENCES "ProjectTypeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTypeGroupOrder" ADD CONSTRAINT "ProjectTypeGroupOrder_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTypeMasterPhase" ADD CONSTRAINT "ProjectTypeMasterPhase_masterPhaseId_fkey" FOREIGN KEY ("masterPhaseId") REFERENCES "MasterPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTypeMasterPhase" ADD CONSTRAINT "ProjectTypeMasterPhase_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_masterItemId_fkey" FOREIGN KEY ("masterItemId") REFERENCES "masterItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sidebar" ADD CONSTRAINT "Sidebar_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snag" ADD CONSTRAINT "Snag_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_predecessorTaskId_fkey" FOREIGN KEY ("predecessorTaskId") REFERENCES "SubTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPredecessor" ADD CONSTRAINT "TaskPredecessor_predecessorTaskId_fkey" FOREIGN KEY ("predecessorTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPredecessor" ADD CONSTRAINT "TaskPredecessor_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_sentToId_fkey" FOREIGN KEY ("sentToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePhaseOrder" ADD CONSTRAINT "TimelinePhaseOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePhaseOrder" ADD CONSTRAINT "TimelinePhaseOrder_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "Timeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLineTaskOrder" ADD CONSTRAINT "TimeLineTaskOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLineTaskOrder" ADD CONSTRAINT "TimeLineTaskOrder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLineTaskOrder" ADD CONSTRAINT "TimeLineTaskOrder_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "Timeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSpecialized" ADD CONSTRAINT "VendorSpecialized_specializedId_fkey" FOREIGN KEY ("specializedId") REFERENCES "Specialized"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSpecialized" ADD CONSTRAINT "VendorSpecialized_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectClientContacts" ADD CONSTRAINT "_ProjectClientContacts_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectClientContacts" ADD CONSTRAINT "_ProjectClientContacts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


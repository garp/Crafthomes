import type { TBaseArgs } from './common.types';

export type SiteVisitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';

export type TSiteVisitEngineer = {
  id: string;
  siteVisitId: string;
  engineerId: string;
  createdAt: string;
  engineer: {
    id: string;
    name: string;
    email: string;
  };
};

export type TSiteVisitTaskSnapshot = {
  id: string;
  siteVisitId: string;
  originalTaskId: string | null;
  taskTitle: string;
  statusAtVisit: string;
  notes: string | null;
  completionPercentage: number | null;
  createdAt: string;
  attachments?: TSiteVisitAttachment[];
};

export type TSiteVisitAttachment = {
  id: string;
  name: string;
  url: string;
  key: string | null;
  type: string | null;
};

export type SiteVisitPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TSiteVisit = {
  id: string;
  projectId: string;
  status: SiteVisitStatus;
  priority?: SiteVisitPriority | null;
  /** Completed tasks / total tasks * 100 (set by backend) */
  progress?: number | null;
  startedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  summaryText: string | null;
  clientSignatureUrl: string | null;
  createdAt: string;
  updatedAt: string;
  engineers: TSiteVisitEngineer[];
  taskSnapshots: TSiteVisitTaskSnapshot[];
  attachments: TSiteVisitAttachment[];
  project?: {
    id: string;
    name: string;
  };
};

export type TCreateSiteVisitBody = {
  projectId: string;
  status: SiteVisitStatus;
  priority?: SiteVisitPriority | null;
  startedAt: string;
  engineerIds: string[];
  summaryText?: string | null;
  taskSnapshots?: {
    originalTaskId?: string | null;
    taskTitle: string;
    statusAtVisit: string;
    notes?: string | null;
    completionPercentage?: number | null;
    attachments?: {
      name: string;
      url: string;
      key?: string;
      type?: string;
      mimeType?: string;
      size?: number;
    }[];
  }[];
  attachments?: {
    name: string;
    url: string;
    key?: string;
    type?: string;
    mimeType?: string;
    size?: number;
  }[];
};

export type TUpdateSiteVisitBody = Partial<Omit<TCreateSiteVisitBody, 'projectId'>> & {
  submittedAt?: string | null;
  reviewedAt?: string | null;
  summaryText?: string | null;
  clientSignatureUrl?: string | null;
};

export type TGetSiteVisitsArgs = TBaseArgs & {
  projectId: string;
  status?: SiteVisitStatus | null;
};

export type TGetSiteVisitsResponse = {
  data: {
    siteVisits: TSiteVisit[];
    totalCount: number;
  };
};

// Gallery collection (site visit photo galleries)
export type TGalleryCollectionAttachment = {
  id: string;
  siteVisitGalleryCollectionId: string;
  attachmentId: string;
  displayOrder: number | null;
  caption: string | null;
  takenAt: string | null;
  taskId: string | null;
  createdAt: string;
  attachment: TSiteVisitAttachment;
  task?: { id: string; name: string } | null;
};

export type TGalleryCollection = {
  id: string;
  siteVisitId: string;
  name: string | null;
  notes: string | null;
  createdBy: string | null;
  displayOrder: number | null;
  capturedAt: string | null;
  area: string | null;
  createdAt: string;
  createdByUser?: { id: string; name: string; email: string } | null;
  siteVisitGalleryAttachments: TGalleryCollectionAttachment[];
};

export type TGalleryAttachment = {
  id: string;
  siteVisitGalleryCollectionId: string;
  attachmentId: string;
  displayOrder: number | null;
  caption: string | null;
  takenAt: string | null;
  taskId: string | null;
  createdAt: string;
  attachment: TSiteVisitAttachment;
  task?: { id: string; name: string } | null;
};

/** API response shape for single gallery attachment (GET by id, POST create, PUT update) */
export type TGalleryAttachmentApiResponse = {
  data: TGalleryAttachment;
};

export type TCreateGalleryCollectionBody = {
  siteVisitId: string;
  name?: string | null;
  notes?: string | null;
  displayOrder?: number | null;
  capturedAt?: string | null;
  area?: string | null;
};

export type TUpdateGalleryCollectionBody = {
  name?: string | null;
  notes?: string | null;
  displayOrder?: number | null;
  capturedAt?: string | null;
  area?: string | null;
};

export type TCreateGalleryAttachmentBody = {
  siteVisitGalleryCollectionId: string;
  attachmentId: string;
  displayOrder?: number | null;
  caption?: string | null;
  takenAt?: string | null;
  taskId?: string | null;
};

export type TUpdateGalleryAttachmentBody = {
  displayOrder?: number | null;
  caption?: string | null;
  takenAt?: string | null;
  taskId?: string | null;
};

/** API response shape for list of gallery attachments (GET by collection id) */
export type TGalleryAttachmentsListApiResponse = {
  data: TGalleryAttachment[];
};

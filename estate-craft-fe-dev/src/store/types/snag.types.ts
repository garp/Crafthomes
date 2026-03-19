export type TSnagAttachment = {
  url: string;
  name: string;
  key: string;
  type: string;
};

export type TSnagStatus =
  | 'TEMPORARY'
  | 'PENDING'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED';

export type TSnag = {
  id: string;
  title: string;
  description: string;
  location: string;
  snagCategory: string;
  snagSubCategory: string;
  otherCategory?: string;
  otherSubCategory?: string;
  attachments: TSnagAttachment[];
  projectId: string;
  vendorId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  snagStatus?: TSnagStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

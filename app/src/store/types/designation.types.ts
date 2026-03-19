export type TDesignationMeta = {
  role: string;
  accessLevel: string;
};

export type TDesignation = {
  id: string;
  sNo: number;
  name: string;
  displayName: string;
  description: string;
  meta: TDesignationMeta;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export type TDesignationResponse = {
  designations: TDesignation[];
  totalCount: number;
};

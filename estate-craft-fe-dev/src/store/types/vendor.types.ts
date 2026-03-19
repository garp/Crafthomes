// ---------- Types ----------
export type TVendor = {
  id: string;
  sNo: number;
  name: string;
  phoneNumber: string;
  email: string;
  panDetails?: string | null;
  startDate: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  specializations: {
    id: string;
    specialized: {
      id: string;
      sNo: number;
      name: string;
    };
  }[];
};

export type TCreateVendorRequest = {
  specializedId: string;
  name: string;
  phoneNumber: string;
  startDate: string;
  email: string;
  panDetails?: string | null;
};

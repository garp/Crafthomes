export type TPolicy = {
  id: string;
  sNo: number;
  logo: string;
  companyName: string;
  address: string;
  pincode: number;
  city: string;
  state: string;
  country: string;
  website: string | null;
  termsAndConditions: string | null;
  gstIn: string | null;
  taxId: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankIFSC: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TPolicyResponse = {
  policies: TPolicy[];
  totalCount: number;
};

export type TCreatePolicyBody = {
  logo: string;
  companyName: string;
  address: string;
  pincode: number;
  city: string;
  state: string;
  country: string;
  website?: string;
  termsAndConditions?: string;
  gstIn?: string;
  taxId?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankName?: string;
  bankBranch?: string;
  bankIFSC?: string;
};

export type TProductCategory = {
  id: string;
  sNo: number;
  name: string;
  description: string;
  media?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  SubCategory?: {
    id: string;
    sNo: number;
    name: string;
    description: string;
    media?: string | null;
    brand?: {
      id: string;
      sNo: number;
      name: string;
    } | null;
  }[];
};

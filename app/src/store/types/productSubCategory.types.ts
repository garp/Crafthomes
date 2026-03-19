export type TProductSubCategory = {
  id: string;
  sNo: number;
  name: string;
  description: string;
  categoryId: string;
  media?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  status: string;
  brandId?: string | null;
};

export type TCreateProductSubCategoryBody = {
  name: string;
  description: string;
  categoryId: string;
  brandId?: string;
  media?: string;
};

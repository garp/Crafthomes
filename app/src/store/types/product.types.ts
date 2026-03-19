import type { TAttachment } from './common.types';
import type { TCurrency } from './project.types';

export type TProduct = {
  id: string;
  sNo: number;
  name: string;
  description: string;
  primaryFile?: TAttachment[] | null | undefined;
  secondaryFile?: TAttachment[] | null | undefined;
  category: {
    id: string;
    name: string;
  } | null;
  subCategory: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
  } | null;
  vendor: {
    id: string;
    name: string;
  } | null;
  unit?: {
    id: string;
    name: string;
    displayName?: string;
  } | null;
  materialFile?: TAttachment[] | null | undefined;
  materialCode?: string;
  colorCode?: string;
  mrp: number;
  currency: TCurrency;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
  status: string;
};
export type TCreateProductBody = {
  name: string;
  description: string;
  primaryFile?: TAttachment[] | null | undefined;
  secondaryFile?: TAttachment[] | null | undefined;
  categoryId: string | null;
  subCategoryId: string | null;
  vendorId: string | null;
  unitId?: string | null;
  material?: string | null;
  materialFile?: TAttachment[] | null | undefined;
  materialCode?: string | null;
  colorCode?: string;
  mrp?: number | null;
  currency: TCurrency;
  tags?: string[];
  status?: string;
};

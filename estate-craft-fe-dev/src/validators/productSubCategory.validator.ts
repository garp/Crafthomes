import * as yup from 'yup';
import { attachmentSchema } from './common.validators';

export const createProductSubCategorySchema = yup.object({
  name: yup.string().trim().required('Sub-Category name is required'),
  categoryId: yup.string().required('Category is required'),
  brandId: yup.string().nullable(),
  description: yup.string().trim().nullable(),
  media: yup.array().of(attachmentSchema).max(1, 'Max 1 file allowed').nullable(),
});

export type TCreateProductSubCategoryFormData = yup.InferType<
  typeof createProductSubCategorySchema
>;

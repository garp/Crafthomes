import * as yup from 'yup';
import { attachmentSchema } from './common.validators';

export const createProductCategorySchema = yup.object({
  name: yup.string().trim().required('Category name is required'),
  description: yup.string().trim().nullable(),
  attachments: yup.array().of(attachmentSchema).max(1, 'Max 1 file allowed'),
});

export type TCreateProductCategoryFormData = yup.InferType<typeof createProductCategorySchema>;

import * as Yup from 'yup';

export const createProductBrandSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Brand name must be at least 2 characters long')
    .max(100, 'Brand name cannot exceed 100 characters')
    .required('Brand name is required'),
});

export type TCreateProductBrandFormData = Yup.InferType<typeof createProductBrandSchema>;

import * as yup from 'yup';
import { currencySchema, multiAttachmentSchema, singleAttachmentSchema } from './common.validators';

export type TCreateProductFormData = yup.InferType<typeof createProductSchema>;

export const createProductSchema = yup.object({
  name: yup.string().trim().required('Product name is required'),
  description: yup.string().trim(),
  primaryFile: singleAttachmentSchema.nullable(),
  // .required('Primary image is required'),
  secondaryFile: multiAttachmentSchema.nullable(),
  // .required('Secondary image is required'),
  categoryId: yup.string().nullable(),
  subCategoryId: yup.string().nullable(),
  vendorId: yup.string().nullable(),
  // agent: yup.string().trim().required('Agent is required'),
  // material: yup.string().nullable(),
  materialFile: singleAttachmentSchema.nullable(),
  materialCode: yup.string().trim().nullable(),
  colorCode: yup.string().trim().nullable(),
  currency: currencySchema.required('Currency is required'),
  tags: yup.array().of(yup.string()).nullable(),
  mrp: yup
    .number()
    .typeError('M.R.P must be a number')
    .min(0, 'M.R.P must be positive')
    .required('MRP is required'),
  unitId: yup.string().nullable().label('Unit'),
  // costPrice: yup
  //   .number()
  //   .typeError('Cost Price must be a number')
  //   .min(0, 'Cost Price must be positive')
  //   .nullable(),
  // currencyConversionFactor: yup
  //   .number()
  //   .typeError('Conversion Factor must be a number')
  //   .min(0, 'Must be positive')
  //   .nullable(),
  // costFactor: yup
  //   .number()
  //   .typeError('Cost Factor must be a number')
  //   .min(0, 'Must be positive')
  //   .nullable(),
});

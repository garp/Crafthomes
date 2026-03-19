import * as yup from 'yup';

export const createSnagSchema = yup.object().shape({
  title: yup.string().required('Snag title is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
  snagCategory: yup.string().required('Snag category is required'),
  snagSubCategory: yup.string().required('Sub snag category is required'),
  otherCategory: yup.string().optional(),
  otherSubCategory: yup.string().optional(),
  snagStatus: yup
    .string()
    .oneOf(
      ['TEMPORARY', 'PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'],
      'Invalid status',
    )
    .optional(),
  attachments: yup
    .array()
    .of(
      yup.object().shape({
        url: yup.string().required('URL is required'),
        name: yup.string().required('Name is required'),
        key: yup.string().required('Key is required'),
        type: yup.string().required('Type is required'),
      }),
    )
    .min(1, 'At least one attachment is required')
    .required('Attachments are required'),
  projectId: yup.string().required('Project ID is required'),
  vendorId: yup.string().nullable().optional(),
});

export type TCreateSnagFormData = yup.InferType<typeof createSnagSchema>;

import * as yup from 'yup';

export const createQuotationSchema = yup.object().shape({
  projectId: yup.string().required('Project ID is required'),
  clientId: yup.string().required('Client is required').nullable(),
  addressId: yup.string().nullable().optional(),
  name: yup.string().required('Quotation name is required'),
  discount: yup
    .number()
    .min(0, 'Discount must be 0 or greater')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),
  paidAmount: yup
    .number()
    .min(0, 'Paid amount must be 0 or greater')
    .test('max-paid-amount', 'Paid amount cannot exceed total amount', function (value) {
      const { totalAmount } = this.parent;
      if (value === undefined || value === null) return true;
      return value <= (totalAmount || 0);
    })
    .default(0),
  totalAmount: yup.number().min(0, 'Total amount must be 0 or greater').default(0),
  description: yup.string().max(10000, 'Description cannot exceed 10,000 characters').optional(),
  policyId: yup.string().nullable().optional(),
  items: yup
    .array()
    .of(
      yup.object().shape({
        masterItemId: yup.string().required('Item is required'),
        quantity: yup
          .number()
          .min(1, 'Quantity must be at least 1')
          .required('Quantity is required'),
        discount: yup
          .number()
          .min(0, 'Discount must be 0 or greater')
          .max(100, 'Discount cannot exceed 100%')
          .default(0),
        total: yup.number().min(0, 'Total must be 0 or greater').required('Total is required'),
        mrp: yup.number().min(0, 'MRP must be 0 or greater').optional(),
        gst: yup.number().min(0).max(100).optional().nullable(),
        area: yup.string().max(200, 'Area name is too long').optional().nullable(),
        areaId: yup.string().uuid().optional().nullable(),
        unitId: yup.string().uuid().optional().nullable(),
        attachmentId: yup.string().uuid().optional().nullable(),
        attachmentUrl: yup.string().optional().nullable(),
      }),
    )
    .min(1, 'At least one item is required')
    .required('Items are required'),
});

export type TCreateQuotationFormData = yup.InferType<typeof createQuotationSchema>;

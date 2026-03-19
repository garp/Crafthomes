import * as yup from 'yup';

export const createInvoiceSchema = yup.object().shape({
  clientId: yup.string().required('Client is required').nullable(),
  dueDate: yup.date().required('Due date is required').nullable(),
  items: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required('Item name is required'),
        quantity: yup
          .number()
          .min(1, 'Quantity must be at least 1')
          .required('Quantity is required'),
        price: yup.number().min(0, 'Price must be 0 or greater').required('Price is required'),
        total: yup.number().min(0, 'Total must be 0 or greater').optional(),
      }),
    )
    .min(1, 'At least one item is required')
    .required('Items are required'),
  taxRate: yup.number().min(0, 'Tax rate must be 0 or greater').optional(),
  tax: yup.number().min(0, 'Tax must be 0 or greater').optional(),
  subtotal: yup.number().min(0, 'Subtotal must be 0 or greater').optional(),
  total: yup.number().min(0, 'Total must be 0 or greater').optional(),
});

export type TCreateInvoiceFormData = yup.InferType<typeof createInvoiceSchema>;

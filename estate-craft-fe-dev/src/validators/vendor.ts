import * as yup from 'yup';

export const addVendorSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  phoneNumber: yup
    .string()
    .trim()
    .required('Phone Number is required')
    .matches(/^[0-9]{10}$/, 'Phone Number must be 10 digits'),
  email: yup.string().trim().email('Invalid email address').required('Email is required'),
  panDetails: yup
    .string()
    .nullable()
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  specializedId: yup
    .array()
    .of(yup.string().trim().required('Specialization is required'))
    .min(1, 'At least one specialization is required')
    .required('Specialization is required'),
  startDate: yup.date().nullable().required('Start Date is required'),
  // Single address object for vendor
  address: yup
    .object()
    .shape({
      id: yup.string().nullable(),
      label: yup
        .string()
        .trim()
        .required('Label is required')
        .min(2, 'Label must be at least 2 characters')
        .max(50, 'Label must not exceed 50 characters'),
      building: yup
        .string()
        .trim()
        .required('Building is required')
        .min(2, 'Building must be at least 2 characters')
        .max(200, 'Building must not exceed 200 characters'),
      street: yup
        .string()
        .trim()
        .max(200, 'Street must not exceed 200 characters')
        .nullable()
        .notRequired(),
      locality: yup
        .string()
        .trim()
        .max(200, 'Locality must not exceed 200 characters')
        .nullable()
        .notRequired(),
      city: yup
        .string()
        .trim()
        .required('City is required')
        .max(100, 'City must not exceed 100 characters'),
      state: yup
        .string()
        .trim()
        .required('State is required')
        .max(100, 'State must not exceed 100 characters'),
      landmark: yup
        .string()
        .trim()
        .max(200, 'Landmark must not exceed 200 characters')
        .nullable()
        .notRequired(),
      pincode: yup
        .string()
        .trim()
        .required('Pincode is required')
        .matches(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
      country: yup
        .string()
        .trim()
        .required('Country is required')
        .max(100, 'Country must not exceed 100 characters'),
    })
    .required('Address is required'),
});

export type TAddVendorFormData = yup.InferType<typeof addVendorSchema>;

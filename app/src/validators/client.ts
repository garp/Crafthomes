import * as yup from 'yup';

export const addClientSchema = yup.object().shape({
  clientType: yup
    .mixed<'INDIVIDUAL' | 'ORGANIZATION'>()
    .oneOf(['INDIVIDUAL', 'ORGANIZATION'])
    .required('Client type is required'),
  name: yup.string().required('Name is required'),
  phoneNumber: yup
    .string()
    .matches(/^[0-9\-+() ]+$/, 'Invalid phone number')
    .required('Phone number is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  panDetails: yup
    .string()
    .nullable()
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  gstIn: yup
    .string()
    .nullable()
    .when('clientType', {
      is: 'ORGANIZATION',
      then: (schema) => schema.matches(/^[0-9A-Z]{15}$/, 'Invalid GSTIN format'),
      otherwise: (schema) => schema,
    }),
  addresses: yup
    .array()
    .of(
      yup.object().shape({
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
          .required('Street is required')
          .max(200, 'Street must not exceed 200 characters'),
        locality: yup
          .string()
          .trim()
          .max(200, 'Locality must not exceed 200 characters')
          .nullable()
          .notRequired(),
        city: yup.string().trim().required('City is required'),
        state: yup.string().trim().required('State is required'),
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
        country: yup.string().trim().required('Country is required'),
      }),
    )
    .min(1, 'At least one address is required')
    .required('At least one address is required'),
});

export type TCreateClientFormData = yup.InferType<typeof addClientSchema>;

// export const editClientSchema = yup.object().shape({
//   name: yup.string().required('Name is required'),
//   phoneNumber: yup
//     .string()
//     .matches(/^[0-9\-+() ]+$/, 'Invalid phone number')
//     .required('Phone number is required'),
//   email: yup.string().email('Invalid email address').required('Email is required'),
//   projectName: yup.string().required('Project name is required'),
//   startDate: yup.date().nullable().required('Start date is required'),
//   location: yup.string().required('Location is required'),
// });

import * as yup from 'yup';

export const createPolicySchema = yup.object({
  // Required fields
  logo: yup.string().url('Please enter a valid URL').required('Logo is required'),
  companyName: yup
    .string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must not exceed 200 characters'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
  pincode: yup
    .number()
    .required('Pincode is required')
    .min(100000, 'Please enter a valid 6-digit pincode')
    .max(999999, 'Please enter a valid 6-digit pincode'),
  city: yup
    .string()
    .required('City is required')
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  state: yup
    .string()
    .required('State is required')
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must not exceed 100 characters'),
  country: yup
    .string()
    .required('Country is required')
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must not exceed 100 characters'),

  // Optional fields
  website: yup.string().url('Please enter a valid URL').notRequired(),
  termsAndConditions: yup.string().required('Terms and conditions is required'),

  // Tax details
  gstIn: yup
    .string()
    .required('GST IN is required')
    .max(20, 'GST IN must not exceed 20 characters'),
  taxId: yup.string().max(50, 'Tax ID must not exceed 50 characters').notRequired(),

  // Banking details (all required)
  bankAccountNumber: yup
    .string()
    .required('Account number is required')
    .max(30, 'Bank account number must not exceed 30 characters'),
  bankAccountName: yup
    .string()
    .required('Account name is required')
    .max(100, 'Account name must not exceed 100 characters'),
  bankName: yup
    .string()
    .required('Bank name is required')
    .max(100, 'Bank name must not exceed 100 characters'),
  bankBranch: yup
    .string()
    .required('Branch name is required')
    .max(100, 'Branch name must not exceed 100 characters'),
  bankIFSC: yup
    .string()
    .required('IFSC code is required')
    .max(20, 'IFSC code must not exceed 20 characters')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code'),
});

export type TCreatePolicyFormData = yup.InferType<typeof createPolicySchema>;

export const updatePolicySchema = yup.object({
  logo: yup.string().url('Please enter a valid URL').notRequired(),
  companyName: yup
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must not exceed 200 characters')
    .notRequired(),
  address: yup
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters')
    .notRequired(),
  pincode: yup
    .number()
    .min(100000, 'Please enter a valid 6-digit pincode')
    .max(999999, 'Please enter a valid 6-digit pincode')
    .notRequired(),
  city: yup
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters')
    .notRequired(),
  state: yup
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must not exceed 100 characters')
    .notRequired(),
  country: yup
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must not exceed 100 characters')
    .notRequired(),
  website: yup.string().url('Please enter a valid URL').notRequired(),
  termsAndConditions: yup.string().notRequired(),
  gstIn: yup.string().max(20, 'GST IN must not exceed 20 characters').notRequired(),
  taxId: yup.string().max(50, 'Tax ID must not exceed 50 characters').notRequired(),
  bankAccountNumber: yup
    .string()
    .max(30, 'Bank account number must not exceed 30 characters')
    .notRequired(),
  bankAccountName: yup
    .string()
    .max(100, 'Account name must not exceed 100 characters')
    .notRequired(),
  bankName: yup.string().max(100, 'Bank name must not exceed 100 characters').notRequired(),
  bankBranch: yup.string().max(100, 'Branch name must not exceed 100 characters').notRequired(),
  bankIFSC: yup
    .string()
    .max(20, 'IFSC code must not exceed 20 characters')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$|^$/, 'Please enter a valid IFSC code')
    .notRequired(),
});

export type TUpdatePolicyFormData = yup.InferType<typeof updatePolicySchema>;

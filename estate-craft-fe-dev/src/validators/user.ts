import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email()
    .min(3, 'Email must be at least 3 characters')
    .max(100, 'Email cannot exceed 100 characters')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(64, 'Password cannot exceed 64 characters')
    .required('Password is required'),
});

// Phone number regex pattern (supports various formats)
const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;

export const addUserSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please enter a valid phone number'),

  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters'),

  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Password must contain at least one letter and one number',
    )
    .notRequired(),
  department: yup
    .string()
    .notRequired()
    .min(2, 'Department must be at least 2 characters')
    .max(50, 'Department must not exceed 50 characters'),
  designationId: yup.string().uuid('Invalid designation').notRequired(),
  roleId: yup.string().notRequired(),
  clientId: yup.string().notRequired(),
  vendorId: yup.string().notRequired(),
});

// Type inference from schema
export type TAddUserFormData = yup.InferType<typeof addUserSchema>;

export const editUserSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please enter a valid phone number'),

  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters'),

  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Password must contain at least one letter and one number',
    )
    .notRequired(),

  department: yup
    .string()
    .min(2, 'Department must be at least 2 characters')
    .max(50, 'Department must not exceed 50 characters')
    .notRequired(),

  designationId: yup.string().uuid('Invalid designation').notRequired(),
  roleId: yup.string().notRequired(),
  clientId: yup.string().notRequired(),
  vendorId: yup.string().notRequired(),
});

export type TEditUserFormData = yup.InferType<typeof editUserSchema>;

import * as yup from 'yup';

// Mirror of backend Joi.createInternalUserSchema for INTERNAL users
export const createInternalUserSchema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  roleId: yup.string().required('Role is required'),
  department: yup.string().max(100, 'Department must not exceed 100 characters').notRequired(),
  phoneNumber: yup.string().required('Phone number is required'),
  userType: yup.string().oneOf(['INTERNAL']).default('INTERNAL').notRequired(),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Password must contain at least one letter and one number',
    )
    .notRequired(),
  designationId: yup.string().uuid('Invalid designation').notRequired(),
  reportsToId: yup.string().uuid('Invalid user').notRequired().nullable(),
  profilePhoto: yup.string().url('Invalid URL').notRequired().nullable(),
});

export type TCreateInternalUserFormData = yup.InferType<typeof createInternalUserSchema>;

// Mirror of backend Joi.updateSchema for INTERNAL users
export const updateInternalUserSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .notRequired(),
  phoneNumber: yup.string().notRequired(),
  roleId: yup.string().notRequired(),
  department: yup.string().max(100, 'Department must not exceed 100 characters').notRequired(),
  status: yup.string().notRequired(),
  designationId: yup.string().uuid('Invalid designation').notRequired(),
  organization: yup.string().max(100, 'Organization must not exceed 100 characters').notRequired(),
  clientId: yup.string().nullable().notRequired(),
  vendorId: yup.string().nullable().notRequired(),
  reportsToId: yup.string().uuid('Invalid user').notRequired().nullable(),
  profilePhoto: yup.string().url('Invalid URL').notRequired().nullable(),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Password must contain at least one letter and one number',
    )
    .notRequired(),
});

export type TUpdateInternalUserFormData = yup.InferType<typeof updateInternalUserSchema>;

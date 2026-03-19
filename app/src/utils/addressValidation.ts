import * as yup from 'yup';

// Client address validation schema
export const clientAddressSchema = yup.object().shape({
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
});

// Vendor address validation schema
export const vendorAddressSchema = yup.object().shape({
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
});

// Validate client addresses
export async function validateClientAddresses(
  addresses: any[],
): Promise<{ isValid: boolean; invalidIndexes: number[] }> {
  const invalidIndexes: number[] = [];

  if (!addresses || addresses.length === 0) {
    return { isValid: false, invalidIndexes: [] };
  }

  for (let i = 0; i < addresses.length; i++) {
    try {
      await clientAddressSchema.validate(addresses[i], { abortEarly: false });
    } catch {
      invalidIndexes.push(i);
    }
  }

  return {
    isValid: invalidIndexes.length === 0,
    invalidIndexes,
  };
}

// Validate vendor address
export async function validateVendorAddress(address: any): Promise<boolean> {
  if (!address) {
    return false;
  }

  try {
    await vendorAddressSchema.validate(address, { abortEarly: false });
    return true;
  } catch {
    return false;
  }
}

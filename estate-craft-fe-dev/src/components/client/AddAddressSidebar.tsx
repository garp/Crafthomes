import React from 'react';
import { useFormikContext } from 'formik';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useDisclosure } from '@mantine/hooks';
import DrawerModal from '../base/DrawerModal';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import IconButton from '../base/button/IconButton';
import AlertModal from '../base/AlertModal';
import type { TAddAddressSidebarProps } from '../../types/client';
import type { TCreateClientFormData } from '../../validators/client';
import { useLazyGetPincodeDetailsQuery } from '../../store/services/pincode/pincodeSlice';
import { useDeleteClientAddressMutation } from '../../store/services/client/clientSlice';
import { clientAddressSchema } from '../../utils/addressValidation';

export function AddressRow({
  index,
  removeAddress,
}: {
  index: number;
  removeAddress: (index: number) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { values, handleBlur, handleChange, errors, touched } =
    useFormikContext<TCreateClientFormData>();
  const [deleteClientAddress, { isLoading: isDeleting }] = useDeleteClientAddressMutation();
  const [openedConfirm, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const handleDelete = async () => {
    const existingId = values.addresses?.[index]?.id;
    // If address exists in DB, call delete API first
    if (existingId) {
      try {
        await deleteClientAddress({ addressId: existingId }).unwrap();
      } catch {
        toast.error('Unable to delete address');
        return;
      }
    }
    // Always remove from local form state
    removeAddress(index);
    closeConfirm();
  };

  const addressErrors = (errors as any)?.addresses?.[index] || {};
  const addressTouched = (touched as any)?.addresses?.[index] || {};

  return (
    <div className=''>
      <div className='flex gap-2 items-center'>
        <div className='w-full flex flex-col gap-1'>
          <FormInput
            value={values.addresses?.[index]?.label || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            name={`addresses[${index}].label`}
            placeholder='Address Label'
            className='w-full mt-2 cursor-pointer'
            onClick={() => setIsOpen(true)}
            readOnly
            error={
              addressTouched?.label && addressErrors?.label
                ? (addressErrors.label as string)
                : undefined
            }
            rightSection={
              <IconButton type='button' onClick={() => setIsOpen(true)}>
                <IconArrowLeft className='size-4 rotate-180' />
              </IconButton>
            }
          />
        </div>
        <IconButton type='button' onClick={openConfirm}>
          <IconTrash className='text-text-subHeading size-5' />
        </IconButton>
      </div>
      <AddAddressSidebar index={index} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <AlertModal
        opened={openedConfirm}
        onClose={closeConfirm}
        title='Delete address?'
        subtitle="This action can't be undone"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function AddAddressSidebar({ isOpen, onClose, index }: TAddAddressSidebarProps) {
  const field = (name: string) => `addresses[${index}].${name}`;

  const {
    values: formValues,
    setFieldValue,
    setFieldTouched,
    handleBlur,
    handleChange,
    errors,
    touched,
  } = useFormikContext<TCreateClientFormData>();

  type TAddress = {
    label?: string;
    building?: string | null;
    street?: string | null;
    locality?: string | null;
    city?: string | null;
    state?: string | null;
    landmark?: string | null;
    pincode?: string | null;
    country?: string | null;
  };

  const addresses: TAddress[] = Array.isArray(formValues.addresses)
    ? (formValues.addresses as unknown as TAddress[])
    : [];
  const address = (addresses[index] || ({} as TAddress)) as TAddress;

  React.useEffect(() => {
    if (isOpen && !address?.country) {
      setFieldValue(field('country'), 'INDIA');
    }
  }, [address?.country, field, isOpen, setFieldValue]);

  // Get errors and touched state for this specific address
  const addressErrors = (errors as any)?.addresses?.[index] || {};
  const addressTouched = (touched as any)?.addresses?.[index] || {};

  const [triggerPincodeLookup, { isLoading: isFetchingPincode }] = useLazyGetPincodeDetailsQuery();

  // Function to fetch pincode details
  const fetchPincodeDetails = (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;

    triggerPincodeLookup({ pincode })
      .unwrap()
      .then((res) => {
        if (!res) return;
        setFieldValue(field('city'), res.city || '');
        setFieldValue(field('state'), res.state || '');
        setFieldValue(field('country'), res.country || 'INDIA');
      })
      .catch(() => {});
  };

  // Handle pincode change - auto-fetch when 6 digits entered
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, '');
    // Always store as string
    setFieldValue(field('pincode'), numeric);

    // Auto-fetch when 6 digits are entered
    if (numeric.length === 6) {
      fetchPincodeDetails(numeric);
    }
  };

  return (
    <DrawerModal opened={isOpen} onClose={onClose}>
      <div className='sticky top-0 z-20 gap-10 py-3 px-3 border-b border-gray-200 flex items-center bg-bg-light'>
        <IconButton onClick={onClose}>
          <IconArrowLeft className='size-5 text-text-subHeading' />
        </IconButton>
        <h2 className='mx-auto font-semibold text-gray-900'>{address?.label || 'Address'}</h2>
      </div>

      <div className='px-4 py-10 flex flex-col h-[92vh] gap-6'>
        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Label*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Office, Warehouse, Home...'
            name={field('label')}
            value={address?.label || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.label && addressErrors?.label
                ? (addressErrors.label as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Building*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Building / Flat'
            name={field('building')}
            value={address?.building || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.building && addressErrors?.building
                ? (addressErrors.building as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Street*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Street'
            name={field('street')}
            value={address?.street || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.street && addressErrors?.street
                ? (addressErrors.street as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Locality</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Locality'
            name={field('locality')}
            value={address?.locality || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.locality && addressErrors?.locality
                ? (addressErrors.locality as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Pincode*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Enter Pincode'
            name={field('pincode')}
            value={address?.pincode || ''}
            onChange={handlePincodeChange}
            onBlur={handleBlur}
            disabled={isFetchingPincode}
            maxLength={6}
            inputMode='numeric'
            error={
              addressTouched?.pincode && addressErrors?.pincode
                ? (addressErrors.pincode as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>City*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='City'
            name={field('city')}
            value={address?.city || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.city && addressErrors?.city
                ? (addressErrors.city as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>State*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='State'
            name={field('state')}
            value={address?.state || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.state && addressErrors?.state
                ? (addressErrors.state as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Landmark</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Landmark'
            name={field('landmark')}
            value={address?.landmark || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.landmark && addressErrors?.landmark
                ? (addressErrors.landmark as string)
                : undefined
            }
          />
        </div>

        <div className='flex items-center'>
          <FormLabel className='w-[35%]'>Country*</FormLabel>
          <FormInput
            className='w-[65%]'
            placeholder='Country'
            name={field('country')}
            value={address?.country ?? ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              addressTouched?.country && addressErrors?.country
                ? (addressErrors.country as string)
                : undefined
            }
          />
        </div>

        <Button
          radius='full'
          onClick={async () => {
            // Mark all address fields as touched to show errors
            const addressFields = [
              'label',
              'building',
              'street',
              'locality',
              'city',
              'state',
              'landmark',
              'pincode',
              'country',
            ];
            addressFields.forEach((fieldName) => {
              setFieldTouched(field(fieldName), true);
            });

            // Validate using yup schema
            try {
              const currentAddress = addresses[index] || {};
              const normalizedAddress = {
                ...currentAddress,
                country: currentAddress.country || 'INDIA',
              };
              await clientAddressSchema.validate(normalizedAddress, { abortEarly: false });
              setFieldValue(field('country'), normalizedAddress.country);
              // Validation passed, close the sidebar
              onClose();
            } catch (validationError: any) {
              // Validation failed, mark fields as touched to show errors
              if (validationError.inner) {
                validationError.inner.forEach((err: any) => {
                  setFieldTouched(field(err.path), true);
                });
              }
              // Don't close the sidebar if validation fails
            }
          }}
          className='mt-auto ml-auto'
        >
          Continue
        </Button>
      </div>
    </DrawerModal>
  );
}

import { toast } from 'react-toastify';

import type { TAddVendorSidebarProps } from '../../types/vendor';
import type { TErrorResponse } from '../../store/types/common.types';

import { type TAddVendorFormData } from '../../validators/vendor'; // <-- create Yup schema
import {
  useCreateVendorMutation,
  useGetVendorsQuery,
} from '../../store/services/vendor/vendorSlice';
import VendorForm from './VendorForm';
import SidebarModal from '../base/SidebarModal';

type Props = TAddVendorSidebarProps & {
  onCreated?: (id: string) => void;
  defaultName?: string;
};

export default function AddVendorSidebar({ isOpen, onClose, onCreated, defaultName }: Props) {
  const [createVendor, { isLoading: isCreatingVendor }] = useCreateVendorMutation();
  // Refetch vendors after creation to find the newly created vendor
  const { refetch: refetchVendors } = useGetVendorsQuery({ pageLimit: '100' }, { skip: true });

  function handleSubmit(values: TAddVendorFormData, resetForm: () => void) {
    createVendor(values)
      .unwrap()
      .then(async () => {
        toast.success('Vendor added successfully');

        // Since the API doesn't return the vendor ID, we need to refetch and find the vendor by name or email
        if (onCreated && (values.name || values.email)) {
          try {
            // Wait a bit for cache invalidation to complete
            await new Promise((resolve) => setTimeout(resolve, 500));
            const { data: vendorsData } = await refetchVendors();
            const newVendor = vendorsData?.vendor?.find(
              (v: any) =>
                (values.name && v.name === values.name) ||
                (values.email && v.email === values.email),
            );
            if (newVendor?.id) {
              onCreated(newVendor.id);
            }
          } catch (error) {
            console.error('Error finding created vendor:', error);
            // Continue anyway - the parent component will handle refetching
          }
        }

        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.error('Error adding vendor:', error);
      });
  }

  return (
    <SidebarModal heading='Add Vendor' onClose={onClose} opened={isOpen}>
      <VendorForm
        mode='create'
        initialValues={{
          name: defaultName || '',
          phoneNumber: '',
          email: '',
          panDetails: null,
          startDate: new Date(),
          specializedId: [],
          address: {
            id: null,
            label: '',
            building: '',
            street: '',
            locality: '',
            city: '',
            state: '',
            landmark: '',
            pincode: '',
            country: 'INDIA',
          },
        }}
        handleSubmit={handleSubmit}
        disabled={isCreatingVendor}
      />
    </SidebarModal>
  );
}

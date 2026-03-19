import { toast } from 'react-toastify';
import { useUpdateVendorMutation } from '../../store/services/vendor/vendorSlice';
import type { TEditVendorSidebarProps } from '../../types/vendor';
import type { TAddVendorFormData } from '../../validators/vendor';
import type { TErrorResponse } from '../../store/types/common.types';
import SidebarModal from '../base/SidebarModal';
import VendorForm from './VendorForm';

export default function EditVendorSidebar({
  isOpen,
  onClose,
  vendorData,
}: TEditVendorSidebarProps) {
  const [updateVendor, { isLoading: isCreatingVendor }] = useUpdateVendorMutation();

  function handleSubmit(values: TAddVendorFormData, resetForm: () => void) {
    updateVendor({ ...values, id: vendorData?.id || '' })
      .unwrap()
      .then(() => {
        toast.success('Vendor updated successfully');
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
        mode='edit'
        initialValues={{
          name: vendorData?.name || '',
          phoneNumber: vendorData?.phoneNumber || '',
          email: vendorData?.email || '',
          panDetails: (vendorData as any)?.panDetails || null,
          startDate: vendorData?.startDate ? new Date(vendorData?.startDate) : new Date(),
          specializedId: vendorData?.specializations?.map((sp) => sp?.specialized?.id) || [],
          address: {
            id:
              // try different possible backend shapes
              ((vendorData as any)?.address && (vendorData as any).address.id) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].id) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].id) ||
              null,
            label:
              ((vendorData as any)?.address && (vendorData as any).address.label) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].label) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].label) ||
              '',
            building:
              ((vendorData as any)?.address && (vendorData as any).address.building) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].building) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].building) ||
              '',
            street:
              ((vendorData as any)?.address && (vendorData as any).address.street) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].street) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].street) ||
              '',
            locality:
              ((vendorData as any)?.address && (vendorData as any).address.locality) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].locality) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].locality) ||
              '',
            city:
              ((vendorData as any)?.address && (vendorData as any).address.city) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].city) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].city) ||
              '',
            state:
              ((vendorData as any)?.address && (vendorData as any).address.state) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].state) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].state) ||
              '',
            landmark:
              ((vendorData as any)?.address && (vendorData as any).address.landmark) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].landmark) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].landmark) ||
              '',
            pincode:
              ((vendorData as any)?.address && (vendorData as any).address.pincode) ||
              ((vendorData as any)?.address && (vendorData as any).address.pincodeCode) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                ((vendorData as any).addresses[0].pincode ||
                  (vendorData as any).addresses[0].pincodeCode)) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                ((vendorData as any).Address[0].pincode?.pincode ||
                  (vendorData as any).Address[0].pincodeCode ||
                  (vendorData as any).Address[0].pincode)) ||
              '',
            country:
              ((vendorData as any)?.address && (vendorData as any).address.country) ||
              ((vendorData as any)?.addresses &&
                (vendorData as any).addresses[0] &&
                (vendorData as any).addresses[0].country) ||
              ((vendorData as any)?.Address &&
                (vendorData as any).Address[0] &&
                (vendorData as any).Address[0].country) ||
              'INDIA',
          },
        }}
        handleSubmit={handleSubmit}
        disabled={isCreatingVendor}
      />
    </SidebarModal>
  );
}

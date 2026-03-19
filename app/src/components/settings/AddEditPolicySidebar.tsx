import { toast } from 'react-toastify';
import {
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
} from '../../store/services/policy/policySlice';
import type { TCreatePolicyFormData } from '../../validators/policy';
import type { TErrorResponse } from '../../store/types/common.types';
import type { TPolicy } from '../../store/types/policy.types';
import SidebarModal from '../base/SidebarModal';
import PolicyForm from './PolicyForm';

type TAddEditPolicySidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  policyData?: TPolicy | null;
};

export default function AddEditPolicySidebar({
  isOpen,
  onClose,
  mode,
  policyData,
}: TAddEditPolicySidebarProps) {
  const [createPolicy, { isLoading: isCreating }] = useCreatePolicyMutation();
  const [updatePolicy, { isLoading: isUpdating }] = useUpdatePolicyMutation();

  const isSubmitting = mode === 'add' ? isCreating : isUpdating;
  const heading = mode === 'add' ? 'Add Policy' : 'Edit Policy';

  // Convert form data to API payload
  function transformFormDataToPayload(values: TCreatePolicyFormData) {
    return {
      logo: values.logo,
      companyName: values.companyName,
      address: values.address,
      pincode: values.pincode,
      city: values.city,
      state: values.state,
      country: values.country,
      website: values.website || undefined,
      termsAndConditions: values.termsAndConditions || undefined,
      gstIn: values.gstIn || undefined,
      taxId: values.taxId || undefined,
      bankAccountNumber: values.bankAccountNumber || undefined,
      bankAccountName: values.bankAccountName || undefined,
      bankName: values.bankName || undefined,
      bankBranch: values.bankBranch || undefined,
      bankIFSC: values.bankIFSC || undefined,
    };
  }

  function onSubmit(values: TCreatePolicyFormData, resetForm: () => void) {
    const payload = transformFormDataToPayload(values);

    if (mode === 'add') {
      createPolicy(payload)
        .unwrap()
        .then(() => {
          toast.success('Policy created successfully');
          resetForm();
          onClose();
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else toast.error('Internal server error');
          console.log('Error in creating policy:', error);
        });
    } else {
      if (!policyData?.id) {
        toast.error('Policy ID is missing');
        return;
      }
      updatePolicy({ id: policyData.id, ...payload })
        .unwrap()
        .then(() => {
          toast.success('Policy updated successfully');
          resetForm();
          onClose();
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else toast.error('Internal server error');
          console.log('Error in updating policy:', error);
        });
    }
  }

  const initialValues: TCreatePolicyFormData = {
    // Required fields
    logo: policyData?.logo || '',
    companyName: policyData?.companyName || '',
    address: policyData?.address || '',
    pincode: policyData?.pincode ?? ('' as unknown as number),
    city: policyData?.city || '',
    state: policyData?.state || '',
    country: policyData?.country || '',
    // Optional fields
    website: policyData?.website || '',
    termsAndConditions: policyData?.termsAndConditions || '',
    // Tax details
    gstIn: policyData?.gstIn || '',
    taxId: policyData?.taxId || '',
    // Banking details
    bankAccountNumber: policyData?.bankAccountNumber || '',
    bankAccountName: policyData?.bankAccountName || '',
    bankName: policyData?.bankName || '',
    bankBranch: policyData?.bankBranch || '',
    bankIFSC: policyData?.bankIFSC || '',
  };

  return (
    <SidebarModal heading={heading} opened={isOpen} onClose={onClose}>
      <div className='h-full bg-white'>
        <PolicyForm
          mode={mode}
          disabled={isSubmitting}
          onSubmit={onSubmit}
          initialValues={initialValues}
        />
      </div>
    </SidebarModal>
  );
}

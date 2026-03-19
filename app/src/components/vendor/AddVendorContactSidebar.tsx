import { toast } from 'react-toastify';
import { useCreateUserMutation, useLazyGetUsersQuery } from '../../store/services/user/userSlice';
import { useGetRolesQuery } from '../../store/services/role/roleSlice';
import SidebarModal from '../base/SidebarModal';
import { UserForm } from '../users/UserForm';
import type { TAddUserFormData } from '../../validators/user';

export type AddVendorContactSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  defaultName?: string;
  vendorId: string | null;
};

export const AddVendorContactSidebar = ({
  isOpen,
  onClose,
  onCreated,
  defaultName,
  vendorId,
}: AddVendorContactSidebarProps) => {
  const [createUser, { isLoading: isSubmitting }] = useCreateUserMutation();
  const { data: roles } = useGetRolesQuery();
  // Refetch users after creation to find the newly created contact
  const [refetchUsers] = useLazyGetUsersQuery();

  // Get vendor contact role
  const vendorContactRole = roles?.data?.find(
    (role) => role?.name?.toLowerCase?.() === 'vendor_client',
  );

  async function handleSubmit(values: TAddUserFormData, resetForm: () => void) {
    if (!vendorId) {
      toast.error('Please select a vendor first');
      return;
    }

    if (!vendorContactRole?.id) {
      toast.error('Vendor contact role not found');
      return;
    }

    try {
      const res: any = await createUser({
        ...values,
        roleId: vendorContactRole.id,
        vendorId: vendorId,
      }).unwrap();

      toast.success('Vendor contact added successfully');

      // Try to get ID from response first
      let createdId = res?.data?.id || res?.id;

      // If not in response, refetch and find by email
      if (!createdId && values.email && onCreated) {
        try {
          // Wait a bit for cache invalidation to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { data: usersData } = await refetchUsers({
            vendorId: vendorId,
            pageLimit: '100',
            userType: 'VENDOR_CONTACT',
          });
          const newContact = usersData?.users?.find((u: any) => u.email === values.email);
          if (newContact?.id) {
            createdId = newContact.id;
          }
        } catch (error) {
          console.error('Error finding created contact:', error);
          // Continue anyway - the parent component will handle refetching
        }
      }

      if (createdId && onCreated) {
        onCreated(createdId);
      }

      resetForm();
      onClose();
    } catch (error: any) {
      if (error?.data?.message) {
        toast.error(error?.data?.message);
      } else toast.error('Internal server error');
      console.log('Error in creating vendor contact:', error);
    }
  }

  const initialValues: TAddUserFormData = {
    name: defaultName || '',
    phoneNumber: '',
    email: '',
    department: '',
    password: '',
    designationId: '',
    roleId: vendorContactRole?.id || '',
    clientId: '',
    vendorId: vendorId || '',
  };

  return (
    <SidebarModal heading='Add Vendor Contact' opened={isOpen} onClose={onClose}>
      <div className='bg-white'>
        <UserForm
          mode='add'
          disabled={isSubmitting}
          onSubmit={handleSubmit}
          initialValues={initialValues}
        />
      </div>
    </SidebarModal>
  );
};

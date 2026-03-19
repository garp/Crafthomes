import { toast } from 'react-toastify';
import { useCreateUserMutation, useLazyGetUsersQuery } from '../../store/services/user/userSlice';
import { useGetRolesQuery } from '../../store/services/role/roleSlice';
import SidebarModal from '../base/SidebarModal';
import { UserForm } from '../users/UserForm';
import type { TAddUserFormData } from '../../validators/user';

export type AddClientContactSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  defaultName?: string;
  clientId: string | null;
};

export const AddClientContactSidebar = ({
  isOpen,
  onClose,
  onCreated,
  defaultName,
  clientId,
}: AddClientContactSidebarProps) => {
  const [createUser, { isLoading: isSubmitting }] = useCreateUserMutation();
  const { data: roles } = useGetRolesQuery();
  // Refetch users after creation to find the newly created contact
  const [refetchUsers] = useLazyGetUsersQuery();

  // Get client contact role
  const clientContactRole = roles?.data?.find(
    (role) => role?.name?.toLowerCase?.() === 'client_contact',
  );

  async function handleSubmit(values: TAddUserFormData, resetForm: () => void) {
    if (!clientId) {
      toast.error('Please select a client first');
      return;
    }

    if (!clientContactRole?.id) {
      toast.error('Client contact role not found');
      return;
    }

    try {
      const res: any = await createUser({
        ...values,
        roleId: clientContactRole.id,
        clientId: clientId,
      }).unwrap();

      toast.success('Client contact added successfully');

      // Try to get ID from response first
      let createdId = res?.data?.id || res?.id;

      // If not in response, refetch and find by email
      if (!createdId && values.email && onCreated) {
        try {
          // Wait a bit for cache invalidation to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { data: usersData } = await refetchUsers({
            clientId: clientId,
            pageLimit: '100',
            userType: 'CLIENT_CONTACT',
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
      console.log('Error in creating client contact:', error);
    }
  }

  const initialValues: TAddUserFormData = {
    name: defaultName || '',
    phoneNumber: '',
    email: '',
    department: '',
    password: '',
    designationId: '',
    roleId: clientContactRole?.id || '',
    clientId: clientId || '',
    vendorId: '',
  };

  return (
    <SidebarModal heading='Add Client Contact' opened={isOpen} onClose={onClose}>
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

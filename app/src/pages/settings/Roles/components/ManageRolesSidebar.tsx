import { useState } from 'react';
import { Button, Loader, Modal, TextInput, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconPower } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import SidebarModal from '../../../../components/base/SidebarModal';
import {
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useToggleRoleStatusMutation,
} from '../../../../store/services/role/roleSlice';
import type { TRole } from '../../../../store/types/roles.types';

type Props = {
  opened: boolean;
  onClose: () => void;
};

// System roles that cannot be deactivated
const PROTECTED_ROLES = [
  'super_admin',
  'admin',
  'client',
  'client_contact',
  'vendor',
  'vendor_contact',
];

// Display names for system roles
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  internal_user: 'Internal User',
  client: 'Client',
  client_contact: 'Client Contact',
  vendor: 'Vendor',
  vendor_contact: 'Vendor Contact',
};

const getRoleDisplayName = (name: string) => {
  return (
    ROLE_DISPLAY_NAMES[name] || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export default function ManageRolesSidebar({ opened, onClose }: Props) {
  const { data, isLoading } = useGetAllRolesQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [toggleRoleStatus, { isLoading: isToggling }] = useToggleRoleStatusMutation();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');

  // Status toggle confirmation modal
  const [toggleModalOpened, { open: openToggleModal, close: closeToggleModal }] =
    useDisclosure(false);
  const [toggleTarget, setToggleTarget] = useState<TRole | null>(null);

  const roles = data?.data || [];

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setNewName('');
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewName('');
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    // Convert to snake_case for internal name
    const internalName = newName.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      await createRole({ name: internalName }).unwrap();
      toast.success('Role created successfully');
      handleCancelAdd();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || 'Failed to create role');
    }
  };

  const handleToggleClick = (role: TRole) => {
    setToggleTarget(role);
    openToggleModal();
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;

    try {
      await toggleRoleStatus({ id: toggleTarget.id }).unwrap();
      toast.success(`Role ${toggleTarget.active ? 'deactivated' : 'activated'} successfully`);
      closeToggleModal();
      setToggleTarget(null);
    } catch {
      toast.error('Failed to update role status');
    }
  };

  const isSaving = isCreating || isToggling;

  return (
    <>
      <SidebarModal opened={opened} onClose={onClose} heading='Manage Roles'>
        <div className='flex flex-col h-full'>
          {/* Add New Button */}
          <div className='px-6 py-4 border-b'>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleStartAdd}
              disabled={isAddingNew}
              variant='outline'
              color='dark'
              fullWidth
            >
              Add New Role
            </Button>
          </div>

          {/* Add New Form */}
          {isAddingNew && (
            <div className='px-6 py-4 bg-gray-50 border-b'>
              <div className='space-y-3'>
                <TextInput
                  label='Role Name'
                  placeholder='e.g., Project Manager'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  size='sm'
                  description='Will be converted to snake_case internally'
                />
                <div className='flex gap-2 pt-2'>
                  <Button size='xs' onClick={handleSaveNew} loading={isCreating} color='dark'>
                    Save
                  </Button>
                  <Button size='xs' variant='outline' onClick={handleCancelAdd} color='dark'>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            {isLoading ? (
              <div className='flex justify-center py-8'>
                <Loader size='md' color='dark' />
              </div>
            ) : roles.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                No roles found. Add one to get started.
              </div>
            ) : (
              <div className='space-y-2'>
                {roles.map((role) => {
                  const isProtected = PROTECTED_ROLES.includes(role.name);

                  return (
                    <div
                      key={role.id}
                      className='group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all'
                    >
                      <div className='flex-1 min-w-0 flex items-center gap-2'>
                        <p className='font-medium text-gray-900 truncate'>
                          {getRoleDisplayName(role.name)}
                        </p>
                        {isProtected && (
                          <Badge size='xs' variant='outline' color='gray'>
                            System
                          </Badge>
                        )}
                        {!role.active && (
                          <Badge size='xs' variant='filled' color='gray'>
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        {!isProtected && (
                          <button
                            onClick={() => handleToggleClick(role)}
                            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                              role.active
                                ? 'text-gray-500 hover:text-gray-700'
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={role.active ? 'Deactivate' : 'Activate'}
                            disabled={isSaving}
                          >
                            <IconPower size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className='px-6 py-3 border-t bg-gray-50 text-xs text-gray-500'>
            System roles (Super Admin, Admin) cannot be deactivated.
          </div>
        </div>
      </SidebarModal>

      {/* Toggle Status Confirmation Modal */}
      <Modal
        opened={toggleModalOpened}
        onClose={closeToggleModal}
        title={toggleTarget?.active ? 'Deactivate Role' : 'Activate Role'}
        centered
        size='sm'
      >
        <p className='text-gray-600 mb-6'>
          Are you sure you want to {toggleTarget?.active ? 'deactivate' : 'activate'}{' '}
          <strong>{toggleTarget ? getRoleDisplayName(toggleTarget.name) : ''}</strong>?
          {toggleTarget?.active && (
            <span className='block mt-2 text-sm text-gray-500'>
              Users with this role will lose access until the role is reactivated.
            </span>
          )}
        </p>
        <div className='flex justify-end gap-3'>
          <Button variant='outline' color='dark' onClick={closeToggleModal}>
            Cancel
          </Button>
          <Button color='dark' onClick={handleConfirmToggle} loading={isToggling}>
            {toggleTarget?.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

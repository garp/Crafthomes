import { useState } from 'react';
import { Button, Loader, Modal, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import SidebarModal from '../../../../components/base/SidebarModal';
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '../../../../store/services/department/departmentSlice';
import type { TDepartment } from '../../../../store/services/department/departmentSlice';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function ManageDepartmentsSidebar({ opened, onClose }: Props) {
  const { data, isLoading } = useGetDepartmentsQuery({});
  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  // Delete confirmation modal
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const departments = data?.departments || [];

  const handleStartEdit = (department: TDepartment) => {
    setEditingId(department.id);
    setEditName(department.name);
    setEditDisplayName(department.displayName || '');
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDisplayName('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) {
      toast.error('Please fill in the name field');
      return;
    }

    try {
      await updateDepartment({
        id: editingId,
        name: editName.trim(),
        displayName: editDisplayName.trim() || undefined,
      }).unwrap();
      toast.success('Department updated successfully');
      handleCancelEdit();
    } catch {
      toast.error('Failed to update department');
    }
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setNewName('');
    setNewDisplayName('');
    handleCancelEdit();
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewName('');
    setNewDisplayName('');
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) {
      toast.error('Please fill in the name field');
      return;
    }

    try {
      await createDepartment({
        name: newName.trim(),
        displayName: newDisplayName.trim() || undefined,
      }).unwrap();
      toast.success('Department created successfully');
      handleCancelAdd();
    } catch {
      toast.error('Failed to create department');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await deleteDepartment(deleteTargetId).unwrap();
      toast.success('Department deleted successfully');
      closeDeleteModal();
      setDeleteTargetId(null);
      setDeleteTargetName('');
    } catch {
      toast.error('Failed to delete department');
    }
  };

  const isSaving = isCreating || isUpdating || isDeleting;

  return (
    <>
      <SidebarModal opened={opened} onClose={onClose} heading='Manage Departments'>
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
              Add New Department
            </Button>
          </div>

          {/* Add New Form */}
          {isAddingNew && (
            <div className='px-6 py-4 bg-gray-50 border-b'>
              <div className='space-y-3'>
                <TextInput
                  label='Name'
                  placeholder='e.g., engineering'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  size='sm'
                />
                <TextInput
                  label='Display Name'
                  placeholder='e.g., Engineering'
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  size='sm'
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
            ) : departments.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                No departments found. Add one to get started.
              </div>
            ) : (
              <div className='space-y-2'>
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className='group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all'
                  >
                    {editingId === department.id ? (
                      <div className='flex-1 space-y-2'>
                        <TextInput
                          placeholder='Name'
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          size='xs'
                        />
                        <TextInput
                          placeholder='Display Name'
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          size='xs'
                        />
                        <div className='flex gap-2 pt-1'>
                          <Button
                            size='xs'
                            onClick={handleSaveEdit}
                            loading={isUpdating}
                            color='dark'
                          >
                            Save
                          </Button>
                          <Button
                            size='xs'
                            variant='outline'
                            onClick={handleCancelEdit}
                            color='dark'
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-gray-900 truncate'>
                            {department.displayName || department.name}
                          </p>
                          <p className='text-xs text-gray-500 truncate'>{department.name}</p>
                        </div>
                        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                          <button
                            onClick={() => handleStartEdit(department)}
                            className='p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                            title='Edit'
                            disabled={isSaving}
                          >
                            <IconPencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                department.id,
                                department.displayName || department.name,
                              )
                            }
                            className='p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                            title='Delete'
                            disabled={isSaving}
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarModal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title='Delete Department'
        centered
        size='sm'
      >
        <p className='text-gray-600 mb-6'>
          Are you sure you want to delete <strong>{deleteTargetName}</strong>? This action cannot be
          undone.
        </p>
        <div className='flex justify-end gap-3'>
          <Button variant='outline' color='dark' onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button color='dark' onClick={handleConfirmDelete} loading={isDeleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

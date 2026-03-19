import { toast } from 'react-toastify';
import { useCreateProjectMutation } from '../../store/services/project/projectSlice';
import type { TErrorResponse } from '../../store/types/common.types';
import type { TCreateProjectSidebarProps, TProjectFormInitialValues } from '../../types/project';
// import { type TCreateProjectFormData } from '../../validators/project';
import SidebarModal from '../base/SidebarModal';
import ProjectForm from './ProjectForm';
import type { TOnSubmitArgs } from '../../types/common.types';
import type { TCurrency } from '../../store/types/project.types';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import ModalWrapper from '../base/ModalWrapper';
import { Button } from '../base';

export default function AddProjectSidebar({ isOpen, onClose }: TCreateProjectSidebarProps) {
  const [createProject, { isLoading: isSubmitting }] = useCreateProjectMutation();
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, { open: openDiscardConfirm, close: closeDiscardConfirm }] =
    useDisclosure(false);

  function handleCloseSidebar() {
    if (isDirty) {
      openDiscardConfirm();
    } else {
      closeSidebar();
    }
  }

  function closeSidebar() {
    setIsDirty(false);
    onClose();
  }

  function handleDiscardChanges() {
    closeDiscardConfirm();
    closeSidebar();
  }

  function handleCancelDiscard() {
    closeDiscardConfirm();
  }

  function onSubmit({ data, resetForm }: TOnSubmitArgs<TProjectFormInitialValues>) {
    // Ensure endDate (and any required Date fields) is never undefined, providing a fallback if missing.
    const { endDate, ...rest } = data;
    const formattedEndDate = endDate ?? new Date();

    createProject({ ...rest, endDate: formattedEndDate })
      .unwrap()
      .then(() => {
        toast.success('Project created successfully');
        resetForm();
        setIsDirty(false);
        closeSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error creating project:', error);
      });
  }
  const initialValues: TProjectFormInitialValues = {
    name: '',
    clientId: null,
    address: '',
    city: '',
    state: '',
    currency: 'INR' as TCurrency,
    estimatedBudget: 0,
    startDate: new Date(),
    endDate: null,
    assignProjectManager: null,
    assignClientContact: [],
    assignedInternalUsersId: [],
    projectTypeGroupId: null,
    projectTypeIds: [],
    description: '',
  };
  return (
    <>
      <SidebarModal heading='Add Project' opened={isOpen} onClose={handleCloseSidebar}>
        <ProjectForm
          mode='create'
          disabled={isSubmitting}
          onSubmit={onSubmit}
          initialValues={initialValues}
          onDirtyChange={setIsDirty}
        />
      </SidebarModal>

      {/* Discard Changes Confirmation Modal */}
      <ModalWrapper
        opened={showDiscardConfirm}
        onClose={handleCancelDiscard}
        title='Discard Changes?'
        centered
      >
        <p className='font-medium text-text-subHeading'>
          You have unsaved changes. Are you sure you want to discard them?
        </p>
        <div className='flex justify-end gap-3 mt-8'>
          <Button onClick={handleCancelDiscard} variant='outline'>
            Cancel
          </Button>
          <Button onClick={handleDiscardChanges} className='bg-red-500 hover:bg-red-600'>
            Discard Changes
          </Button>
        </div>
      </ModalWrapper>
    </>
  );
}

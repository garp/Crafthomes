import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import ProjectTypeForm from '../../../components/settings/ProjectTypeForm';
import { useCreateProjectTypeMutation } from '../../../store/services/projectType/projectTypeSlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import type { TCreateProjectTypeFormData } from '../../../validators/projectType';
import Breadcrumb from '../../../components/common/Breadcrumb';

export default function AddProjectTypePage() {
  // const [isOpenAddTaskDialog, { open: openAddTaskDialog, close: closeAddTaskDialog }] =
  //   useDisclosure(false);
  const navigate = useNavigate();
  const [createProjectType, { isLoading: isCreatingProjectType }] = useCreateProjectTypeMutation();
  const initialValues = useMemo(
    () => ({
      name: '',
      phases: [],
    }),
    [],
  );
  function onSubmit(data: TCreateProjectTypeFormData, resetForm: () => void) {
    createProjectType(data)
      .unwrap()
      .then(() => {
        toast.success('Project type added successfully');
        resetForm();
        navigate('/settings/phase?tab=phase&subtab=projectType');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.log('Error in creating Project type:', error);
      });
  }
  return (
    <>
      <div className='w-full h-full'>
        <Breadcrumb />
        <div className='mt-5 px-5 py-4 bg-white rounded-md ring ring-gray-100'>
          <div className='flex gap-3 items-center'>
            <Link
              to={'/settings/phase?tab=phase&subtab=projectType'}
              className='p-2.5 rounded-full bg-gray-100'
            >
              <IconArrowLeft className='size-4' />
            </Link>
            <p className='font-semibold'>Add Project Type</p>
          </div>

          {/* Reusable Form */}
          <ProjectTypeForm
            disabled={isCreatingProjectType}
            onSubmit={onSubmit}
            initialValues={initialValues}
            // onOpenAddPhase={openAddPhaseSidebar}
          />
        </div>
      </div>

      {/* <AddPhaseSidebar isOpen={isOpenAddPhaseSidebar} onClose={closeAddPhaseSidebar} /> */}
      {/* <AddTaskSidebar isOpen={isOpenAddTaskDialog} onClose={closeAddTaskDialog} /> */}
    </>
  );
}

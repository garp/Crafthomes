import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetProjectTypesQuery,
  useUpdateProjectTypeMutation,
} from '../../../../store/services/projectType/projectTypeSlice';
import ProjectTypeForm from '../../../../components/settings/ProjectTypeForm';
import Breadcrumb from '../../../../components/common/Breadcrumb';
import type { TErrorResponse } from '../../../../store/types/common.types';
import BackButton from '../../../../components/base/button/BackButton';
import { useGetPhasesByProjectTypeIdQuery } from '../../../../store/services/phase/phaseSlice';
import type { TCreateProjectTypeFormData } from '../../../../validators/projectType';
import Spinner from '../../../../components/common/loaders/Spinner';

export default function EditProjectTypePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: projectType, isLoading: isLoadingProjectType } = useGetProjectTypesQuery(
    { id },
    { skip: !id },
  );
  const { data: phasesData, isLoading: isLoadingPhases } = useGetPhasesByProjectTypeIdQuery(
    { projectTypeId: id || '' },
    { skip: !id },
  );
  const [updateProjectType, { isLoading: isUpdating }] = useUpdateProjectTypeMutation();

  // Build initial values with proper phases array
  const initialValues: TCreateProjectTypeFormData = {
    name: projectType?.projectTypes?.at(0)?.name || '',
    phases: phasesData?.masterPhases?.map((phase) => phase.id) || [],
  };

  // Default phases for the selector with name and id
  const defaultPhases =
    phasesData?.masterPhases?.map((phase) => ({
      name: phase.name,
      id: phase.id,
    })) || [];

  async function handleSubmit(data: TCreateProjectTypeFormData) {
    updateProjectType({ id: id!, ...data })
      .unwrap()
      .then(() => {
        toast.success('Project type updated successfully');
        navigate('/settings/phase?tab=phase&subtab=projectType');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error in updating Project type:', error);
      });
  }

  const isLoadingData = isLoadingProjectType || isLoadingPhases;

  return (
    <div className='w-full h-full'>
      <Breadcrumb />

      <div className='mt-5 px-5 py-4 bg-white rounded-md ring ring-gray-100 '>
        <BackButton backTo='/settings/phase?tab=phase&subtab=projectType'>
          Edit Project Type
        </BackButton>

        {isLoadingData ? (
          <div className='flex items-center justify-center py-20'>
            <Spinner className='size-8 text-primary' />
            <span className='ml-3 text-gray-500'>Loading project type...</span>
          </div>
        ) : (
          <ProjectTypeForm
            defaultPhases={defaultPhases}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            disabled={isUpdating}
          />
        )}
      </div>
    </div>
  );
}

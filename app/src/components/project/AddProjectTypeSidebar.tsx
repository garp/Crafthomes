import { toast } from 'react-toastify';
import SidebarModal from '../base/SidebarModal';
import ProjectTypeForm from '../settings/ProjectTypeForm';
import { useCreateProjectTypeMutation } from '../../store/services/projectType/projectTypeSlice';
import type { TCreateProjectTypeFormData } from '../../validators/projectType';
import type { TFunc } from '../../types/common.types';

type Props = {
  opened: boolean;
  onClose: TFunc;
  onCreated?: (id: string, payload?: { phases?: string[] }) => void;
  defaultName?: string;
};

export default function AddProjectTypeSidebar({ opened, onClose, onCreated, defaultName }: Props) {
  const [createProjectType, { isLoading }] = useCreateProjectTypeMutation();

  function handleSubmit(data: TCreateProjectTypeFormData, resetForm: () => void) {
    createProjectType(data)
      .unwrap()
      .then((res: any) => {
        toast.success('Project type created successfully');
        const createdId = res?.data?.id || res?.id || res?.[0]?.id;
        if (createdId && onCreated) {
          onCreated(createdId, { phases: data.phases });
        }
        resetForm();
        onClose();
      })
      .catch((error: any) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Unable to create project type');
        console.error('Error creating project type:', error);
      });
  }

  return (
    <SidebarModal heading='Add Project Type' opened={opened} onClose={onClose}>
      <div className='h-full bg-white px-6 pb-6 pt-4'>
        <ProjectTypeForm
          initialValues={{ name: defaultName || '', phases: [] }}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </SidebarModal>
  );
}

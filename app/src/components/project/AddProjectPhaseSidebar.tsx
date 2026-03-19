import { toast } from 'react-toastify';
import SidebarModal from '../base/SidebarModal';
import MasterPhaseForm from '../settings/MasterPhaseForm';
import { useAddMasterPhaseMutation } from '../../store/services/masterPhase/masterPhase';
import type { TCreateMasterPhaseFormData } from '../../validators/masterPhase';
import type { TFunc } from '../../types/common.types';

type Props = {
  opened: boolean;
  onClose: TFunc;
  projectTypeId?: string | null;
  onCreated?: (phase: { id: string; name: string; projectTypeId?: string | null }) => void;
  defaultName?: string;
};

export default function AddProjectPhaseSidebar({
  opened,
  onClose,
  projectTypeId,
  onCreated,
  defaultName,
}: Props) {
  const [createPhase, { isLoading }] = useAddMasterPhaseMutation();

  function handleSubmit({
    data,
    resetForm,
  }: {
    data: TCreateMasterPhaseFormData;
    resetForm: () => void;
  }) {
    createPhase(data)
      .unwrap()
      .then((res: any) => {
        console.log({ data });
        toast.success('Project phase created successfully');
        const createdId = res?.data?.id || res?.id;
        if (createdId && onCreated) {
          onCreated({ id: createdId, name: data.name, projectTypeId });
        }
        resetForm();
        onClose();
      })
      .catch((error: any) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Unable to create project phase');
        console.error('Error creating project phase:', error);
      });
  }

  return (
    <SidebarModal heading='Add Project Phase' opened={opened} onClose={onClose}>
      <div className='h-full bg-white'>
        <MasterPhaseForm
          mode='create'
          initialValues={{
            name: defaultName || '',
            description: undefined,
            masterTasks: [],
          }}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </SidebarModal>
  );
}

import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';

import SidebarModal from '../../../components/base/SidebarModal';
import FormInput from '../../../components/base/FormInput';
import { Button } from '../../../components/base';
import { useUpdateProjectTypeMutation } from '../../../store/services/projectType/projectTypeSlice';
import { useGetPhasesByProjectTypeIdQuery } from '../../../store/services/phase/phaseSlice';
import type { TErrorResponse } from '../../../store/types/common.types';
import type { TProjectType } from '../../../store/types/projectType.types';
import AddEditMasterPhaseSidebar from '../../../components/settings/AddEditMasterPhaseSidebar';
import Spinner from '../../../components/common/loaders/Spinner';
import type { TOption } from '../../../types/project';
import MasterPhaseMultiSelector from '../../../components/common/combobox/MasterPhaseMultiSelector';

type TEditTimelineTemplateSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  template: TProjectType | null;
};

const validationSchema = yup.object({
  name: yup
    .string()
    .required('Template name is required')
    .min(2, 'Name must be at least 2 characters'),
  phases: yup.array().of(yup.string()),
});

type TFormValues = {
  name: string;
  phases: string[];
};

export default function EditTimelineTemplateSidebar({
  isOpen,
  onClose,
  template,
}: TEditTimelineTemplateSidebarProps) {
  const [updateProjectType, { isLoading }] = useUpdateProjectTypeMutation();
  const [isOpenAddPhase, { open: openAddPhase, close: closeAddPhase }] = useDisclosure(false);
  const [pendingPhaseName, setPendingPhaseName] = useState<string>('');
  const [options, setOptions] = useState<TOption[]>([]);

  // Fetch current phases for this template
  const { data: phasesData, isLoading: isLoadingPhases } = useGetPhasesByProjectTypeIdQuery(
    { projectTypeId: template?.id || '' },
    { skip: !template?.id || !isOpen },
  );

  const initialValues: TFormValues = {
    name: template?.name || '',
    phases: phasesData?.masterPhases?.map((phase) => phase.id) || [],
  };

  // Default phases for the selector - memoized to prevent infinite loops
  const defaultPhases = useMemo(
    () =>
      phasesData?.masterPhases?.map((phase) => ({
        id: phase.id,
        name: phase.name,
      })) || [],
    [phasesData?.masterPhases],
  );

  function handlePhaseCreated(phaseName: string) {
    toast.info(`Phase "${phaseName}" created. Select it from the dropdown.`);
    setPendingPhaseName(phaseName);
    closeAddPhase();
    setTimeout(() => setPendingPhaseName(''), 2000);
  }

  function handleSubmit(values: TFormValues) {
    if (!template?.id) {
      toast.error('Template not found');
      return;
    }

    updateProjectType({
      id: template.id,
      name: values.name,
      phases: values.phases,
    })
      .unwrap()
      .then(() => {
        toast.success('Timeline template updated successfully');
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to update timeline template');
        }
        console.error('Error updating timeline template:', error);
      });
  }

  return (
    <>
      <SidebarModal heading='Edit Timeline Template' opened={isOpen} onClose={onClose}>
        {isLoadingPhases ? (
          <div className='flex items-center justify-center h-32'>
            <Spinner className='size-6 text-primary' />
            <span className='ml-2 text-gray-500'>Loading phases...</span>
          </div>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
              <Form className='flex flex-col h-full'>
                <div className='flex-1 px-6 py-4 space-y-5'>
                  {/* Template Name */}
                  <div>
                    <FormInput
                      name='name'
                      label='Template Name'
                      placeholder='Enter template name'
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && errors.name ? errors.name : undefined}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Select Phases */}
                  <div>
                    <MasterPhaseMultiSelector
                      options={options}
                      setOptions={setOptions}
                      setValue={(value) => setFieldValue('phases', value)}
                      defaultData={defaultPhases}
                      pendingPhaseName={pendingPhaseName}
                      onCreateFromSearch={(search) => {
                        setPendingPhaseName(search);
                        openAddPhase();
                      }}
                      error={touched.phases ? (errors.phases as string) : undefined}
                    />
                  </div>
                </div>

                <div className='flex gap-3 justify-end px-6 py-4 border-t border-gray-200'>
                  <Button
                    type='button'
                    variant='outline'
                    radius='full'
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' radius='full' disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Template'}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </SidebarModal>

      {/* Add Phase Sidebar */}
      <AddEditMasterPhaseSidebar
        isOpen={isOpenAddPhase}
        onClose={closeAddPhase}
        mode='create'
        initialPhaseName={pendingPhaseName}
        onSuccess={handlePhaseCreated}
      />
    </>
  );
}

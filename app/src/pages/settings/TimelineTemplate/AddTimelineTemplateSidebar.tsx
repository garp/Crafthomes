import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';

import SidebarModal from '../../../components/base/SidebarModal';
import FormInput from '../../../components/base/FormInput';
import { Button } from '../../../components/base';
import { useCreateProjectTypeMutation } from '../../../store/services/projectType/projectTypeSlice';
import type { TErrorResponse } from '../../../store/types/common.types';
import AddEditMasterPhaseSidebar from '../../../components/settings/AddEditMasterPhaseSidebar';
import type { TOption } from '../../../types/project';
import MasterPhaseMultiSelector from '../../../components/common/combobox/MasterPhaseMultiSelector';

type TAddTimelineTemplateSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
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

export default function AddTimelineTemplateSidebar({
  isOpen,
  onClose,
}: TAddTimelineTemplateSidebarProps) {
  const [createProjectType, { isLoading }] = useCreateProjectTypeMutation();
  const [isOpenAddPhase, { open: openAddPhase, close: closeAddPhase }] = useDisclosure(false);
  const [pendingPhaseName, setPendingPhaseName] = useState<string>('');
  const [options, setOptions] = useState<TOption[]>([]);

  const initialValues: TFormValues = {
    name: '',
    phases: [],
  };

  function handlePhaseCreated(phaseName: string) {
    toast.info(`Phase "${phaseName}" created. Select it from the dropdown.`);
    setPendingPhaseName(phaseName);
    closeAddPhase();
    setTimeout(() => setPendingPhaseName(''), 2000);
  }

  function handleSubmit(values: TFormValues, { resetForm }: { resetForm: () => void }) {
    createProjectType({
      name: values.name,
      phases: values.phases.length > 0 ? values.phases : undefined,
    })
      .unwrap()
      .then(() => {
        toast.success('Timeline template created successfully');
        resetForm();
        setOptions([]);
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to create timeline template');
        }
        console.error('Error creating timeline template:', error);
      });
  }

  return (
    <>
      <SidebarModal heading='Add Timeline Template' opened={isOpen} onClose={onClose}>
        <Formik
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
                    pendingPhaseName={pendingPhaseName}
                    onCreateFromSearch={(search) => {
                      setPendingPhaseName(search);
                      openAddPhase();
                    }}
                    error={touched.phases ? (errors.phases as string) : undefined}
                  />
                  <p className='text-xs text-gray-500 mt-2'>
                    Select existing phases or create new ones. You can also add phases later.
                  </p>
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
                  {isLoading ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
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

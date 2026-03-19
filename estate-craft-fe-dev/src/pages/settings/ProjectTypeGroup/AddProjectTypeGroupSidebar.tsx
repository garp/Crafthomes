import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useState } from 'react';

import SidebarModal from '../../../components/base/SidebarModal';
import FormInput from '../../../components/base/FormInput';
import { Button } from '../../../components/base';
import { useCreateProjectTypeGroupMutation } from '../../../store/services/projectTypeGroup/projectTypeGroupSlice';
import type { TErrorResponse } from '../../../store/types/common.types';
import type { TOption } from '../../../types/project';
import ProjectTypeMultiSelector from '../../../components/common/combobox/ProjectTypeMultiSelector';

type TAddProjectTypeGroupSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const validationSchema = yup.object({
  name: yup
    .string()
    .required('Group name is required')
    .min(2, 'Name must be at least 2 characters'),
  description: yup.string(),
  projectTypes: yup.array().of(yup.string()),
});

type TFormValues = {
  name: string;
  description: string;
  projectTypes: string[];
};

export default function AddProjectTypeGroupSidebar({
  isOpen,
  onClose,
}: TAddProjectTypeGroupSidebarProps) {
  const [createProjectTypeGroup, { isLoading }] = useCreateProjectTypeGroupMutation();
  const [options, setOptions] = useState<TOption[]>([]);

  const initialValues: TFormValues = {
    name: '',
    description: '',
    projectTypes: [],
  };

  function handleSubmit(values: TFormValues, { resetForm }: { resetForm: () => void }) {
    createProjectTypeGroup({
      name: values.name,
      description: values.description || undefined,
      projectTypes: values.projectTypes.length > 0 ? values.projectTypes : undefined,
    })
      .unwrap()
      .then(() => {
        toast.success('Project type group created successfully');
        resetForm();
        setOptions([]);
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to create project type group');
        }
        console.error('Error creating project type group:', error);
      });
  }

  return (
    <SidebarModal heading='Add Project Type' opened={isOpen} onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form className='flex flex-col h-full'>
            <div className='flex-1 px-6 py-4 space-y-5'>
              {/* Project Type Name */}
              <div>
                <FormInput
                  name='name'
                  label='Project Type Name'
                  placeholder='Enter project type name'
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name && errors.name ? errors.name : undefined}
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div>
                <FormInput
                  name='description'
                  label='Description'
                  placeholder='Enter description (optional)'
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.description && errors.description ? errors.description : undefined}
                  disabled={isLoading}
                />
              </div>

              {/* Select Timeline Templates */}
              <div>
                <ProjectTypeMultiSelector
                  options={options}
                  setOptions={setOptions}
                  setValue={(value) => setFieldValue('projectTypes', value)}
                  error={touched.projectTypes ? (errors.projectTypes as string) : undefined}
                  fetchAll
                />
                <p className='text-xs text-gray-500 mt-2'>
                  Select timeline templates to include in this project type.
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
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </SidebarModal>
  );
}

import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

import SidebarModal from '../../../components/base/SidebarModal';
import FormInput from '../../../components/base/FormInput';
import { Button } from '../../../components/base';
import {
  useUpdateProjectTypeGroupMutation,
  useGetProjectTypeGroupByIdQuery,
} from '../../../store/services/projectTypeGroup/projectTypeGroupSlice';
import type { TErrorResponse } from '../../../store/types/common.types';
import type { TProjectTypeGroup } from '../../../store/types/projectTypeGroup.types';
import type { TOption } from '../../../types/project';
import ProjectTypeMultiSelector from '../../../components/common/combobox/ProjectTypeMultiSelector';

type TEditProjectTypeGroupSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  group: TProjectTypeGroup | null;
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

export default function EditProjectTypeGroupSidebar({
  isOpen,
  onClose,
  group,
}: TEditProjectTypeGroupSidebarProps) {
  const [updateProjectTypeGroup, { isLoading }] = useUpdateProjectTypeGroupMutation();
  const [options, setOptions] = useState<TOption[]>([]);

  // Fetch detailed group data to get the full projectTypes array
  const { data: groupDetail, isFetching: isFetchingDetail } = useGetProjectTypeGroupByIdQuery(
    { id: group?.id || '' },
    { skip: !group?.id || !isOpen },
  );

  const initialValues: TFormValues = {
    name: groupDetail?.name || group?.name || '',
    description: groupDetail?.description || group?.description || '',
    projectTypes: groupDetail?.projectTypes?.map((pt) => pt.id) || [],
  };

  // Reset options when groupDetail changes
  useEffect(() => {
    if (groupDetail?.projectTypes) {
      const defaultOptions: TOption[] = groupDetail.projectTypes.map((pt) => ({
        label: pt.name,
        value: pt.id,
        checked: true,
      }));
      setOptions(defaultOptions);
    } else {
      setOptions([]);
    }
  }, [groupDetail]);

  function handleSubmit(values: TFormValues) {
    if (!group?.id) {
      toast.error('Unable to update group');
      return;
    }

    updateProjectTypeGroup({
      id: group.id,
      name: values.name,
      description: values.description || undefined,
      projectTypes: values.projectTypes.length > 0 ? values.projectTypes : undefined,
    })
      .unwrap()
      .then(() => {
        toast.success('Project type group updated successfully');
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to update project type group');
        }
        console.error('Error updating project type group:', error);
      });
  }

  return (
    <SidebarModal heading='Edit Project Type' opened={isOpen} onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
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
                  defaultData={groupDetail?.projectTypes?.map((pt) => ({
                    id: pt.id,
                    name: pt.name,
                  }))}
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
              <Button type='submit' radius='full' disabled={isLoading || isFetchingDetail}>
                {isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </SidebarModal>
  );
}

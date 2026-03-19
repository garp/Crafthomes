import { useFormik } from 'formik';
import { IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';

import DrawerModal from '../../../../../components/base/DrawerModal';
import FormLabel from '../../../../../components/base/FormLabel';
import FormInput from '../../../../../components/base/FormInput';
import IconButton from '../../../../../components/base/button/IconButton';
import { Button } from '../../../../../components';
import RichTextEditorDescription from '../../../../../components/common/RichTextEditorDescription';

import {
  addProjectPhaseSchema,
  type TAddProjectPhaseFormData,
} from '../../../../../validators/projectPhase';
import type { TAddPhaseSidebarProps } from '../types/types';
// import { useAddProjectPhaseMutation } from '../../../../../store/services/projectPhase/';
import { useParams } from 'react-router-dom';
import CustomCheckbox from '../../../../../components/base/CustomCheckbox';
import type { TErrorResponse } from '../../../../../store/types/common.types';
import {
  useAddPhaseMutation,
  useEditPhaseMutation,
} from '../../../../../store/services/phase/phaseSlice';

export default function AddProjectPhaseSidebar({
  isOpen,
  onClose,
  phaseData,
  mode = 'create',
}: TAddPhaseSidebarProps) {
  const [createPhase, { isLoading: isCreatingPhase }] = useAddPhaseMutation();
  const [editPhase, { isLoading: isUpdatingPhase }] = useEditPhaseMutation();
  const { timelineId, id } = useParams();
  const isEditMode = mode === 'edit';
  const isLoading = isEditMode ? isUpdatingPhase : isCreatingPhase;

  const formik = useFormik<TAddProjectPhaseFormData>({
    enableReinitialize: true,
    initialValues: {
      name: phaseData?.name || '',
      description: phaseData?.description || '',
      masterPhaseCheck: false,
    },
    validationSchema: addProjectPhaseSchema,
    onSubmit: async (values) => {
      if (isEditMode) {
        if (!phaseData?.id) {
          toast.error('Unable to update Phase');
          return;
        }
        editPhase({
          id: phaseData.id,
          name: values.name,
          description: values.description || '',
        })
          .unwrap()
          .then(() => {
            toast.success('Phase updated successfully');
            formik.resetForm();
            onClose();
          })
          .catch((error: { data: TErrorResponse }) => {
            if (error?.data?.message) {
              toast.error(error?.data?.message);
            } else toast.error('Internal server error');
            console.error('Error updating phase:', error);
          });
      } else {
        if (!timelineId || !id) {
          toast.error('Unable to create Phase');
          console.log('TimelineId or projectId is undefined');
          return;
        }
        //TODO: projecId is not required here
        createPhase({
          ...values,
          description: values.description || '',
          timelineId: timelineId,
          projectId: id,
        })
          .unwrap()
          .then(() => {
            toast.success('Phase created successfully');
            formik.resetForm();
            onClose();
          })
          .catch((error: { data: TErrorResponse }) => {
            if (error?.data?.message) {
              toast.error(error?.data?.message);
            } else toast.error('Internal server error');
            console.error('Error creating task:', error);
          });
      }
    },
  });

  return (
    <DrawerModal opened={isOpen} onClose={onClose}>
      <div className='h-full bg-white'>
        {/* Header */}
        <div className='py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-[#F3F4F7]'>
          <h2 className='font-semibold text-gray-900'>{isEditMode ? 'Edit Phase' : 'Add Phase'}</h2>
          <IconButton onClick={onClose}>
            <IconX className='size-4 text-text-subHeading' />
          </IconButton>
        </div>

        {/* Form */}
        <form
          onSubmit={formik.handleSubmit}
          className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
        >
          <div className='space-y-6'>
            {/* Phase Name */}
            <div className='flex items-center'>
              <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>Phase Name</FormLabel>
              <FormInput
                placeholder='Enter phase name'
                name='name'
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className='w-[60%]'
                error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              />
            </div>

            {/* Description */}
            <div className=''>
              <FormLabel className='block text-sm font-medium mb-2'>Description</FormLabel>
              <RichTextEditorDescription
                value={formik.values.description || ''}
                setValue={(val) => formik.setFieldValue('description', val)}
                imageFolder='estatecraft-project-phase-images'
              />
            </div>

            {/* Create Master Phase - Only show in create mode */}
            {!isEditMode && (
              <div className='flex items-center'>
                <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>
                  Create Master Phase
                </FormLabel>
                <CustomCheckbox
                  name='masterPhaseCheck'
                  checked={formik.values.masterPhaseCheck}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            disabled={isLoading}
            radius='full'
            type='submit'
            className='text-sm! mt-auto ml-auto'
          >
            {isEditMode ? 'Update Phase' : 'Add Phase'}
          </Button>
        </form>
      </div>
    </DrawerModal>
  );
}

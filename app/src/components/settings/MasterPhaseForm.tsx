import { useFormik } from 'formik';
// import { Textarea } from '@mantine/core';

import {
  createMasterPhaseSchema,
  type TCreateMasterPhaseFormData,
} from '../../validators/masterPhase';

import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import type { TFormProps } from '../../types/common.types';
import type { TOption } from '../../types/project';
// import FormTextArea from '../base/FormTextArea';
import MasterTaskSelector from '../common/combobox/MasterTaskSelector';
import { useState } from 'react';
// import MantineTextEditor from '../common/MantineTextEditor';
// import { useEditor } from '@tiptap/react';
import RichTextEditorDescription from '../common/RichTextEditorDescription';

// type MasterPhaseFormProps = {c
//   initialValues: TCreateMasterPhaseFormData;
//   onSubmit: (data: TCreateMasterPhaseFormData) => void;
//   isSubmitting: boolean;
// };

export default function MasterPhaseForm({
  initialValues,
  onSubmit,
  disabled,
  defaultTasks,
  onCreateFromSearch,
  pendingTaskName,
  onTaskClick,
  projectTypeId,
}: TFormProps<TCreateMasterPhaseFormData> & {
  defaultTasks?: { id: string; name: string }[];
  onCreateFromSearch?: (search: string) => void;
  pendingTaskName?: string | null;
  onTaskClick?: (taskId: string) => void;
  projectTypeId?: string;
}) {
  // const[masterTasksId,setMasterTasks]
  const [options, setOptions] = useState<TOption[]>([]);
  const formik = useFormik<TCreateMasterPhaseFormData>({
    enableReinitialize: true,
    initialValues: {
      ...initialValues,
      // Include projectTypeId in form data if provided
      projectTypeId: projectTypeId || initialValues.projectTypeId,
    },
    validationSchema: createMasterPhaseSchema,
    onSubmit: async (data, { resetForm }) => onSubmit({ data, resetForm }),
  });
  return (
    <form
      onSubmit={formik.handleSubmit}
      className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
    >
      <div className='space-y-6'>
        {/* Phase Name */}
        <div className='flex items-center'>
          {/* <FormLabel className='w-[40%]'>Phase Name</FormLabel> */}
          <FormInput
            disabled={disabled}
            placeholder='Enter Phase Name'
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name='name'
            label='Phase Name'
            className=''
            error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
          />
        </div>
        {/* MASTER TASKS */}
        <MasterTaskSelector
          setOptions={setOptions}
          options={options}
          setValue={(ids) => formik.setFieldValue('masterTasks', ids)}
          defaultData={defaultTasks}
          onCreateFromSearch={onCreateFromSearch}
          pendingTaskName={pendingTaskName}
          onTaskClick={onTaskClick}
          projectTypeId={projectTypeId}
        />
        {/* Description */}
        <div className=''>
          <FormLabel className='w-[40%]'>Description</FormLabel>
          <RichTextEditorDescription
            value={formik.values.description || ''}
            setValue={(val) => formik.setFieldValue('description', val)}
            imageFolder='estatecraft-master-phase-images'
          />
          {/* <FormTextArea
            label='Description'
            name='description'
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            rows={7}
            className='w-full'
            error={formik.touched.description && formik.errors.description}
          /> */}
        </div>
      </div>

      {/* Submit Button */}
      <Button radius='full' type='submit' disabled={disabled} className='mt-auto px-9 ml-auto'>
        {disabled ? 'Saving...' : 'Confirm'}
      </Button>
    </form>
  );
}

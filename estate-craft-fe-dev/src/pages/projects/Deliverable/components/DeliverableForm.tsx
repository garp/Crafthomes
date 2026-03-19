'use client';

import { Formik, Form } from 'formik';
import FormSelect from '../../../../components/base/FormSelect';
import FormDate from '../../../../components/base/FormDate';
import { Button } from '../../../../components';
import type { TFormProps } from '../../../../types/common.types';
import {
  createDeliverableSchema,
  type TCreateDeliverableFormData,
} from '../../../../validators/deliverable.validator';
import FormRow from '../../../../components/base/FormRow';
import PrioritySelector from '../../../../components/common/selectors/PrioritySelector';
import MembersCombobox from '../../../../components/common/combobox/MembersCombobox';

const taskOptions = [
  { label: 'Design Review', value: 'design_review' },
  { label: 'Site Inspection', value: 'site_inspection' },
  { label: 'Material Approval', value: 'material_approval' },
];

// const memberOptions = [
//   { label: 'John Doe', value: 'john' },
//   { label: 'Jane Smith', value: 'jane' },
//   { label: 'Robert Brown', value: 'robert' },
// ];

export default function DeliverableForm({
  initialValues,
  onSubmit,
}: TFormProps<TCreateDeliverableFormData>) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createDeliverableSchema}
      onSubmit={(data, { resetForm }) => onSubmit({ data, resetForm })}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched }) => (
        <Form className='px-6 pt-6 pb-3 space-y-6 flex flex-col border h-full'>
          {/* Attendees */}
          <div className='flex-col'>
            <MembersCombobox
              setTouched={(touched) => setFieldTouched('attendees', touched)}
              name='attendees'
              value={values.attendees}
              setValue={(val) => setFieldValue('attendees', val)}
              error={touched.attendees ? errors.attendees : undefined}
              className='w-full'
            />
          </div>
          {/* Task Name  */}
          <FormRow label='Task Name'>
            <FormSelect
              name='name'
              value={values.name}
              onChange={(val) => setFieldValue('name', val)}
              onBlur={handleBlur}
              options={taskOptions}
              error={touched.name ? errors.name : undefined}
              className='w-[20rem]'
              placeholder='Select Task'
            />
          </FormRow>
          {/* Due Date & Priority */}
          <FormRow label='Due Date'>
            <FormDate
              name='dueDate'
              value={values.dueDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.dueDate ? (errors.dueDate as string) : undefined}
              className='w-[20rem]'
              placeholder='Select Due Date'
            />
          </FormRow>
          <FormRow label='Priority'>
            <PrioritySelector
              name='priority'
              value={values.priority}
              onChange={(val) => setFieldValue('priority', val)}
              onBlur={handleBlur}
              error={touched.priority ? errors.priority : undefined}
              className='w-[20rem]'
            />
          </FormRow>
          {/* Footer */}
          <Button radius='full' type='submit' className='mt-auto ml-auto'>
            Create Task
          </Button>
        </Form>
      )}
    </Formik>
  );
}

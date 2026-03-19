import * as yup from 'yup';

export const createDeliverableSchema = yup.object().shape({
  name: yup.string().required('Deliverable Name is required'),

  attendees: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Select at least one member')
    .required('Attendees are required'),

  dueDate: yup.date().required('Due Date is required').typeError('Invalid date'),

  priority: yup.string().required('Priority is required'),
});

export type TCreateDeliverableFormData = yup.InferType<typeof createDeliverableSchema>;

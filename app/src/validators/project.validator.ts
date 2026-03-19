import * as yup from 'yup';
import { currencySchema } from './common.validators';

// export type TTaskFormValues = yup.InferType<typeof createTaskSchema>;

// export const createTaskSchema = yup.object().shape({
//   taskName: yup.string().trim().required('Task name is required'),

//   startDate: yup.date().required('Start date is required').typeError('Start date is invalid'),

//   endDate: yup
//     .date()
//     .required('End date is required')
//     .typeError('End date is invalid')
//     .min(yup.ref('startDate'), 'End date cannot be before start date'),

//   duration: yup.string().required('Duration is required'),

//   assignee: yup.string().required('Assignee is required'),

//   unit: yup.string().required('Unit of measurement is required'),

//   notes: yup.string().max(1000, 'Note should be under 1000 characters'),

//   attachment: yup.mixed().nullable(),

//   priority: yup.string().required('Priority is required'),
// });

export const createProjectSchema = yup.object().shape({
  // businessType: yup.string().required('Business Type is required'),
  // projectScope: yup.string().required('Project Scope is required'),
  // dealerName: yup.string().required('Dealer Name is required'),
  // dealerPhone: yup.string().required('Dealer Phone is required'),
  // price: yup.number().required('price is required'),
  name: yup.string().required('Project name is required'),
  clientId: yup.string().nullable().optional(),
  projectTypeGroupId: yup.string().nullable().optional(),
  projectTypeId: yup.string().nullable().optional(),
  projectTypeIds: yup.array().of(yup.string()).optional().default([]),
  masterPhases: yup.array().of(yup.string()).optional(),
  currency: currencySchema.required('Project Estimation Currency is required'),
  estimatedBudget: yup
    .number()
    .nullable()
    .optional()
    .min(0, 'Estimated Budget must be a positive number')
    .typeError('Estimated Budget must be a number'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup
    .date()
    .nullable()
    .optional()
    .test('is-not-before-start', 'Completion date cannot be before start date', function (value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true; // If no endDate or startDate, validation passes
      return new Date(value) >= new Date(startDate);
    }),
  assignProjectManager: yup.string().required('Project Manager is required'),
  assignedInternalUsersId: yup.array().of(yup.string()).optional(),
  description: yup.string(),
  attachments: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required(),
        url: yup.string().required(),
        type: yup.string().required(),
        key: yup.string().required(),
      }),
    )
    .max(5, 'Maximum 5 attachments allowed')
    .required('Files are required')
    .optional(),
});
// assignClientContact: yup.string().required('Client Contact is required'),
// attachment: yup.object().shape({
//   files: yup.array().of(
//     yup.object().shape({
//       name: yup.string().required("File name is required"),
//       url: yup.string().required("File url is required")
//     })
//   )
// })
// attachment: yup.

// phase: yup.string().required('Phase is required'),
// clientContact: yup.string().required('Client contact is required'),
// description: yup.string().required('Description is required'),

export type TCreateProjectFormData = yup.InferType<typeof createProjectSchema>;

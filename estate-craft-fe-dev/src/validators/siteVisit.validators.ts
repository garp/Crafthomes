import * as yup from 'yup';
import { attachmentSchema } from './common.validators';

const priorityOptional = yup
  .string()
  .oneOf(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 'Invalid priority')
  .nullable()
  .optional();

export const createSiteVisitSchema = yup.object().shape({
  startedAt: yup.date().required('Visit date is required'),
  engineerIds: yup
    .array()
    .of(yup.string().required())
    .min(1, 'At least one engineer must be assigned')
    .required('Engineers are required'),
  status: yup
    .string()
    .oneOf(['SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED'], 'Invalid status')
    .required('Status is required'),
  priority: priorityOptional,
  summaryText: yup.string().max(1000, 'Summary cannot exceed 1000 characters'),
  taskSnapshots: yup.array().of(
    yup.object().shape({
      originalTaskId: yup.string().nullable(),
      taskTitle: yup.string().required('Task title is required'),
      statusAtVisit: yup.string().required('Status is required'),
      notes: yup.string().max(500, 'Notes cannot exceed 500 characters'),
      completionPercentage: yup
        .number()
        .min(0, 'Cannot be less than 0')
        .max(100, 'Cannot exceed 100')
        .nullable(),
      attachments: yup
        .array()
        .of(attachmentSchema)
        .max(5, 'Maximum 5 attachments per task')
        .optional(),
    }),
  ),
  attachments: yup.array().of(attachmentSchema).max(10, 'Maximum 10 attachments allowed'),
});

export const updateSiteVisitSchema = yup.object().shape({
  engineerIds: yup.array().of(yup.string().required()),
  status: yup.string().oneOf(['SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED']),
  priority: priorityOptional,
  submittedAt: yup.date().nullable(),
  reviewedAt: yup.date().nullable(),
  summaryText: yup.string().max(1000, 'Summary cannot exceed 1000 characters'),
  clientSignatureUrl: yup.string().url('Must be a valid URL').nullable(),
  taskSnapshots: yup.array().of(
    yup.object().shape({
      originalTaskId: yup.string().nullable(),
      taskTitle: yup.string().required('Task title is required'),
      statusAtVisit: yup.string().required('Status is required'),
      notes: yup.string().max(500, 'Notes cannot exceed 500 characters'),
      completionPercentage: yup
        .number()
        .min(0, 'Cannot be less than 0')
        .max(100, 'Cannot exceed 100')
        .nullable(),
      attachments: yup
        .array()
        .of(attachmentSchema)
        .max(5, 'Maximum 5 attachments per task')
        .optional(),
    }),
  ),
  attachments: yup
    .array()
    .of(attachmentSchema)
    .max(10, 'Maximum 10 attachments allowed')
    .optional(),
});

export type TCreateSiteVisitFormData = yup.InferType<typeof createSiteVisitSchema>;
export type TUpdateSiteVisitFormData = yup.InferType<typeof updateSiteVisitSchema>;

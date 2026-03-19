import * as yup from 'yup';
import { multiAttachmentSchema, prioritySchema } from './common.validators';
import { TASK_STATUS } from '../constants/ui';

export const baseTaskSchema = yup.object().shape({
  name: yup.string().required('Task name is required'),
  description: yup.string().optional().nullable(),
  plannedStart: yup.date().optional().nullable(),
  plannedEnd: yup
    .date()
    .min(yup.ref('plannedStart'), 'End date cannot be before start date')
    .optional()
    .nullable(),
  duration: yup.number().optional().nullable(),
  predecessorTaskIds: yup.array().of(yup.string()).optional().nullable(),
  assignee: yup.array().of(yup.string()).optional().nullable(),
  assignedBy: yup.string().optional().nullable(),
  // notes: yup.string().optional().nullable(),
  priority: yup.string().optional().nullable(),
  phaseId: yup.string().optional().nullable(),
  taskStatus: yup.string().optional().oneOf(Object.values(TASK_STATUS)),
  // projectId: yup.string().optional(),
  // timelineId: yup.string().optional(),
  // comment: yup.string().optional(),
  // unit: yup.string().optional(),
  attachments: multiAttachmentSchema.optional().nullable(),
});

export type TCreateSubTaskFormData = yup.InferType<typeof baseTaskSchema>;

export const addTaskSchema = baseTaskSchema.shape({
  projectId: yup.string().optional(),
  subTasks: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required('Checklist name is required'),
        description: yup.string().optional(),
        plannedStart: yup.date().optional(),
        plannedEnd: yup
          .date()
          .min(yup.ref('plannedStart'), 'End date cannot be before start date')
          .optional(),
        predecessorTaskIds: yup.array().of(yup.string()).optional().nullable(),
        assignee: yup.array().of(yup.string()).optional(),
        assignedBy: yup.string().optional(),
        // notes: yup.string().optional(),
        priority: prioritySchema.optional(),
        phaseId: yup.string().optional(),
        comment: yup.string().optional(),
        // unit: yup.string().nullable().optional(),
        attachments: multiAttachmentSchema.optional(),
        duration: yup.string().nullable().optional(),
      }),
    )
    .optional(),
});

// extend original schema with subTasks

export type TCreateTaskFormData = yup.InferType<typeof addTaskSchema>;

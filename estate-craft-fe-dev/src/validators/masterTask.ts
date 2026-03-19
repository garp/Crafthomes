import * as yup from 'yup';

const masterSubTaskSchema = yup.object({
  id: yup.string().optional(),
  name: yup.string().required('Checklist name is required'),
  description: yup.string().optional().nullable(),
  duration: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null || Number.isNaN(value) ? null : value,
    )
    .nullable()
    .min(0, 'Checklist duration cannot be negative')
    .integer('Checklist duration must be a whole number')
    .optional(),
  predecessorTaskId: yup.string().nullable().optional(),
  priority: yup.string().required('Checklist priority is required'),
  notes: yup.string().optional().nullable(),
});

export const createMasterTaskSchema = yup.object({
  name: yup.string().required('Task Name is required'),
  masterPhaseId: yup.array().of(yup.string().trim().required()).optional().default([]),
  description: yup.string().optional(),
  duration: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null || Number.isNaN(value) ? null : value,
    )
    .nullable()
    .min(0, 'Duration cannot be negative')
    .integer('Duration must be a whole number')
    .optional(),
  predecessorTaskId: yup.string().nullable().optional(),
  // notes: yup.string().optional,
  priority: yup.string().required('Priority is required'),
  subTasks: yup.array().of(masterSubTaskSchema).optional().default([]),
});

export type TCreateMasterTaskFormData = yup.InferType<typeof createMasterTaskSchema>;

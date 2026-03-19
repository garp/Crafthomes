import * as yup from 'yup';

export const createMasterPhaseSchema = yup.object({
  name: yup.string().required('Phase name is required'),
  description: yup.string().optional(),
  masterTasks: yup.array().of(yup.string()),
  // Allow optionally linking a new phase to a project type when created from the project form
  projectTypeId: yup.string().optional(),
});

export type TCreateMasterPhaseFormData = yup.InferType<typeof createMasterPhaseSchema>;

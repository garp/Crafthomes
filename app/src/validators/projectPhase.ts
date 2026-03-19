import * as yup from 'yup';

export const addProjectPhaseSchema = yup.object().shape({
  name: yup.string().required('Phase name is required'),
  description: yup.string().optional(),
  masterPhaseCheck: yup.boolean().required(),
});

export type TAddProjectPhaseFormData = yup.InferType<typeof addProjectPhaseSchema>;

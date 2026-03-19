import * as yup from 'yup';

export const createProjectTypeSchema = yup.object().shape({
  name: yup.string().required('Project type name is required'),
  phases: yup
    .array()
    .of(
      yup.string().required(),
      // yup.object().shape({
      //   name: yup.string().required('Phase name required'),
      //   id: yup.string(),
      //   tasks: yup.array().of(yup.string()),
      // }),
    )
    .optional(),
});

export type TCreateProjectTypeFormData = yup.InferType<typeof createProjectTypeSchema>;

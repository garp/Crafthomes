import * as yup from 'yup';

export const commentValidators = yup.object({
  taskId: yup.string().required(''),
  content: yup.string().required('Comment is required'),
});

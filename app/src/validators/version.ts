import * as yup from 'yup';

export const createVersionSchema = yup.object().shape({
  momTitle: yup.string().required('Title is required'),
  date: yup.date().nullable().required('Date is required'),
  location: yup.string().required('Location is required'),
  agenda: yup.string().required('Agenda is required'),
  shareWith: yup.string().required('Share with is required'),
  meetingPoints: yup.string().required('Meeting points are required'),
});

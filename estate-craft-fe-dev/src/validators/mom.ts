import * as yup from 'yup';
import { HeldOn } from '../constants/mom';

export const createMOMSchema = yup.object({
  title: yup.string().required('Meeting Title is required'),
  startDate: yup.date().required('Start Date is required'),
  attendees: yup
    .array()
    .of(yup.string())
    .min(1, 'Please select at least one attendee')
    .required('Please select members'),
  heldOn: yup.string().required('Platform is required'),
  otherHeldOn: yup
    .string()
    .nullable()
    .when('heldOn', {
      is: HeldOn.OTHER,
      then: (schema) => schema.required('Please specify the platform'),
      otherwise: (schema) => schema.notRequired(),
    }),
  purpose: yup.string().required('Meeting purpose is required'),
  attachments: yup.array().of(yup.object()).optional(),
});

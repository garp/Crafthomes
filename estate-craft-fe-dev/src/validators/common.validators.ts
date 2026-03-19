import * as yup from 'yup';
import { priorityOptions } from '../constants/common';

export const attachmentSchema = yup.object().shape({
  name: yup.string().required(),
  url: yup.string().required(),
  type: yup.string().required(),
  key: yup.string().required(),
});

export const prioritySchema = yup
  .string()
  .oneOf(priorityOptions.map((p) => p.value))
  .required();

export const multiAttachmentSchema = yup
  .array()
  .of(attachmentSchema)
  .max(5, 'Maximum 5 attachments allowed');

export const singleAttachmentSchema = yup
  .array()
  .of(attachmentSchema)
  .max(1, 'Maximum 1 attachment allowed');

export const currencySchema = yup.string().oneOf(['USD', 'INR']);

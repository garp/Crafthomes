import type { TAttachment } from './common.types';

export type TUploadFilesBody = FormData;

export type TUploadFilesResponse = {
  data: { files: TAttachment[] };
};

import type { TBaseArgs } from './common.types';

export type TMOMAttachment = {
  id?: string;
  url: string;
  name: string;
  key: string;
  type: string;
  size?: number;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type TMOMAttendee = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type TMOM = {
  id: string;
  sNo: number;
  projectId: string;
  title: string;
  startDate: string;
  heldOn: string;
  otherHeldOn?: string | null;
  purpose: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  project: {
    id: string;
    sNo: number;
    name: string;
  };
  momAttendees: TMOMAttendee[];
  attachments: TMOMAttachment[];
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
};

export type TCreateMOMBody = {
  title: string;
  projectId: string;
  purpose: string;
  heldOn: string;
  otherHeldOn?: string | null;
  startDate: string;
  attachments: TMOMAttachment[];
  attendeeIds: string[];
};

export type TUpdateMOMBody = TCreateMOMBody;

export type TGetMOMsArgs = TBaseArgs & {
  projectId?: string;
  search?: string;
};

export type TGetMOMsResponse = {
  data: {
    moms: TMOM[];
    totalCount: number;
  };
};

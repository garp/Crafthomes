import type { TEditUserFormData } from '../../../validators/user';

export type TSelectedUser = Omit<TEditUserFormData, 'startDate'> & { startDate: string };

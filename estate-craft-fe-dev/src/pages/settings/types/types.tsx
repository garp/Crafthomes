import type { TAddUserFormData } from '../../../validators/user';

export interface User {
  id: number;
  name: string;
  designation: string;
  role: 'Super Admin' | 'Admin' | 'Viewer' | 'Editor';
  lastActive: string;
  dateAdded: string;
}
export type UserFormProps = {
  mode: 'add' | 'edit';
  initialValues: TAddUserFormData;
  onSubmit: (values: TAddUserFormData, resetForm: () => void) => void;
  disabled: boolean;
};

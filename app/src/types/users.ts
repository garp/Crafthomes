// import type { TRole } from "../store/types/roles.types";

// import type { TSelectedUser } from '../pages/users/types/types';
import type { TFormSelectProps } from '../components/base/FormSelect';
import type { TUser } from '../store/types/user.types';

export type TAddUserSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type TEditUserSidebarProps = TAddUserSidebarProps & {
  userData: TUser | null;
  userId: string;
};

export type TAddUserFormData = {
  name: string;
  phoneNumber: string;
  emailId: string;
  startDate: Date | null;
  location: string;
  department: string;
  role: string;
};

export type TDeleteUseDialogProps = {
  opened: boolean;
  onClose: () => void;
  userId: string;
};

export type TUserNameFilterProps = TFormSelectProps & {
  // selectedUserName: string | null;
  // setSearchValue?: (val: string | undefined) => void;
  setValue: (val: string | null) => void;

  className?: string;
  allowFilter?: boolean;
  error?: string;
  disabled?: boolean;
};

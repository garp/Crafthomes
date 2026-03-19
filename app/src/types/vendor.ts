import type { TVendor } from '../store/types/vendor.types';
import type { TAddVendorFormData } from '../validators/vendor';
import type { TFormMode } from './common.types';

export type TAddVendorFormProps = {
  disabled: boolean;
  mode: TFormMode;
  handleSubmit: (values: TAddVendorFormData, resetForm: () => void) => void;
  initialValues: TAddVendorFormData & { specializedId?: string[] };
};

export type TAddVendorSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type TEditVendorSidebarProps = TAddVendorSidebarProps & {
  vendorData: TVendor | null;
};

export type TVendorAddressSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

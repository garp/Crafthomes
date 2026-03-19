import { type TCreateProjectFormData } from '../validators/project.validator';
import type { FormikProps } from 'formik';
import type { TProject } from '../store/types/project.types';
import type { TCreateQuotationFormData } from '../validators/quotation';
import type { Dispatch, SetStateAction } from 'react';

export type TCreateProjectSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type TEditProjectSidebarProps = TCreateProjectSidebarProps & {
  selectedProject: TProject | null;
};

// export type TCreateProjectFormValues = yup.InferType<typeof createProjectSchema>;

// export type TProjectFormValues = {
//   name: string;
//   clientId: string;
//   businessType: string;
//   projectScope: string;
//   projectTypeId: string;
//   dealerName: string;
//   dealerPhone: string;
//   address: string;
//   city: string;
//   state: string;
//   projectEstimation: number;
//   projectEstimationCurrency: string;
//   price: string;
//   startDate: Date | null;
//   projectCompletionDate: Date | null;
//   clientSuccessManager: string;
// };

export type TClientFormField = {
  formik: FormikProps<TCreateProjectFormData>;
  disabled: boolean;
  defaultSearchValue?: string;
  // selectedClient : string;
  // onChange : (client:string) => void
};

export type TProjectTypeFormField = {
  // formik: FormikProps<TCreateProjectFormValues>;
  disabled: boolean;
  setPhases: (val: string[]) => void;
  defaultSearchValue?: string;
  value: string | null;
  setValue: (val: string | null) => void;
  error: string | undefined;
  onBlur: () => void;
};

// export type TAttachment = {
//   name: string;
//   id: string;
//   url: string;
//   type: string;
//   // file: File;
// };

export type TOption = { label: string; value: string; checked?: boolean };

export type TOptionCompProps = {
  option: TOption;
  setOptions: Dispatch<SetStateAction<TOption[]>>;
  options: TOption[];
  markUserChanged?: () => void;
};

export type TQuotationItemProps = {
  index: number;
  remove: (index: number) => void;
  item: {
    name: string;
    quantity: number;
    price: number;
    description: string;
  };
};

export type TQuotationFormProps = {
  initialValues: TCreateQuotationFormData | undefined;
  onSubmit: (values: TCreateQuotationFormData, helpers: any) => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  defaultClientName?: string;
};

export type TProjectFormInitialValues = Omit<
  TCreateProjectFormData,
  'clientId' | 'assignProjectManager' | 'projectTypeGroupId' | 'projectTypeIds'
> & {
  clientId: string | null;
  assignProjectManager: string | null;
  assignClientContact: string[];
  assignedInternalUsersId: string[];
  projectTypeGroupId: string | null;
  projectTypeIds: string[];
};

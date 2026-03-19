// import type { FormikProps } from 'formik';
// import type { TCreateProjectFormData } from '../validators/project';

import type { TFormSelectProps } from '../components/base/FormSelect';

export type TProjectManagerSelectorProps = TFormSelectProps & {
  // selectedProjectManager: string | null;
  // setSelectedProjectManager: Dispatch<SetStateAction<string | null>>;
  className?: string;
  allowFilter?: boolean;
  // value:string;
  // setValue:(arg:string) => void
  disabled: boolean;
  // formik: FormikProps<TCreateProjectFormData>;
  defaultSearchValue?: string | undefined;
  value: string;
  setValue: (val: string | null) => void;
};

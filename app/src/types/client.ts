// import type { Dispatch, SetStateAction } from 'react';
import type { TClient } from '../store/types/client.types';
import type { TFormSelectProps } from '../components/base/FormSelect';

export interface AddClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  defaultName?: string;
  // onSubmit: (clientData: ClientFormData) => void;
}

export type EditClientSidebarProps = AddClientSidebarProps & {
  // clientId: string;
  clientData: TClient | null;

  // onSubmit: (clientData: ClientFormData) => void;
};

export type TAddAddressSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  index: number;
};

export type TClientNameFilterProps = TFormSelectProps & {
  // selectedClient: string | null;
  // setSelectedClient: Dispatch<SetStateAction<string | null>>;
  allowFilter?: boolean;
  className?: string;
  setSearchValue?: (val: string | undefined) => void;
  // searchValue: string | undefined;
  setValue: (val: string | null) => void;
};

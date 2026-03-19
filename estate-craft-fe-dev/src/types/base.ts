import type { Dispatch, PropsWithChildren, ReactNode, SetStateAction } from 'react';
import { Editor } from '@tiptap/react';
import type { ModalProps } from '@mantine/core';

export interface ChildrenTypes {
  children: React.ReactNode;
}

interface InputBaseTypes {
  name?: string;
  label?: string;
  placeholder: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  border?: string;
  height?: string;
  width?: string;
  backgroundColor?: string;
  borderRadius?: string;
  error?: string | undefined | false;
  radius?: string;
  fontSize?: string;
  disabled?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface InputTypes extends InputBaseTypes {
  className?: string;
  value?: string;
  maxLength?: number;
  animatedPlaceholders?: string[];
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  rightSectionClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export interface SelectBoxType extends InputBaseTypes {
  searchable?: boolean;
  searchValue?: string;
  value?: string | string[];
  onSearchChange?: (value: string | null) => void;
  option: { label: string; value: string }[];
  onChange?: (value: string | string[] | null) => void;
  defaultValue?: string;
  clearable?: boolean;
  multiple?: boolean;
  className?: string;
}

export interface PaymentData {
  type: string;
  milestone: string;
  vendor: string;
  amount: string;
  date: string;
  status: string;
}

export interface TaskData {
  name: string;
  project: string;
  assignee: string;
  phase: string;
  priority: string;
}

export interface EventData {
  title: string;
  time: string;
  date: string;
}

export interface CalendarEventMap {
  [key: number]: number;
}

export type TMenuModalProps = {
  opened?: boolean;
  setOpened?: Dispatch<SetStateAction<boolean>>;
  // menuItems : {
  //   label:string;
  //   leftSection:React.ReactNode
  // }[]
  children: React.ReactNode;
  trigger: ReactNode;
  withinPortal?: boolean;
  position?: any;
};

export type TTExtEditoMenu = {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  editor: Editor;
  trigger: ReactNode;
  withinPortal: boolean;
  // menuItems : {
  //   label:string;
  //   leftSection:React.ReactNode
  // }[]
  // children: React.ReactNode
};

export type TTableDataProps = {
  className?: string;
  children: ReactNode;
  colSpan?: number;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
};

export type TFormLabelProps = {
  className?: string;
  children: ReactNode;
  htmlFor?: string;
};

export type TBackButtonProps = {
  children: ReactNode;
  className?: string;
  backTo: string;
};

export type TDialogModalProps = PropsWithChildren<ModalProps> & {
  titleClassName?: string;
};

export type TSidebarModalProps = TDrawerModalProps & {
  heading: string;
};

export type TDrawerModalProps = {
  opened: boolean;
  onClose: () => void;
  //   onSubmit: () => void;
  position?: 'top' | 'bottom' | 'right' | 'left';
  children: ReactNode;
  className?: string;
  size?: string;
  zIndex?: number;
};

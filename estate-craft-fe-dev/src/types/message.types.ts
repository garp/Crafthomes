export type TSendMessageFormData = {
  receiver: string;
  message: string;
  attachment: File | null;
};

export type TSendMessageSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TSendMessageFormData) => void;
};

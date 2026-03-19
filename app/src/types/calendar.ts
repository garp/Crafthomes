export type TAddEventSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TAddEventFormData) => void;
};

export type TAddEventFormData = {
  meetingTitle: string;
  date: Date | null;
  meetingLink: string;
  guests: string;
  meetingDescription: string;
};

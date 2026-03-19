export interface MOMData {
  id: string;
  projectId: string;
  date: string;
  time: string;
  project: string;
  meetingWith: string;
  attachments: number;
  status: string;
}

export interface MOMTableProps {
  data: MOMData[];
  variants?: any;
  onViewMom?: (projectId: string) => void;
  isLoading?: boolean;
}

export interface PaymentData {
  id: string;
  projectId: string;
  paymentType: string;
  milestone: string;
  vendorClient: {
    name: string;
    avatar: string;
  };
  amount: string;
  dueDate: string;
  status: 'pending' | 'completed';
}

export interface PaymentsTableProps {
  data: PaymentData[];
  variants?: any;
  onViewPayment?: (projectId: string) => void;
  isLoading?: boolean;
}

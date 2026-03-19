export type TPaymentStatus = 'paid' | 'pending' | 'partially_paid' | 'overdue' | 'late_paid';

export type TPaymentMethod = 'UPI' | 'credit_card' | 'debit_card' | 'N/A';

export type TPaymentTab = 'inbox' | 'drafts';

export interface TPayment {
  id: string;
  invoiceNumber: string;
  to: string;
  from: string;
  amount: number;
  date: string;
  status: TPaymentStatus;
  method: TPaymentMethod;
  referenceId: string;
  isDraft?: boolean;
}

export interface TInvoiceItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  total?: number;
}

export interface TInvoiceFormData {
  clientId: string | null;
  dueDate: Date | null;
  items: TInvoiceItem[];
  taxRate?: number;
  tax?: number;
  subtotal?: number;
  total?: number;
  clientName?: string;
  clientAddress?: string;
  invoiceNumber?: string; // Only for viewing/editing existing invoices
}

export interface TResendInvoiceModalProps {
  opened: boolean;
  onClose: () => void;
  invoiceId?: string;
  onResend: (recipientId: string) => void;
}

export interface TPaymentTableProps {
  payments: TPayment[];
  isLoading?: boolean;
}

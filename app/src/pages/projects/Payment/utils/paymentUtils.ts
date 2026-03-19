import type { TPayment, TPaymentMethod, TPaymentStatus } from '../../../../types/payment.types';
import type { TPaymentApiResponse } from '../../../../store/services/payment/paymentSlice';

// Map API response to TPayment
export function mapPaymentFromApi(apiPayment: TPaymentApiResponse): TPayment {
  // Map paymentStatus to TPaymentStatus
  const statusMap: Record<string, TPaymentStatus> = {
    DRAFT: 'pending',
    PAID: 'paid',
    PENDING: 'pending',
    PARTIALLY_PAID: 'partially_paid',
    OVERDUE: 'overdue',
    LATE_PAID: 'late_paid',
  };

  // Map paymentMethod to TPaymentMethod
  const methodMap: Record<string, TPaymentMethod> = {
    CASH: 'credit_card',
    CARD: 'credit_card',
    BANK_TRANSFER: 'debit_card',
    CHEQUE: 'debit_card',
    ONLINE_TRANSFER: 'UPI',
    OTHER: 'UPI',
    NA: 'N/A',
  };

  // Generate invoice number from id (first 8 chars) or use sNo
  const invoiceNumber = `INV-${apiPayment.sNo.toString().padStart(4, '0')}`;

  return {
    id: apiPayment.id,
    invoiceNumber,
    to: apiPayment.client.name,
    from: apiPayment.createdByUser.name,
    amount: apiPayment.totalAmount,
    date: apiPayment.paymentDate || apiPayment.createdAt,
    status: statusMap[apiPayment.paymentStatus] || 'pending',
    method: methodMap[apiPayment.paymentMethod] || 'N/A',
    referenceId: apiPayment.referenceId || 'N/A',
    isDraft: apiPayment.paymentStatus === 'DRAFT',
  };
}

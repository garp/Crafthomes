import type { TPaymentStatus } from '../../../../types/payment.types';

interface PaymentStatusBadgeProps {
  status: TPaymentStatus;
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const getStatusConfig = (status: TPaymentStatus) => {
    switch (status) {
      case 'paid':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
          label: 'Paid',
        };
      case 'pending':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          dotColor: 'bg-orange-500',
          label: 'Pending',
        };
      case 'partially_paid':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          dotColor: 'bg-blue-500',
          label: 'Partially paid',
        };
      case 'overdue':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          label: 'Overdue',
        };
      case 'late_paid':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          label: 'Late paid',
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-500',
          label: 'Pending',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex whitespace-nowrap items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></div>
      {config.label}
    </div>
  );
}

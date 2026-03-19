import type { TOption } from '../../../../types/common.types';

export const PAYMENT_STATUS_OPTIONS: TOption[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Partially paid', value: 'partially_paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Late paid', value: 'late_paid' },
];

export const PAYMENT_METHOD_OPTIONS: TOption[] = [
  { label: 'UPI', value: 'UPI' },
  { label: 'Credit card', value: 'credit_card' },
  { label: 'Debit card', value: 'debit_card' },
  { label: 'N/A', value: 'N/A' },
];

export const DATE_FILTER_OPTIONS: TOption[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
];

export const PAYMENT_TABS = {
  INBOX: 'inbox',
  DRAFTS: 'drafts',
} as const;

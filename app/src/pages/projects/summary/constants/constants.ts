import AllAttachmentGrayIcon from '../../../../components/icons/AllAttachmentGrayIcon';
import AllAttachmentIcon from '../../../../components/icons/AllAttachmentIcon';
import CheckIcon from '../../../../components/icons/CheckIcon';
import CheckWithDotIcon from '../../../../components/icons/CheckWithDotIcon';
import PaymentCompletedIcon from '../../../../components/icons/PaymentCompletedIcon';
import QuotationApprovedIcon from '../../../../components/icons/QuotationApprovedIcon';
import TotalTask from '../../../../components/icons/TotalTask';
import TotalTaskIconGray from '../../../../components/icons/TotalTaskIconGray';

export type TSUMMARY_STATS = (typeof SUMMARY_STATS)[0];

export const SUMMARY_STATS = [
  {
    title: 'Quotation',
    status: 'Approved',
    icon: QuotationApprovedIcon,
    icon2: CheckIcon,
  },
  {
    title: 'PAYMENT',
    status: 'COMPLETED',
    icon: PaymentCompletedIcon,
    icon2: CheckWithDotIcon,
  },
  {
    title: 'TOTAL TASK',
    status: '150',
    icon: TotalTask,
    icon2: TotalTaskIconGray,
  },
  {
    title: 'ALL ATTACHMENTS',
    status: 'PDF, Excel, Word, JPG',
    icon: AllAttachmentIcon,
    icon2: AllAttachmentGrayIcon,
  },
];

export const SUMMARY_DETAILS = [
  {
    key: 'Client Name',
    value: 'Jai Singh',
  },
  {
    key: 'Assigned PM',
    value: 'Priya Tripathi',
  },
  {
    key: 'Assign client contact',
    value: 'Priya Tripathi',
  },
  {
    key: 'Project Start Date',
    value: '01/05/2025',
  },
  {
    key: 'Project End Date',
    value: '01/05/2025',
  },
  {
    key: 'Project Type',
    value: 'Individual',
  },
];

export const TIMELINE_DATA = [
  {
    title: 'Design phase',
    tasks: 16,
    completed: 100,
  },
  {
    title: 'Design phase',
    tasks: 16,
    completed: 75,
  },
  {
    title: 'Design phase',
    tasks: 16,
    completed: 25,
  },
  {
    title: 'Design phase',
    tasks: 16,
    completed: 50,
  },
];

export const SITE_VISIT_TABLE_DATA = [
  {
    siteVisitor: 'Kavin',
    status: 'completed',
    completionTime: 'Completed at 11:45 AM',
  },
  {
    siteVisitor: 'Devraj',
    status: 'pending',
    completionTime: 'Completed at 11:45 AM',
  },
  {
    siteVisitor: 'Jai',
    status: 'in-progress',
    completionTime: 'Completed at 11:45 AM',
  },
];

export const RISK_TABLE_DATA = [
  {
    risk: 'Flooring material delivery delay',
    status: 'critical',
    suggestedAction: 'Notify vendor; reschedule install',
  },
  {
    risk: 'Client approval pending for Moodboard',
    status: 'medium',
    suggestedAction: 'Send automated follow-up',
  },
  {
    risk: 'Electrical subcontractor not assigned',
    status: 'mow',
    suggestedAction: 'Assign backup contractor',
  },
  {
    risk: 'Flooring material delivery delay',
    status: 'critical',
    suggestedAction: 'Notify vendor; reschedule install',
  },
  {
    risk: 'Flooring material delivery delay',
    status: 'critical',
    suggestedAction: 'Notify vendor; reschedule install',
  },
  {
    risk: 'Client approval pending for Moodboard',
    status: 'medium',
    suggestedAction: 'Send automated follow-up',
  },
  {
    risk: 'Electrical subcontractor not assigned',
    status: 'mow',
    suggestedAction: 'Assign backup contractor',
  },
  {
    risk: 'Flooring material delivery delay',
    status: 'critical',
    suggestedAction: 'Notify vendor; reschedule install',
  },
];

export const DEPARTMENT_HIGHLIGHTS = [
  {
    department: 'Measurement',
    status: '100%complete',
    notes: 'All dimensions verified',
  },
  {
    department: 'Mood Board',
    status: 'awaitingClient',
    notes: 'Sent on May 1, 2025',
  },
  {
    department: 'Mood Board',
    status: 'awaitingClient',
    notes: 'Sent on May 1, 2025',
  },
  {
    department: 'Vendor Quotes',
    status: '75%complete',
    notes: 'Awaiting flooring vendor quote',
  },
  {
    department: 'Measurement',
    status: '100%complete',
    notes: 'All dimensions verified',
  },
  {
    department: 'Mood Board',
    status: 'awaitingClient',
    notes: 'Sent on May 1, 2025',
  },
  {
    department: 'Mood Board',
    status: 'awaitingClient',
    notes: 'Sent on May 1, 2025',
  },
  {
    department: 'Vendor Quotes',
    status: '75%complete',
    notes: 'Awaiting flooring vendor quote',
  },
];

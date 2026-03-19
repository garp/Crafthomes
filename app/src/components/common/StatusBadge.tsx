interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          dotColor: 'bg-green-500',
          label: 'Active',
        };
      case 'INACTIVE':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          dotColor: 'bg-gray-500',
          label: 'Inactive',
        };
      case 'IN_PROGRESS':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          dotColor: 'bg-blue-500',
          label: 'In-progress',
        };
      case 'PENDING':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          dotColor: 'bg-yellow-500',
          label: 'Pending',
        };
      case 'PENDING_APPROVAL':
        return {
          bgColor: 'bg-violet-100',
          textColor: 'text-violet-800',
          dotColor: 'bg-violet-500',
          label: 'Pending Approval',
        };
      case 'NOT_STARTED':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          dotColor: 'bg-gray-500',
          label: 'Not Started',
        };
      case 'DELAYED':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          dotColor: 'bg-orange-500',
          label: 'Delayed',
        };
      case 'BLOCKED':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          dotColor: 'bg-red-500',
          label: 'Blocked',
        };
      case 'COMPLETED':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
          label: 'Completed',
        };
      case 'ARCHIVED':
        return {
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-800',
          dotColor: 'bg-slate-500',
          label: 'Archived',
        };
      case 'DELETED':
        return {
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-800',
          dotColor: 'bg-rose-500',
          label: 'Deleted',
        };
      case 'ON_HOLD':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          dotColor: 'bg-orange-500',
          label: 'On Hold',
        };
      case 'CANCELLED':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          label: 'Cancelled',
        };
      case 'critical':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          label: 'Critical',
        };
      case 'LOW':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          dotColor: 'bg-blue-500',
          label: 'Low',
        };
      case 'MEDIUM':
        return {
          bgColor: 'bg-violet-100',
          textColor: 'text-violet-800',
          dotColor: 'bg-violet-500',
          label: 'Medium',
        };
      case '100%complete':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
          label: '100% Complete',
        };
      case '75%complete':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          dotColor: 'bg-blue-500',
          label: '75% Complete',
        };
      case 'awaitingClient':
        return {
          bgColor: 'bg-violet-100',
          textColor: 'text-violet-800',
          dotColor: 'bg-violet-500',
          label: 'Awaiting CLient',
        };
      case 'TEMPORARY':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-500',
          label: 'Temporary',
        };
      case 'RESOLVED':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
          label: 'Resolved',
        };
      case 'OPEN':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          dotColor: 'bg-orange-500',
          label: 'Open',
        };
      case 'REJECTED':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          label: 'Rejected',
        };
      case 'CLOSED':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-500',
          label: 'Closed',
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

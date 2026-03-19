import { useNavigate } from 'react-router-dom';
import { ClientsIcon, ProjectsIcon, StatCard } from '../../../components';
import { PaymentsTable } from '../../../components/dashboard/PaymentsTable';
import { itemVariants } from '../../../constants/common';
import { prefixCurrencyInPrice } from '../../../utils/helper';
import type { TSummaryPaymentProgressResponse } from '../../../store/types/summary.types';
import { useGetClientsQuery } from '../../../store/services/client/clientSlice';
import { useGetProjectsQuery } from '../../../store/services/project/projectSlice';
import type { PaymentData } from '../types/types';

const toPaymentTableRow = (
  p: TSummaryPaymentProgressResponse['paymentSummary'][number],
): PaymentData => {
  const amountNumber =
    p?.paymentItems?.reduce((sum, item) => sum + (item?.price || 0) * (item?.quantity || 0), 0) ??
    0;

  const isCompleted = String(p.paymentStatus).toUpperCase() === 'PAID';

  return {
    id: p.id,
    projectId: p.project?.id ?? '',
    paymentType: p.paymentType ?? 'N/A',
    milestone: p?.project?.name ?? 'N/A',
    vendorClient: {
      name: p.client.name,
      avatar: '',
    },
    amount: prefixCurrencyInPrice(amountNumber, 'INR'),
    dueDate: new Date(p.dueDate).toLocaleDateString('en-GB'),
    status: isCompleted ? 'completed' : 'pending',
  };
};

export default function PaymentSection({
  paymentProgress,
  isLoading,
}: {
  paymentProgress?: TSummaryPaymentProgressResponse;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();
  const rows = (paymentProgress?.paymentSummary ?? []).map(toPaymentTableRow).slice(0, 5);

  const { data: clientsData, isLoading: isClientsLoading } = useGetClientsQuery({
    pageNo: '0',
    pageLimit: '1',
  });
  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjectsQuery({
    pageNo: '0',
    pageLimit: '1',
  });

  const clientsCount = clientsData?.totalCount ?? 0;
  const projectsCount = projectsData?.totalCount ?? 0;

  const handleViewPayment = (projectId: string) => {
    navigate(`/projects/${projectId}/payment?tab=inbox`);
  };

  return (
    <div className='flex gap-6 items-stretch'>
      <div className='w-[76%]'>
        <PaymentsTable
          data={rows}
          variants={itemVariants}
          isLoading={isLoading}
          onViewPayment={handleViewPayment}
        />
      </div>
      <div className='w-[24%] flex flex-col justify-between gap-6'>
        <StatCard
          title='Clients'
          value={isClientsLoading ? '-' : String(clientsCount)}
          icon={<ClientsIcon className='size-5' fill='currentColor' />}
          variants={itemVariants}
        />
        <StatCard
          title='Projects'
          value={isProjectsLoading ? '-' : String(projectsCount)}
          icon={<ProjectsIcon className='size-5' fill='currentColor' />}
          variants={itemVariants}
        />
      </div>
    </div>
  );
}

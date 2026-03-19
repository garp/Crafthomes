import { IconArrowRight } from '@tabler/icons-react';
import QuotationApprovedIcon from '../../../../components/icons/QuotationApprovedIcon';
import CheckIcon from '../../../../components/icons/CheckIcon';
import PaymentCompletedIcon from '../../../../components/icons/PaymentCompletedIcon';
import CheckWithDotIcon from '../../../../components/icons/CheckWithDotIcon';
import TotalTask from '../../../../components/icons/TotalTask';
import TotalTaskIconGray from '../../../../components/icons/TotalTaskIconGray';
import AllAttachmentIcon from '../../../../components/icons/AllAttachmentIcon';
import AllAttachmentGrayIcon from '../../../../components/icons/AllAttachmentGrayIcon';
import type { TProjectSummary } from '../../../../store/types/projectSummary.types';
import { Link } from 'react-router-dom';

type SummaryStatsProps = {
  projectSummary: TProjectSummary;
};

export default function SummaryStats({ projectSummary }: SummaryStatsProps) {
  const stats: StatCardData[] = [
    {
      title: 'Quotation',
      status: projectSummary.quotation || 'N/A',
      icon: QuotationApprovedIcon,
      icon2: CheckIcon,
      link: `/projects/${projectSummary.id}/quotation`,
    },
    {
      title: 'PAYMENT',
      status: projectSummary.paymentStatus || 'N/A',
      icon: PaymentCompletedIcon,
      icon2: CheckWithDotIcon,
      link: `/projects/${projectSummary.id}/payment`,
    },
    {
      title: 'TOTAL TASK',
      status: projectSummary.totalTasks.toString(),
      icon: TotalTask,
      icon2: TotalTaskIconGray,
    },
    {
      title: 'ALL ATTACHMENTS',
      status: 'PDF, Excel, Word, JPG',
      icon: AllAttachmentIcon,
      icon2: AllAttachmentGrayIcon,
      link: `/projects/${projectSummary.id}/files`,
    },
  ];

  return (
    <div className='grid 2xl:grid-cols-4 xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-x-5 gap-y-5  mt-8'>
      {stats.map((stat, index) => (
        <SummaryStatCard key={index} stats={stat} />
      ))}
    </div>
  );
}

type StatCardData = {
  title: string;
  status: string;
  icon: React.ComponentType<any>;
  icon2: React.ComponentType<any>;
  link?: string;
};

function SummaryStatCard({ stats }: { stats: StatCardData }) {
  return stats.link ? (
    <Link
      to={stats.link || ''}
      className='relative flex gap-5 items-center justify-between bg-white rounded-md py-8  pl-5 pr-8'
    >
      <div className='flex gap-5 items-center'>
        <div className='p-4 shrink-0 rounded-full shadow-[0px_0px_15px_0px_var(--color-neutral-200)] flex items-center'>
          <stats.icon />
        </div>
        <div>
          <p className='font-medium leading-4 text-nowrap'>{stats.title}</p>
          <p className='text-xl font-bold'>{stats.status}</p>
        </div>
      </div>
      <stats.icon2 className='fill-gray-300  size-[75px] shrink-0' />
      <button className='cursor-pointer absolute bottom-2 right-2 bg-bg-primary rounded-full p-1.5'>
        <IconArrowRight className='text-white size-4 shrink-0' />
      </button>
    </Link>
  ) : (
    <div className='relative flex gap-5 items-center justify-between bg-white rounded-md py-8  pl-5 pr-8'>
      <div className='flex gap-5 items-center'>
        <div className='p-4 shrink-0 rounded-full shadow-[0px_0px_15px_0px_var(--color-neutral-200)] flex items-center'>
          <stats.icon />
        </div>
        <div>
          <p className='font-medium leading-4 text-nowrap'>{stats.title}</p>
          <p className='text-xl font-bold'>{stats.status}</p>
        </div>
      </div>
      <stats.icon2 className='fill-gray-300  size-[75px] shrink-0' />
      <button className='cursor-pointer absolute bottom-2 right-2 bg-bg-primary rounded-full p-1.5'>
        <IconArrowRight className='text-white size-4 shrink-0' />
      </button>
    </div>
  );
}

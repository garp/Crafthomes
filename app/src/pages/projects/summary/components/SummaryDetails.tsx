import { format } from 'date-fns';
import type { TProjectSummary } from '../../../../store/types/projectSummary.types';

type SummaryDetailsProps = {
  projectSummary: TProjectSummary;
};

export default function SummaryDetails({ projectSummary }: SummaryDetailsProps) {
  const summaryDetails = [
    {
      key: 'Client Name',
      value: projectSummary.client?.name || 'N/A',
    },
    {
      key: 'Assigned PM',
      value: projectSummary.projectManager?.name || 'N/A',
    },
    {
      key: 'Project Start Date',
      value: projectSummary.startDate
        ? format(new Date(projectSummary.startDate), 'dd/MM/yyyy')
        : 'N/A',
    },
    {
      key: 'Project End Date',
      value: projectSummary.endDate
        ? format(new Date(projectSummary.endDate), 'dd/MM/yyyy')
        : 'N/A',
    },
    {
      key: 'Project Type',
      value: projectSummary.projectType || 'N/A',
    },
  ];

  return (
    <div className='overflow-x-auto mt-8 flex bg-white px-5 py-5 rounded-md  gap-x-10 '>
      {summaryDetails.map((detail, index) => (
        <SummaryDetailCard key={index} detail={detail} />
      ))}
    </div>
  );
}

type DetailCardData = {
  key: string;
  value: string;
};

function SummaryDetailCard({ detail }: { detail: DetailCardData }) {
  return (
    <div className='space-y-3 flex-1 min-w-40 flex flex-col'>
      <div className='text-nowrap text-sm border-b border-gray-300 py-2 text-text-subHeading'>
        {detail?.key}
      </div>
      <p className='font-semibold'>{detail?.value}</p>
    </div>
  );
}

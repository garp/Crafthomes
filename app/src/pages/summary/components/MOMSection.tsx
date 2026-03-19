import { useNavigate } from 'react-router-dom';
import { OverdueIcon } from '../../../components';
import { MOMTable } from '../../../components/dashboard/MOMTable';
import { motion } from 'framer-motion';
import { momData } from '../constants/constants';
import { itemVariants } from '../../../constants/common';
import type { TSummaryMomSummaryResponse } from '../../../store/types/summary.types';
import type { MOMData } from '../types/types';

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB');
};

const formatTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const toMomTableRow = (
  m: TSummaryMomSummaryResponse['momSummary'][number],
  index: number,
): MOMData => {
  const meetingWith = m.momAttendees?.[0]?.user?.name ?? 'N/A';
  const attachmentCount = m.attachments?.length ?? 0;

  const rawStatus = String(m.momStatus ?? '').toUpperCase();

  return {
    id: m.id ?? `${index}`,
    projectId: m.project?.id ?? '',
    date: formatDate(m.startDate),
    time: formatTime(m.startDate),
    project: m.project?.name ?? 'N/A',
    meetingWith,
    attachments: attachmentCount,
    status: rawStatus || 'N/A',
  };
};

export default function MOMSection({
  momProgress,
  isLoading,
}: {
  momProgress?: TSummaryMomSummaryResponse;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();
  const momRows = (momProgress?.momSummary ?? []).map(toMomTableRow).slice(0, 5);

  const handleViewMom = (projectId: string) => {
    navigate(`/projects/${projectId}/mom`);
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* MOM Section */}
      <MOMTable
        data={momRows}
        variants={itemVariants}
        isLoading={isLoading}
        onViewMom={handleViewMom}
      />

      {/* AI Insights Section */}
      <motion.div
        className='bg-white rounded shadow-sm'
        variants={itemVariants}
        style={{ border: '1px solid var(--color-border-light)' }}
      >
        <div
          className='p-6 flex justify-between items-center'
          style={{ borderBottom: '1px solid var(--color-border-light)' }}
        >
          <h2 className='text-lg font-semibold' style={{ color: 'var(--color-text-black)' }}>
            AI Insights
          </h2>
          <button
            className='text-sm font-medium transition-colors'
            style={{ color: 'var(--color-brand-blue)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            View All
          </button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr
                className='text-left text-xs font-medium'
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                <th className='px-6 py-3'>Payment Type</th>
                <th className='px-6 py-3'>Status</th>
                <th className='px-6 py-3'>AI Insights</th>
                <th className='px-6 py-3'>Suggested Action</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--color-border-light)' }}>
              {momData.map((insight, index) => (
                <tr
                  key={index}
                  className='transition-colors'
                  style={{
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className='px-6 py-4 text-sm' style={{ color: 'var(--color-text-black)' }}>
                    {insight.paymentType}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-5 h-5 rounded-md flex items-center justify-center'
                        style={{ backgroundColor: 'var(--color-bg-overdue)' }}
                      >
                        <OverdueIcon className='w-3 h-3' />
                      </div>
                      <span
                        className='inline-flex px-2 py-1 rounded-full text-xs font-medium'
                        style={{
                          backgroundColor: 'var(--color-bg-overdue)',
                          color: 'var(--color-brand-orange)',
                        }}
                      >
                        {insight.status}
                      </span>
                    </div>
                  </td>
                  <td
                    className='px-6 py-4 text-sm'
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Project completed on time. Matches predicted timeline.
                  </td>
                  <td
                    className='px-6 py-4 text-sm'
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Archive or use as benchmark.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

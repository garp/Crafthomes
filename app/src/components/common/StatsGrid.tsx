import { motion } from 'framer-motion';
import { StatsCard } from './StatsCard';
import { OpenIcon, OverdueIcon, InProgressIcon, CompletedIcon } from '../icons';
import { CHART_COLORS } from '../../constants';
import type { TSummaryTaskResponse } from '../../store/types/summary.types';

interface StatsData {
  title: string;
  value: string;
  added: string;
  period: string;
  chartColor: string;
  chartData: any;
  icon: React.ReactNode;
  iconBg: string;
}

interface StatsGridProps {
  createChartData: (borderColor: string, backgroundColor: string, data: number[]) => any;
  chartOptions: any;
  itemVariants: any;
  summary?: TSummaryTaskResponse;
}

const formatCount = (value?: number) => {
  if (value === undefined || value === null) return '00';
  const s = String(value);
  return value < 10 ? s.padStart(2, '0') : s;
};

export const StatsGrid = ({
  createChartData,
  chartOptions,
  itemVariants,
  summary,
}: StatsGridProps) => {
  const statsData: StatsData[] = [
    {
      title: 'Open Task',
      value: formatCount(summary?.openTask?.total),
      added: `${formatCount(summary?.openTask?.addedLast6Months)} ADDED`,
      period: 'LAST 6 MONTH',
      chartColor: CHART_COLORS.OPEN.PRIMARY,
      chartData: createChartData(
        CHART_COLORS.OPEN.PRIMARY,
        CHART_COLORS.OPEN.BACKGROUND,
        [8, 12, 6, 14, 10, 12],
      ),
      icon: <OpenIcon className='size-3' />,
      iconBg: CHART_COLORS.OPEN.BACKGROUND,
    },
    {
      title: 'Overdue Task',
      value: formatCount(summary?.overdueTask?.total),
      added: `${formatCount(summary?.overdueTask?.addedLast6Months)} ADDED`,
      period: 'LAST 6 MONTH',
      chartColor: CHART_COLORS.OVERDUE.PRIMARY,
      chartData: createChartData(
        CHART_COLORS.OVERDUE.PRIMARY,
        CHART_COLORS.OVERDUE.BACKGROUND,
        [3, 7, 4, 8, 6, 5],
      ),
      icon: <OverdueIcon className='size-3' />,
      iconBg: CHART_COLORS.OVERDUE.BACKGROUND,
    },
    {
      title: 'In-Progress',
      value: formatCount(summary?.inProgress?.total),
      added: `${formatCount(summary?.inProgress?.addedLast6Months)} ADDED`,
      period: 'LAST 6 MONTH',
      chartColor: CHART_COLORS.IN_PROGRESS.PRIMARY,
      chartData: createChartData(
        CHART_COLORS.IN_PROGRESS.PRIMARY,
        CHART_COLORS.IN_PROGRESS.BACKGROUND,
        [1, 3, 2, 4, 1, 2],
      ),
      icon: <InProgressIcon className='size-3' />,
      iconBg: CHART_COLORS.IN_PROGRESS.BACKGROUND,
    },
    {
      title: 'Completed',
      value: formatCount(summary?.completed?.total),
      added: `${formatCount(summary?.completed?.addedLast6Months)} ADDED`,
      period: 'LAST 6 MONTH',
      chartColor: CHART_COLORS.COMPLETED.PRIMARY,
      chartData: createChartData(
        CHART_COLORS.COMPLETED.PRIMARY,
        CHART_COLORS.COMPLETED.BACKGROUND,
        [5, 6, 8, 7, 9, 8],
      ),
      icon: <CompletedIcon className='size-3' />,
      iconBg: CHART_COLORS.COMPLETED.BACKGROUND,
    },
  ];

  return (
    <motion.div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      variants={itemVariants}
    >
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          added={stat.added}
          period={stat.period}
          icon={stat.icon}
          iconBg={stat.iconBg}
          chartData={stat.chartData}
          chartOptions={chartOptions}
          variants={itemVariants}
        />
      ))}
    </motion.div>
  );
};

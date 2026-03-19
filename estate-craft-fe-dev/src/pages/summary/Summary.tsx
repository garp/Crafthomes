import { motion } from 'framer-motion';
import { PageTransition, StatsGrid } from '../../components/common';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import {
  useGetSummaryQuery,
  useGetPaymentProgressQuery,
  useGetMomProgressQuery,
} from '../../store/services/summary/summarySlice';
import { DEFAULT_CHART_OPTIONS, CHART_MONTHS } from '../../constants';
import TasksSection from './components/TasksSection';
import CalendarSection from './components/CalendarSection';
import MOMSection from './components/MOMSection';
import PaymentSection from './components/PaymentSection';
import { itemVariants } from '../../constants/common';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export const Summary = () => {
  const { data: summary, isLoading: isSummaryLoading } = useGetSummaryQuery();
  const { data: paymentProgress } = useGetPaymentProgressQuery();
  const { data: momProgress, isLoading: isMomLoading } = useGetMomProgressQuery();
  // Chart data for each stat card
  const createChartData = (borderColor: string, backgroundColor: string, data: number[]) => ({
    labels: CHART_MONTHS,
    datasets: [
      {
        data: data,
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  });

  const chartOptions = DEFAULT_CHART_OPTIONS;

  return (
    <PageTransition>
      <motion.div variants={itemVariants} className='space-y-6'>
        <StatsGrid
          createChartData={createChartData}
          chartOptions={chartOptions}
          itemVariants={itemVariants}
          summary={summary}
        />
        <PaymentSection paymentProgress={paymentProgress} isLoading={isSummaryLoading} />
        <TasksSection />
        <CalendarSection />
        <MOMSection momProgress={momProgress} isLoading={isMomLoading} />
      </motion.div>
    </PageTransition>
  );
};

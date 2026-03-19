import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';

interface StatsCardProps {
  title: string;
  value: string;
  added: string;
  period: string;
  icon: React.ReactNode;
  iconBg: string;
  chartData: any;
  chartOptions: any;
  variants?: any;
}

export const StatsCard = ({
  title,
  value,
  added,
  period,
  icon,
  iconBg,
  chartData,
  chartOptions,
  variants,
}: StatsCardProps) => {
  return (
    <motion.div
      className='bg-white rounded p-6 shadow-sm flex flex-col gap-2'
      variants={variants}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ duration: 0.2 }}
    >
      <div className='flex items-center'>
        <div
          className='size-6 rounded-md flex items-center justify-center'
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <h3 className='text-base font-bold text-[#323232] ml-2'>{title}</h3>
      </div>

      <div className='flex items-end justify-between'>
        <div>
          <p className='text-3xl font-semibold text-[#203A53]'>{value}</p>
        </div>
        <div className='w-16 h-8'>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <hr className='border-[#E0E5EF] my-1' />

      <div className='flex items-center justify-between'>
        <p className='text-xs'>
          <span className='text-[#000000] font-bold mr-1'>{added}</span>
          <span className='text-[#949494]'>{period}</span>
        </p>
      </div>
    </motion.div>
  );
};

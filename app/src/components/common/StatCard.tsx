import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  variants?: any;
}

export const StatCard = ({
  title,
  value,
  icon,
  iconBgColor = '#E3E3E3',
  variants,
}: StatCardProps) => {
  return (
    <motion.div
      className='flex justify-between items-center bg-white rounded p-5 shadow-sm h-full'
      variants={variants}
      whileHover={{ scale: 1.02 }}
    >
      <div>
        <p className='text-sm font-medium text-[#545454]'>{title}</p>
        <p className='text-3xl font-semibold text-[#203A53]'>{value}</p>
      </div>
      <div
        className='size-14 rounded-full flex items-center justify-center'
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </div>
    </motion.div>
  );
};

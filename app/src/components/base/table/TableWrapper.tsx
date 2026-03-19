import { Table } from '@mantine/core';
import { motion } from 'framer-motion';
import { getTotalPages } from '../../../utils/helper';
import CustomPagination from '../CustomPagination';

export type TTableWrapperProps = {
  totalCount: number | undefined;
  children: React.ReactNode;
  showPagination?: boolean;
  pageLength?: number;
};

export default function TableWrapper({
  totalCount,
  children,
  showPagination = true,
  pageLength = 10,
}: TTableWrapperProps) {
  const totalPages = getTotalPages(totalCount, pageLength);
  const shouldShowPagination = showPagination && totalPages > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='rounded-lg flex-1 flex flex-col w-full mt-4 min-h-0'
    >
      <div className='bg-white overflow-x-auto flex-1 w-full mb-4 min-h-0 border border-gray-200 rounded-lg'>
        <Table highlightOnHover style={{ minWidth: '1200px' }}>
          {children}
        </Table>
      </div>
      {shouldShowPagination && <CustomPagination total={totalPages} />}
    </motion.div>
  );
}

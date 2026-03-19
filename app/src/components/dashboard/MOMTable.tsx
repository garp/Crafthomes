import { motion } from 'framer-motion';
import { Table, Text, Badge, Skeleton } from '@mantine/core';
import type { FC } from 'react';
import { TextHeader } from '../base/table/TableHeader';
import type { MOMTableProps } from '../../pages/summary/types/types';

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('CANCEL')) {
      return { bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-500' };
    }
    if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('APPROV')) {
      return { bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-500' };
    }
    if (s.includes('PENDING') || s.includes('DRAFT') || s.includes('OPEN')) {
      return { bgColor: 'bg-orange-100', textColor: 'text-orange-800', dotColor: 'bg-orange-500' };
    }
    return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-500' };
  };

  const config = getStatusConfig(status);

  return (
    <div className='flex items-center gap-2'>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
      <span className={`text-sm font-medium ${config.textColor}`}>{String(status || 'N/A')}</span>
    </div>
  );
};

const AttachmentBadge = ({ count }: { count: number }) => {
  return (
    <Badge size='sm' variant='light' color='gray' className='text-xs'>
      {count} files
    </Badge>
  );
};

const MOMTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  const borderStyle = { borderBottom: '1px solid #d1d5db' } as const;

  return (
    <>
      {Array.from({ length: rows }, (_, idx) => (
        <Table.Tr key={`mom-skeleton-${idx}`} className='h-12'>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width={90} radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width={70} radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width='85%' radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width='70%' radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={20} width={70} radius='xl' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <div className='flex items-center gap-2'>
              <Skeleton height={8} width={8} radius='xl' />
              <Skeleton height={12} width={80} radius='sm' />
            </div>
          </Table.Td>
          <Table.Td
            style={{
              position: 'sticky',
              right: '0px',
              zIndex: 5,
              width: '120px',
              minWidth: '120px',
              borderBottom: '1px solid #d1d5db',
              backgroundColor: 'white',
            }}
          >
            <Skeleton height={12} width={40} radius='sm' />
          </Table.Td>
        </Table.Tr>
      ))}
    </>
  );
};

export const MOMTable: FC<MOMTableProps> = ({ data, variants, onViewMom, isLoading }) => {
  return (
    <motion.div
      className='bg-white rounded-lg border border-gray-200 overflow-hidden'
      variants={variants}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='p-4 border-b border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-900'>Minutes of Meeting</h3>
      </div>

      <div className='overflow-x-hidden'>
        <Table className='w-full table-fixed'>
          <Table.Thead>
            <Table.Tr className='h-12'>
              <TextHeader config='standard'>Date</TextHeader>
              <TextHeader config='narrow'>Time</TextHeader>
              <TextHeader config='wide'>Project</TextHeader>
              <TextHeader config='standard'>Meeting With</TextHeader>
              <TextHeader config='narrow'>Attachments</TextHeader>
              <TextHeader config='standard'>Status</TextHeader>
              <TextHeader
                config='action'
                isSticky={{ position: 'right', offset: 0, withShadow: true }}
              >
                View
              </TextHeader>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody className='divide-y divide-gray-100'>
            {isLoading ? (
              <MOMTableSkeleton rows={5} />
            ) : (
              data.map((mom) => (
                <Table.Tr
                  key={mom.id}
                  className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                  style={{
                    transformOrigin: 'center',
                  }}
                >
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm font-medium text-gray-900'>
                      {mom.date}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm text-gray-900'>
                      {mom.time}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm text-gray-900'>
                      {mom.project}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm text-gray-900'>
                      {mom.meetingWith}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <AttachmentBadge count={mom.attachments} />
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <StatusBadge status={mom.status} />
                  </Table.Td>
                  <Table.Td
                    style={{
                      position: 'sticky',
                      right: '0px',
                      zIndex: 5,
                      width: '120px',
                      minWidth: '120px',
                      borderBottom: '1px solid #d1d5db',
                      backgroundColor: 'white',
                    }}
                    className='transition-all duration-300 ease-in-out group-hover:bg-linear-to-r group-hover:from-blue-50 group-hover:to-indigo-50'
                  >
                    <button
                      className='text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors cursor-pointer'
                      onClick={() => onViewMom?.(mom.projectId)}
                    >
                      View
                    </button>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </motion.div>
  );
};

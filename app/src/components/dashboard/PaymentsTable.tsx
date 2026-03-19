import { motion } from 'framer-motion';
import { Table, Text, Avatar, Skeleton } from '@mantine/core';
import type { FC } from 'react';
import { TextHeader } from '../base/table/TableHeader';
import type { PaymentsTableProps } from '../../pages/summary/types/types';

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          dotColor: 'bg-orange-500',
        };
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500',
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className='flex items-center gap-2'>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
      <span className={`text-sm font-medium ${config.textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
};

const PaymentsTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  const borderStyle = { borderBottom: '1px solid #d1d5db' } as const;

  return (
    <>
      {Array.from({ length: rows }, (_, idx) => (
        <Table.Tr key={`payments-skeleton-${idx}`} className='h-12'>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width='60%' radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width='85%' radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <div className='flex items-center gap-3'>
              <Skeleton height={28} width={28} radius='xl' />
              <Skeleton height={12} width='70%' radius='sm' />
            </div>
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width='55%' radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <Skeleton height={12} width='65%' radius='sm' />
          </Table.Td>
          <Table.Td style={borderStyle}>
            <div className='flex items-center gap-2'>
              <Skeleton height={8} width={8} radius='xl' />
              <Skeleton height={12} width={70} radius='sm' />
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

export const PaymentsTable: FC<PaymentsTableProps> = ({
  data,
  variants,
  onViewPayment,
  isLoading,
}) => {
  return (
    <motion.div
      className='bg-white rounded-lg border border-gray-200 overflow-hidden'
      variants={variants}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='p-4 border-b border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-900'>Payments</h3>
      </div>

      <div className='overflow-x-hidden'>
        <Table className='w-full table-fixed'>
          <Table.Thead>
            <Table.Tr className='h-12'>
              <TextHeader config='standard'>Payment Type</TextHeader>
              <TextHeader config='wide'>Project</TextHeader>
              <TextHeader config='standard'>Vendor/Client</TextHeader>
              <TextHeader config='narrow'>Amount</TextHeader>
              <TextHeader config='standard'>Due Date</TextHeader>
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
              <PaymentsTableSkeleton rows={5} />
            ) : (
              data.map((payment) => (
                <Table.Tr
                  key={payment.id}
                  className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                  style={{
                    transformOrigin: 'center',
                  }}
                >
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm font-medium text-gray-900'>
                      {payment.paymentType ?? 'N/A'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm text-gray-900'>
                      {payment.milestone ?? 'N/A'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <div className='flex items-center gap-3'>
                      <Avatar src={payment.vendorClient.avatar} size='sm' className='shrink-0'>
                        {payment.vendorClient.name.charAt(0)}
                      </Avatar>
                      <Text size='sm' className='text-sm text-gray-900'>
                        {payment.vendorClient.name}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm font-medium text-gray-900'>
                      {payment.amount}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <Text size='sm' className='text-sm text-gray-900'>
                      {payment.dueDate}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                    <StatusBadge status={payment.status} />
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
                      onClick={() => onViewPayment?.(payment.projectId)}
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

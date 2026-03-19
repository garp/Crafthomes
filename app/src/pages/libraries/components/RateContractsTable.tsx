import { motion } from 'framer-motion';
import { Table, Text } from '@mantine/core';
import { Avatar } from '../../../components/common';
import { RATE_CONTRACTS_TABLE_DATA } from '../constants/constants';
import { IconDotsVertical } from '@tabler/icons-react';
import StatusBadge from '../../../components/common/StatusBadge';

export default function RateContractTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-white rounded-lg border border-gray-200 overflow-hidden'
    >
      <div className='overflow-x-auto'>
        <Table className='min-w-full'>
          <Table.Thead>
            <Table.Tr className='h-12'>
              <Table.Th>#</Table.Th>
              <Table.Th>Vendor Name & ID</Table.Th>
              <Table.Th>Buyer Name</Table.Th>
              <Table.Th>Contract Name</Table.Th>
              <Table.Th>Vendor Category</Table.Th>
              <Table.Th>Created by</Table.Th>
              <Table.Th>Start from</Table.Th>
              <Table.Th>Valid Through</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Attachment</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody className='divide-y divide-gray-100'>
            {RATE_CONTRACTS_TABLE_DATA.map((rateContract) => (
              <Table.Tr
                key={rateContract?.id}
                className='group h-12 border-b border-gray-200 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                style={{
                  transformOrigin: 'center',
                }}
              >
                <Table.Td>
                  <Text
                    size='sm'
                    className='flex  items-center gap-5 text-sm font-medium text-gray-900'
                  >
                    {rateContract?.id}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <div>
                    <Text size='sm'>{rateContract?.vendorNameAndId?.name}</Text>
                    <Text size='sm'>{rateContract?.vendorNameAndId?.id}</Text>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{rateContract?.buyerName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{rateContract?.contractName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{rateContract?.vendorCategory}</Text>
                </Table.Td>
                <Table.Td>
                  <div className='flex gap-2 items-center'>
                    <Avatar size='sm' className='ml-2' name={rateContract?.createdBy} />
                    <Text size='sm'>{rateContract?.createdBy} </Text>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{rateContract?.startFrom}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{rateContract?.validThrough}</Text>
                </Table.Td>
                <Table.Td>
                  <StatusBadge status={rateContract?.status} />
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{rateContract?.attachment}</Text>
                </Table.Td>
                <Table.Td>
                  <button className='cursor-pointer'>
                    <IconDotsVertical className='text-gray-500 size-5' />
                  </button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </motion.div>
  );
}

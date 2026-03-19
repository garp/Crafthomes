import { motion } from 'framer-motion';
import { Table, Text } from '@mantine/core';
import { Avatar } from '../../../components/common';
import { ELEMENT_LIBRARY_TABLE_DATA } from '../constants/constants';
import { IconDotsVertical } from '@tabler/icons-react';

export default function ElementLibraryTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-white rounded-lg border border-gray-200 overflow-hidden'
    >
      <div className='overflow-x-auto no-scrollbar'>
        <Table className='min-w-full'>
          <Table.Thead>
            <Table.Tr className='h-12'>
              <Table.Th>#</Table.Th>
              <Table.Th>Library Name</Table.Th>
              <Table.Th>Type of Library</Table.Th>
              <Table.Th>Created By</Table.Th>
              <Table.Th>Last Updated</Table.Th>
              <Table.Th>Section</Table.Th>
              <Table.Th>Elements</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody className='divide-y divide-gray-100'>
            {ELEMENT_LIBRARY_TABLE_DATA.map((elementLibrary) => (
              <Table.Tr
                key={elementLibrary?.id}
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
                    {elementLibrary?.id}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{elementLibrary?.libraryName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{elementLibrary?.typeOfLibrary}</Text>
                </Table.Td>
                <Table.Td>
                  <div className='flex items-center gap-2 '>
                    <Avatar size='sm' name={elementLibrary?.createdBy} />
                    <Text size='sm'>{elementLibrary?.createdBy}</Text>
                  </div>
                </Table.Td>
                <Table.Td>
                  <div className='flex gap-2 items-center'>
                    <Text size='sm'>{elementLibrary?.lastUpdated?.date} </Text>
                    <Avatar size='sm' className='ml-2' name={elementLibrary?.lastUpdated?.user} />
                    <p className='text-nowrap'>{elementLibrary?.lastUpdated?.user}</p>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{elementLibrary?.section}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{elementLibrary?.elements}</Text>
                </Table.Td>
                <Table.Td>
                  <button className='cursor-pointer'>
                    <IconDotsVertical className='text-text-subHeading size-5' />
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

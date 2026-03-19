import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '../../../components/base';
import { AddClientSidebar } from '../../../components/client/AddClientSidebar';
// import ClientNameFilter from '../../../components/client/ClientNameFilter';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';

import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import ClientSelector from '../../../components/common/selectors/ClientSelector';
import FormSelect from '../../../components/base/FormSelect';

export const ClientHeader = () => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { deleteParams, getParam, setParams } = useUrlSearchParams();

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  const handleCreateClient = () => {
    setIsAddClientOpen(true);
  };
  const handleCloseSidebar = () => {
    setIsAddClientOpen(false);
  };
  function handleClearFilter() {
    deleteParams(['id', 'projectId', 'status']);
  }
  return (
    <motion.div
      className='flex items-center justify-between gap-4'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='flex items-center gap-3'>
        <ClientSelector
          inputClassName='!border-0 !rounded-lg !py-6 '
          setValue={(val) => setParams('id', val)}
          value={getParam('id')}
        />

        {/* Status filter: ALL / ACTIVE / INACTIVE (default ACTIVE) */}
        <FormSelect
          placeholder='Status'
          value={statusValue}
          onChange={(val) => setParams('status', val || '')}
          options={[
            { label: 'All', value: '' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
          className='w-40'
          inputClassName='!border-0 !py-6 !rounded-lg'
        />

        <ClearFilterButton onClick={handleClearFilter} />
      </div>

      {/* View Toggle */}
      <div className='flex items-center gap-3'>
        <Button variant='primary' size='lg' radius='full' onClick={handleCreateClient}>
          Add Client
        </Button>
      </div>

      {/* Add Client Sidebar */}
      <AddClientSidebar
        isOpen={isAddClientOpen}
        onClose={handleCloseSidebar}
        // onSubmit={handleAddClient}
      />
    </motion.div>
  );
};

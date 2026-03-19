import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '../../../components/base';
import AddVendorSidebar from '../../../components/vendor/AddVendorSidebar';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';

import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import VendorSelector from '../../../components/common/selectors/VendorSelector';
import FormSelect from '../../../components/base/FormSelect';

export const VendorHeader = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const { deleteParams, getParam, setParams } = useUrlSearchParams();

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  const handleCreateVendor = () => {
    setIsAddVendorOpen(true);
  };
  const handleCloseSidebar = () => {
    setIsAddVendorOpen(false);
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
        <VendorSelector
          inputClassName='!border-0 !rounded-lg !py-6 '
          setValue={(val) => setParams('id', val)}
          value={getParam('id')}
          allowFilter
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
        <Button variant='primary' size='lg' radius='full' onClick={handleCreateVendor}>
          Add Vendor
        </Button>
      </div>

      {/* Add Vendor Sidebar */}
      <AddVendorSidebar
        isOpen={isAddVendorOpen}
        onClose={handleCloseSidebar}
        // onSubmit={handleAddVendor}
      />
    </motion.div>
  );
};

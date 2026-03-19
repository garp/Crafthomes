import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../../components/base';
import { itemVariants } from '../../constants/constants';
import { AddUserSettingsSidebar } from '../../../../components/settings/AddUserSettingsSidebar';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import InternalUserSelector from '../../../../components/common/selectors/InternalUserSelector';
import FormSelect from '../../../../components/base/FormSelect';
import ClearFilterButton from '../../../../components/base/button/ClearFilterButton';

export const UserProfileHeader = () => {
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const { getParam, setParams, deleteParams } = useUrlSearchParams();

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  function handleClearFilters() {
    deleteParams(['userId', 'status']);
  }

  return (
    <>
      <motion.div className='flex items-center justify-between' variants={itemVariants}>
        <div className='flex items-center space-x-4'>
          {/* Select User - searchable, using internal users API */}
          <InternalUserSelector
            value={getParam('userId')}
            setValue={(val) => setParams('userId', val)}
            allowFilter
            inputClassName='!border-0 !py-6 !rounded-lg'
          />

          {/* Commented out project filter as requested */}
          {/* <SelectBox
            value={projectNameFilter}
            onChange={(value) => setProjectNameFilter(value as string)}
            placeholder='Select project'
            option={projectNameOptions}
            width='200px'
          /> */}

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

          <ClearFilterButton onClick={handleClearFilters} />
        </div>
        <div className='flex items-center gap-3'>
          <Button onClick={() => setIsOpenSidebar(true)} variant='primary' size='lg' radius='full'>
            Add User
          </Button>
        </div>
      </motion.div>
      <AddUserSettingsSidebar isOpen={isOpenSidebar} onClose={() => setIsOpenSidebar(false)} />
    </>
  );
};

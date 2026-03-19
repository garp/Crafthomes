import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '../../../components/base';
import { AddUserSidebar } from '../../../components/users/AddUserSidebar';
import UserSelector from '../../../components/common/selectors/UserSelector';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';
// import ProjectSelector from '../../../components/common/selectors/ProjectSelector';
import FormSelect from '../../../components/base/FormSelect';
import ClientSelector from '../../../components/common/selectors/ClientSelector';
import VendorSelector from '../../../components/common/selectors/VendorSelector';
import { getUser } from '../../../utils/auth';

export const UserHeader = () => {
  const handleCreateUser = () => {
    setIsOpenSidebar(true);
  };

  const { setParams, deleteParams, getParam } = useUrlSearchParams();
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const currentUserRoleName = getUser()?.role?.name?.toLowerCase?.() ?? '';
  const isClientOrVendorRole = ['client', 'client_contact', 'vendor', 'vendor_client'].includes(
    currentUserRoleName,
  );

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  function handleClearFilters() {
    deleteParams(['userId', 'projectId', 'filterBy', 'clientId', 'vendorId', 'status']);
  }
  return (
    <>
      <motion.div
        className='flex items-center justify-between gap-4'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className='flex items-center gap-3 w-full'>
          <UserSelector
            inputClassName='!border-0 !py-6 !rounded-lg'
            value={getParam('userId')}
            setValue={(val) => setParams('userId', val)}
          />
          {/* <ProjectSelector
            inputClassName='!border-0 !py-6 !rounded-lg'
            value={getParam('projectId')}
            setValue={(projectName) => setParams('projectId', projectName)}
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

          {!isClientOrVendorRole && (
            <>
              <FormSelect
                placeholder='Filter By'
                value={getParam('filterBy') || ''}
                onChange={(val) => {
                  if (!val) {
                    deleteParams(['filterBy', 'clientId', 'vendorId', 'page']);
                    return;
                  }

                  deleteParams(['clientId', 'vendorId', 'page']);
                  setParams('filterBy', val);
                }}
                options={[
                  { label: 'Client', value: 'client' },
                  { label: 'Vendor', value: 'vendor' },
                ]}
                className='w-40'
                inputClassName='!border-0 !py-6 !rounded-lg'
              />
              {getParam('filterBy') === 'client' && (
                <ClientSelector
                  inputClassName='!border-0 !py-6 !rounded-lg'
                  value={getParam('clientId')}
                  setValue={(val) => setParams('clientId', val)}
                  allowFilter
                />
              )}
              {getParam('filterBy') === 'vendor' && (
                <VendorSelector
                  value={getParam('vendorId')}
                  setValue={(val) => setParams('vendorId', val)}
                  allowFilter
                />
              )}
            </>
          )}
          <ClearFilterButton onClick={handleClearFilters} />
        </div>

        <div className='flex items-center gap-3'>
          <Button radius='full' className=' px-8' onClick={handleCreateUser}>
            Add User
          </Button>
        </div>
      </motion.div>
      <AddUserSidebar isOpen={isOpenSidebar} onClose={() => setIsOpenSidebar(false)} />
    </>
  );
};

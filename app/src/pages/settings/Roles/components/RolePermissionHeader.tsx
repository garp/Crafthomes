import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../../components/base';
import { itemVariants } from '../../constants/constants';
import ManageRolesSidebar from './ManageRolesSidebar';
import { IconSettings } from '@tabler/icons-react';

export const RolePermissionHeader = () => {
  const [rolesSidebarOpen, setRolesSidebarOpen] = useState(false);

  return (
    <>
      <motion.div
        className='border-b border-gray-200 flex min-[800px]:flex-row flex-col gap-y-4 min-[800px]:items-center justify-end py-2'
        variants={itemVariants}
      >
        <Button
          variant='primary'
          size='md'
          radius='full'
          className='bg-black text-white hover:bg-gray-800 w-fit flex items-center gap-2'
          onClick={() => setRolesSidebarOpen(true)}
        >
          <IconSettings size={18} />
          Manage Roles
        </Button>
      </motion.div>

      <ManageRolesSidebar opened={rolesSidebarOpen} onClose={() => setRolesSidebarOpen(false)} />
    </>
  );
};

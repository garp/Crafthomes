import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/base';
import { IconSettings } from '@tabler/icons-react';
import { RolePermissionTable } from './components/RolePermissionTable';
import { ModuleAccessTable } from './components/ModuleAccessTable';
import ManageRolesSidebar from './components/ManageRolesSidebar';

export default function RoleSettingsPage() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'moduleAccess'>('permissions');
  const [rolesSidebarOpen, setRolesSidebarOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  return (
    <>
      {/* Tabs + Manage Roles in one row */}
      <div className='flex items-center justify-between border-b border-gray-200'>
        <div className='flex space-x-6'>
          <button
            className={`pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('permissions')}
          >
            API Permissions
          </button>
          <button
            className={`pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'moduleAccess'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('moduleAccess')}
          >
            Module Access
          </button>
        </div>

        <Button
          variant='primary'
          size='md'
          radius='full'
          className='bg-black text-white hover:bg-gray-800 w-fit flex items-center gap-2 mb-2'
          onClick={() => setRolesSidebarOpen(true)}
        >
          <IconSettings size={18} />
          Manage Roles
        </Button>
      </div>

      {/* Animated tab content */}
      <AnimatePresence mode='wait'>
        {activeTab === 'permissions' ? (
          <motion.div
            key='permissions'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <RolePermissionTable selectedRoleId={selectedRoleId} onRoleChange={setSelectedRoleId} />
          </motion.div>
        ) : (
          <motion.div
            key='moduleAccess'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ModuleAccessTable selectedRoleId={selectedRoleId} onRoleChange={setSelectedRoleId} />
          </motion.div>
        )}
      </AnimatePresence>

      <ManageRolesSidebar opened={rolesSidebarOpen} onClose={() => setRolesSidebarOpen(false)} />
    </>
  );
}

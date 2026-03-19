import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { itemVariants, tabs, tabVariants } from '../constants/constants';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModuleAccess } from '../../../hooks/useModuleAccess';

export const TabNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasTypeLevel, isSuperAdmin } = useModuleAccess();

  // Filter tabs based on module access
  const visibleTabs = useMemo(() => {
    if (isSuperAdmin) return tabs;
    return tabs.filter((tab) => hasTypeLevel('settings', tab.id));
  }, [isSuperAdmin, hasTypeLevel]);

  return (
    <>
      <motion.div variants={itemVariants} className='flex space-x-8 border-b border-gray-200 mb-5'>
        {visibleTabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              location.pathname.includes(tab?.link)
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => navigate(tab?.link)}
            variants={tabVariants}
            animate={location.pathname.includes(tab?.link) ? 'active' : 'inactive'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </>
  );
};

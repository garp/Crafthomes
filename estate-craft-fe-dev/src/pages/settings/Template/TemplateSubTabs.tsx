import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const subtabs = [
  {
    id: 'projectType',
    label: 'Project Type',
    link: '/settings/template/project-type',
  },
  {
    id: 'projectTypeGroup',
    label: 'Project Type Group',
    link: '/settings/template/project-type-group',
  },
];

const tabVariants = {
  inactive: {
    color: '#9CA3AF',
    borderColor: 'transparent',
  },
  active: {
    color: '#1F2937',
    borderColor: '#1F2937',
  },
};

export default function TemplateSubTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className='flex space-x-6 border-b border-gray-200 mb-4'>
      {subtabs.map((tab) => {
        const isActive =
          location.pathname === tab.link || location.pathname.startsWith(tab.link + '/');
        return (
          <motion.button
            key={tab.id}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              isActive
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => navigate(tab.link)}
            variants={tabVariants}
            animate={isActive ? 'active' : 'inactive'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}

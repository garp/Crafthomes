import { motion } from 'framer-motion';
import { Button } from '../../../components/base';
import { itemVariants } from '../constants/constants';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const SUBTABS = [
  {
    title: 'Project Type',
    value: 'projectTypeGroup',
  },
  {
    title: 'Timelines',
    value: 'timelines',
  },
  {
    title: 'Phases',
    value: 'phases',
  },
  {
    title: 'Tasks',
    value: 'tasks',
  },
];

export const PhaseManagementHeader = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  function navigateSubTab(subtab: string) {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('subtab', subtab);
      // Clear filter-related params when switching tabs
      newParams.delete('query');
      newParams.delete('page');
      newParams.delete('globalQuery');
      return newParams;
    });
  }
  useEffect(() => {
    if (!searchParams.get('subtab')) {
      setSearchParams(
        (prev) => {
          prev.set('subtab', 'projectTypeGroup');
          return prev;
        },
        { replace: true },
      );
    }
  }, []);
  return (
    <motion.div className=' border-gray-200 flex flex-col gap-5' variants={itemVariants}>
      <div className='flex gap-4'>
        {SUBTABS.map((tab) => (
          <Button
            key={tab?.title}
            onClick={() => navigateSubTab(tab.value)}
            className={`${searchParams.get('subtab') === tab.value ? '!bg-bg-primary' : '!bg-[#929294] '} !font-medium !rounded-full px-5 !py-3 !h-9`}
          >
            {tab.title}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

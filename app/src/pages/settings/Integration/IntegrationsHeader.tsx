import { motion } from 'framer-motion';
import { Button, Input } from '../../../components/base';
import { INTEGRATION_SUB_TABS, itemVariants } from '../constants/constants';
import { IconSearch } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export const IntegrationsHeader = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!searchParams.get('subtab')) {
      setSearchParams(
        (prev) => {
          prev.set('subtab', 'all');
          return prev;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);
  function handleSubtabSwitch(tab: string) {
    setSearchParams(
      (prev) => {
        prev.set('subtab', tab);
        return prev;
      },
      { replace: true },
    );
  }
  return (
    <motion.div
      className='border-gray-200 flex flex-col gap-y-8  justify-between'
      variants={itemVariants}
    >
      {/* TAB SECTION */}
      <section className='flex gap-3 flex-wrap'>
        {INTEGRATION_SUB_TABS.map((tab) => (
          <Button
            onClick={() => handleSubtabSwitch(tab.value)}
            className={`
              ${searchParams.get('subtab') === tab.value ? '!bg-bg-primary' : '!bg-[#929294] '} !text-sm !font-medium !rounded-full px-5 !h-8`}
          >
            {tab.title}
          </Button>
        ))}
      </section>

      {/* SEARCH SECTION */}
      <section className='flex md:flex-row flex-col justify-between w-full gap-y-5 gap-x-5'>
        <Input
          className='text-text-subHeading'
          rightSectionClassName='mr-5'
          placeholder='Search'
          width='25rem'
          backgroundColor='#ffffff'
          rightSection={<IconSearch className='size-5  bg-white' />}
        />
        <Button
          variant='primary'
          size='md'
          radius='full'
          className='!bg-button-bg text-white hover:bg-gray-800 w-fit px-5 !text-sm !font-medium'
        >
          Add Integration
        </Button>
      </section>
    </motion.div>
  );
};

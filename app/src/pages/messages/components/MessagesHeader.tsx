import { motion } from 'framer-motion';
import { SearchIcon } from '../../../components/icons';
import { Input, SelectBox, Button } from '../../../components/base';
import { senderOptions, messageTypeOptions, projectOptions } from '../constants/constants';
import SendMessageSidebar from '../../../components/message/SendMessageSidebar';
import { useState } from 'react';

export const MessagesHeader = () => {
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  return (
    <>
      <motion.div
        className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto'>
          <div className='w-full sm:flex-2 lg:flex-2'>
            <Input
              placeholder='Search messages...'
              rightSection={<SearchIcon className='h-4 w-4 text-[#80899A]' />}
              width='100%'
              height='48px'
              radius='sm'
              border='1px solid border-light'
              backgroundColor='bg-text-secondary'
            />
          </div>
          <div className='w-full sm:flex-1 lg:flex-1'>
            <SelectBox
              placeholder='Sender'
              option={senderOptions}
              width='100%'
              height='48px'
              border='1px solid border-light'
            />
          </div>

          <div className='w-full sm:flex-1 lg:flex-1'>
            <SelectBox
              placeholder='Type'
              option={messageTypeOptions}
              width='100%'
              height='48px'
              border='1px solid border-light'
            />
          </div>

          <div className='w-full sm:flex-1 lg:flex-1'>
            <SelectBox
              placeholder='Project'
              option={projectOptions}
              width='100%'
              height='48px'
              border='1px solid border-light'
            />
          </div>
        </div>

        <div className='flex items-center gap-3 w-full sm:w-auto justify-center lg:justify-end'>
          <Button
            onClick={() => setIsOpenSidebar(true)}
            variant='primary'
            size='lg'
            radius='full'
            className='w-full sm:w-auto'
          >
            Send Message
          </Button>
        </div>
      </motion.div>
      <SendMessageSidebar
        isOpen={isOpenSidebar}
        onClose={() => setIsOpenSidebar(false)}
        onSubmit={() => {}}
      />
    </>
  );
};

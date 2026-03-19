import { CrafthomesWordmark, NotificationsButton, UserProfileMenu } from './common';

import { motion } from 'framer-motion';
import { getUser } from '../utils/auth';
import { parseSnakeCaseString } from '../utils/helper';

export const Header = () => {
  const user = getUser();
  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -30,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: -15,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.25,
      },
    },
  };

  return (
    <motion.div
      className='min-h-20 w-full bg-white flex items-center justify-between px-4 md:px-8 border-b border-border-light'
      initial='hidden'
      animate='visible'
      variants={headerVariants}
    >
      <motion.div className='flex items-center' variants={itemVariants}>
        <motion.div
          className='cursor-pointer shrink-0'
          whileHover={{
            opacity: 0.85,
            scale: 1.02,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
          }}
        >
          <CrafthomesWordmark className='text-2xl md:text-[1.65rem]' />
        </motion.div>
      </motion.div>

      <div className='flex items-center gap-3 md:gap-4'>
        {/* TODO: Search field — uncomment when ready
        <motion.div variants={itemVariants}>
          <Input ... />
        </motion.div>
        */}

        <motion.div variants={itemVariants}>
          <NotificationsButton />
        </motion.div>

        {/* TODO: Chat/Messages icon — uncomment when ready
        <motion.button
          className='border border-border-light bg-bg-light rounded-full flex items-center justify-center size-11 text-gray-500 cursor-pointer'
          variants={itemVariants}
          whileHover={{ backgroundColor: 'white', borderColor: 'border-hover', scale: 1.05, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
            <ChatIcon className='size-5 text-text-secondary' />
          </motion.div>
        </motion.button>
        */}

        <UserProfileMenu
          userName={user?.name}
          userRole={parseSnakeCaseString(user?.role?.name)}
          userInitials={user?.name?.slice(0, 2)}
        />
      </div>
    </motion.div>
  );
};

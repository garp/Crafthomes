import { motion } from 'framer-motion';
import { MessageCard } from './MessageCard';
import { mockMessages } from '../constants/constants';

export const MessagesGrid = () => {
  return (
    <motion.div
      className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      {mockMessages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <MessageCard message={message} />
        </motion.div>
      ))}
    </motion.div>
  );
};

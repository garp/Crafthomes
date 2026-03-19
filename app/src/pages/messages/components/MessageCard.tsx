import { motion } from 'framer-motion';
import {
  ClockIcon,
  UserIcon,
  DocumentIcon,
  ReadEmailIcon,
  UnreadEmailIcon,
  ChatIconFilled,
} from '../../../components/icons';
import type { MessageCardProps } from '../types/types';

export const MessageCard = ({ message }: MessageCardProps) => {
  return (
    <motion.div
      className={`bg-white rounded shadow-sm cursor-pointer hover:shadow-md transition-all duration-200`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`flex items-center justify-between px-6 py-2 rounded-t ${message.isRead ? 'bg-[#E8F9EF]' : 'bg-[#FFF7F1]'}`}
      >
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <ClockIcon className='size-3 text-[#6C6C6C]' />
          <span className='text-xs text-[#6C6C6C] font-medium'>{message.date}</span>
        </div>
        {message.isRead ? (
          <ReadEmailIcon className='size-4' />
        ) : (
          <UnreadEmailIcon className='size-4' />
        )}
      </div>

      <div className='flex flex-col gap-3 px-6 py-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-xs text-[#6C6C6C] font-medium'>Sender</p>
          <div className='flex items-center gap-3'>
            <div className='size-6 bg-[#50B92A] rounded-full flex items-center justify-center'>
              <p className='text-xs text-white font-medium'>{message.senderInitial}</p>
            </div>
            <div>
              <p className='text-[13px] text-black font-semibold'>{message.sender}</p>
            </div>
          </div>
        </div>

        <hr className='text-[#E2E8F0]' />

        <div className='flex flex-col justify-between sm:flex-row gap-3'>
          <div className='flex flex-col justify-center gap-2'>
            <div className='flex items-center gap-2'>
              <UserIcon className='size-3' />
              <p className='text-xs text-[#6C6C6C] font-medium'>Type</p>
            </div>
            <p className='text-[#232323] text-xs font-medium'>{message.type}</p>
          </div>
          <div className='flex flex-col justify-center gap-2'>
            <div className='flex items-center gap-2'>
              <DocumentIcon className='size-3' />
              <p className='text-xs text-[#6C6C6C] font-medium'>Project</p>
            </div>
            <p className='text-[#232323] text-xs font-medium'>{message.project}</p>
          </div>
        </div>
        <hr className='text-[#E2E8F0]' />

        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2'>
            <ChatIconFilled className='size-3 text-[#575757]' />
            <p className='text-xs text-[#6C6C6C] font-medium'>Message Snippet</p>
          </div>
          <p className='text-xs text-[#6C6C6C]'>{message.messageSnippet}</p>
        </div>
      </div>
    </motion.div>
  );
};

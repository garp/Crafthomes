import DrawerModal from './DrawerModal';
import IconButton from './button/IconButton';
import { IconX } from '@tabler/icons-react';
import type { TSidebarModalProps } from '../../types/base';

export default function SidebarModal({
  children,
  onClose,
  heading,
  zIndex,
  ...props
}: TSidebarModalProps) {
  return (
    <DrawerModal onClose={onClose} zIndex={zIndex} {...props}>
      <div className='flex flex-col h-full overflow-auto'>
        {/* Header */}
        <div className='sticky top-0 z-20 py-3 px-6 border-b border flex items-center justify-between bg-bg-light'>
          <h2 className='font-semibold text-gray-900'>{heading}</h2>
          <IconButton onClick={onClose}>
            <IconX className='size-4 text-text-subHeading' />
          </IconButton>
        </div>
        {children}
      </div>
    </DrawerModal>
  );
}

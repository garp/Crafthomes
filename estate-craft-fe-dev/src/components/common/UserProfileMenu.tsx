import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon, LogoutIcon } from '../icons';
import { logout } from '../../utils/auth';
import { Menu, Divider } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useSocket } from '../../hooks/useSocket';
import { parseSnakeCaseString } from '../../utils/helper';

interface UserProfileMenuProps {
  userName: string | undefined;
  userRole: string | undefined;
  userInitials: string | undefined;
}

export const UserProfileMenu = ({ userName, userRole, userInitials }: UserProfileMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useSocket();

  // Use socket user data if available, otherwise fall back to props
  const displayName = currentUser?.name || userName;
  const displayRole = currentUser?.role?.name
    ? parseSnakeCaseString(currentUser.role.name)
    : userRole;
  const displayInitials = currentUser?.name?.slice(0, 2) || userInitials;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Menu opened={isMenuOpen} onChange={setIsMenuOpen} width={280}>
      <Menu.Target>
        <motion.div
          className='h-11 relative border border-[#E0E5EF] bg-[#F3F4F7] rounded-4xl'
          ref={menuRef}
          whileHover={{
            borderColor: '#d1d5db',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className='h-full w-full flex items-center gap-3 cursor-pointer rounded-4xl px-1'
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className='size-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold'
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {displayInitials?.toUpperCase()}
            </motion.div>
            <div className='flex flex-col max-sm:hidden'>
              <span className='text-sm font-medium text-gray-900'>
                {displayName?.split(' ')?.[0]}
              </span>
              <span className='text-xs text-gray-500'>{displayRole}</span>
            </div>
            <motion.div
              className='max-sm:hidden'
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <ChevronDownIcon className='w-4 h-4 text-gray-500' />
            </motion.div>
          </motion.button>
        </motion.div>
      </Menu.Target>
      <Menu.Dropdown className='py-2!'>
        {/* User Details Section */}
        <div className='px-4 py-3'>
          <div className='flex items-center gap-3'>
            <div className='size-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg'>
              {displayInitials?.toUpperCase()}
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-sm font-semibold text-gray-900 truncate'>{displayName}</span>
              <span className='text-xs text-gray-500 truncate'>{currentUser?.email}</span>
              <span className='text-xs text-purple-600 font-medium mt-0.5'>{displayRole}</span>
            </div>
          </div>

          {/* Additional User Info */}
          {currentUser && (
            <div className='mt-3 pt-3 border-t border-gray-100 space-y-2'>
              {currentUser.phoneNumber && (
                <div className='flex items-center gap-2 text-xs text-gray-600'>
                  <span className='text-gray-400'>Phone:</span>
                  <span>{currentUser.phoneNumber}</span>
                </div>
              )}
              <div className='flex items-center gap-2 text-xs text-gray-600'>
                <span className='text-gray-400'>Status:</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    currentUser.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {currentUser.status}
                </span>
              </div>
              <div className='flex items-center gap-2 text-xs text-gray-600'>
                <span className='text-gray-400'>Type:</span>
                <span>{parseSnakeCaseString(currentUser.userType)}</span>
              </div>
            </div>
          )}
        </div>

        <Divider my='xs' />

        {/* Menu Actions */}
        <Menu.Item
          leftSection={<IconUser size={16} />}
          onClick={() => {
            // Navigate to profile page or open profile modal
            setIsMenuOpen(false);
          }}
        >
          View Profile
        </Menu.Item>

        <Menu.Item
          leftSection={<LogoutIcon className='w-4 h-4' />}
          onClick={handleLogout}
          color='red'
          className='logout-button user-profile-menu__logout'
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

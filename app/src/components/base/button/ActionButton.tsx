import { motion } from 'framer-motion';
import { Tooltip } from '@mantine/core';

interface ActionButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  variant?: 'edit' | 'delete' | 'default';
  disabled?: boolean;
  className?: string;
}

export const ActionButton = ({
  icon,
  tooltip,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}: ActionButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'edit':
        return 'text-gray-400 hover:text-blue-600';
      case 'delete':
        return 'text-gray-400 hover:text-red-600';
      default:
        return 'text-gray-400 hover:text-gray-600';
    }
  };

  const buttonClasses = `
    ${getVariantClasses()}
    transition-colors duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <Tooltip label={tooltip} withArrow position='top'>
      <motion.button
        className={buttonClasses}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled || !onClick) return;
          onClick();
        }}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.button>
    </Tooltip>
  );
};

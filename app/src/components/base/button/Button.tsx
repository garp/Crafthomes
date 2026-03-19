import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'light' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  radius = 'lg',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  leftIcon,
  rightIcon,
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center cursor-pointer whitespace-nowrap transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed !text-sm';

  const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-bg-primary text-white hover:bg-gray-800',
    outline: 'bg-[#F3F4F7] text-[#1F1F1F] border border-[#1F1F1F]',
    light: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-transparent',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-4 py-1.5  h-8',
    md: 'px-6 py-2  h-9',
    lg: 'px-8 py-3  h-11',
  };

  const radiusClasses = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${radiusClasses[radius]} ${className}`;

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {leftIcon && <span className={`mr-2 ${iconSizeClasses[size]}`}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={`ml-2 ${iconSizeClasses[size]}`}>{rightIcon}</span>}
    </motion.button>
  );
};

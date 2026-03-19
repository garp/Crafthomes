import { motion } from 'framer-motion';
import { useState } from 'react';

interface SegmentedControlOption {
  value: string;
  icon: React.ReactNode;
  label?: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const SegmentedControl = ({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) => {
  const [activeValue, setActiveValue] = useState(value || options[0]?.value);

  const handleOptionClick = (optionValue: string) => {
    setActiveValue(optionValue);
    onChange?.(optionValue);
  };

  return (
    <div
      className={`flex items-center bg-bg-light border p-[1px] border-border-light rounded ${className}`}
    >
      {options.map((option) => {
        const isActive = activeValue === option.value;

        return (
          <motion.button
            key={option.value}
            className={`flex items-center justify-center size-12 rounded transition-colors cursor-pointer ${
              isActive
                ? 'bg-white text-text-secondary shadow-sm'
                : 'text-text-secondary/60 hover:text-text-secondary hover:bg-white/50'
            }`}
            onClick={() => handleOptionClick(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {option.icon}
          </motion.button>
        );
      })}
    </div>
  );
};

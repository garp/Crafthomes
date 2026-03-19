import { Select, MultiSelect } from '@mantine/core';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { SelectBoxType } from '../../types/base';

export const SelectBox = ({
  name,
  value,
  onChange,
  label,
  option,
  placeholder,
  border = '1px solid #E0E0E0',
  height = '48px',
  width = '144px',
  error,
  searchable,
  onSearchChange,
  onBlur,
  disabled,
  defaultValue,
  multiple,
  className,
}: SelectBoxType) => {
  const [isHovered, setIsHovered] = useState(false);

  const commonStyles = {
    label: {
      color: '#667085',
      fontWeight: '500',
      fontSize: '14px',
    },
    input: {
      border: isHovered ? '1px solid #d1d5db' : border,
      height: height,
      width: width,
      backgroundColor: isHovered ? '#ffffff' : undefined,
      transition: 'all 0.2s ease-in-out',
      fontWeight: 600, // affects entered text
      '::placeholder': {
        fontWeight: 600, // affects placeholder specifically
      },
    },
  };

  if (multiple) {
    return (
      <motion.div
        style={{ width: width }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{
          scale: 1.02,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{
            filter: isHovered
              ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
              : 'drop-shadow(0 0 0 0px transparent)',
          }}
          transition={{ duration: 0.2 }}
        >
          <MultiSelect
            name={name}
            label={label}
            value={value as string[]}
            searchable={searchable}
            onChange={onChange as (value: string[]) => void}
            onBlur={onBlur}
            onSearchChange={onSearchChange}
            placeholder={placeholder}
            data={option}
            defaultValue={
              Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : undefined
            }
            disabled={disabled}
            error={error}
            clearable={true}
            clearButtonProps={<span>x</span>}
            styles={commonStyles}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{ width: width }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        scale: 1.02,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
      }}
    >
      <motion.div
        animate={{
          filter: isHovered
            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
            : 'drop-shadow(0 0 0 0px transparent)',
        }}
        transition={{ duration: 0.2 }}
      >
        <Select
          name={name}
          label={label}
          value={value as string}
          searchable={searchable}
          onChange={onChange as (value: string | null) => void}
          onBlur={onBlur}
          onSearchChange={onSearchChange}
          placeholder={placeholder}
          data={option}
          defaultValue={defaultValue as string}
          disabled={disabled}
          allowDeselect={true}
          error={error}
          clearable={true}
          clearButtonProps={<span>x</span>}
          styles={commonStyles}
          className={className}
        />
      </motion.div>
    </motion.div>
  );
};

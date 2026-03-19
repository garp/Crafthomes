import { TextInput } from '@mantine/core';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { InputTypes } from '../../types/base';
import { INPUT_DEFAULTS } from '../../constants';

export const Input = ({
  label,
  leftSection,
  rightSection,
  placeholder,
  border = INPUT_DEFAULTS.BORDER,
  height = INPUT_DEFAULTS.HEIGHT,
  width = INPUT_DEFAULTS.WIDTH,
  backgroundColor = INPUT_DEFAULTS.BACKGROUND_COLOR,
  radius,
  name,
  className,
  value,
  onChange,
  error,
  onBlur,
  disabled = false,
  onKeyUp,
  maxLength,
  animatedPlaceholders,
  rightSectionClassName,
  labelClassName,
  inputClassName,
  ...props
}: InputTypes) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholder);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!value && animatedPlaceholders && animatedPlaceholders.length > 0 && !isFocused) {
      const interval = setInterval(() => {
        setCurrentPlaceholder((prev) => {
          const currentIndex = animatedPlaceholders.indexOf(prev);
          const nextIndex = (currentIndex + 1) % animatedPlaceholders.length;
          return animatedPlaceholders[nextIndex];
        });
      }, INPUT_DEFAULTS.PLACEHOLDER_INTERVAL);

      return () => clearInterval(interval);
    } else {
      setCurrentPlaceholder(placeholder);
    }
  }, [value, animatedPlaceholders, placeholder, isFocused]);

  const handleSectionClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

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
          filter: isFocused
            ? 'drop-shadow(0 0 0 2px rgba(59, 130, 246, 0.1))'
            : isHovered
              ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
              : 'drop-shadow(0 0 0 0px transparent)',
        }}
        transition={{ duration: 0.2 }}
      >
        <TextInput
          classNames={{
            input: inputClassName,
            label: labelClassName,
          }}
          ref={inputRef}
          onKeyUp={onKeyUp}
          name={name}
          label={label}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={currentPlaceholder}
          radius={radius}
          className={`${className} animated-placeholder`}
          leftSection={
            leftSection ? (
              <motion.div
                onClick={handleSectionClick}
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {leftSection}
              </motion.div>
            ) : undefined
          }
          rightSection={
            rightSection ? (
              <motion.div
                onClick={handleSectionClick}
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={rightSectionClassName}
              >
                {rightSection}
              </motion.div>
            ) : undefined
          }
          error={error}
          disabled={disabled}
          maxLength={maxLength}
          type={props.type}
          styles={{
            label: {
              color: '#667085',
              fontWeight: '500',
              fontSize: '14px',
            },
            input: {
              border: isFocused ? '2px solid #d1d5db' : isHovered ? '1px solid #d1d5db' : border,
              height: height,
              width: width,
              backgroundColor: isFocused || isHovered ? '#ffffff' : backgroundColor,
              transition: 'all 0.2s ease-in-out',
            },
          }}
          {...props}
        />
      </motion.div>
    </motion.div>
  );
};

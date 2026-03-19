import { useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '../../utils/helper';

type TFormDurationPickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string | boolean;
};

export default function FormDurationPicker({
  value,
  onChange,
  placeholder = 'Select Duration',
  className,
  error,
}: TFormDurationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Generate duration options in 15-minute increments from 0:15 to 10:00
  const durationSlots = useMemo(() => {
    const slots: { value: string; label: string; minutes: number }[] = [];
    for (let i = 1; i <= 40; i++) {
      const minutes = i * 15;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const label = `${hours}:${mins.toString().padStart(2, '0')}`;
      slots.push({ value: minutes.toString(), label, minutes });
    }
    return slots;
  }, []);

  // Format value for display (convert minutes to H:MM format)
  const formatDisplayValue = () => {
    if (!value) return '';
    const minutes = parseInt(value, 10);
    if (isNaN(minutes)) return value;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Parse input value (H:MM or HH:MM format) to minutes
  const parseInputToMinutes = (input: string): number | null => {
    const trimmed = input.trim();
    // Match H:MM or HH:MM format
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;

    return hours * 60 + mins;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to selected duration when dropdown opens
  useEffect(() => {
    if (isOpen && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [isOpen]);

  // Sync input value when value prop changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatDisplayValue());
      setInputError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isFocused]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input field (type + dropdown) */}
      <div className='relative'>
        <input
          ref={inputRef}
          type='text'
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
            setInputError('');
            if (!inputValue) setInputValue(formatDisplayValue());
          }}
          onChange={(e) => {
            setInputValue(e.target.value);
            setInputError('');
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          onBlur={() => {
            setIsFocused(false);

            const trimmed = inputValue.trim();
            if (!trimmed) {
              setInputError('');
              onChange('');
              return;
            }

            const minutes = parseInputToMinutes(trimmed);
            if (minutes === null) {
              setInputError('Invalid format. Use H:MM (e.g., 1:30)');
              return;
            }
            if (minutes < 15) {
              setInputError('Minimum duration is 0:15');
              return;
            }
            if (minutes > 600) {
              setInputError('Maximum duration is 10:00');
              return;
            }
            if (minutes % 15 !== 0) {
              setInputError('Duration must be in 15-minute steps (e.g., 1:15)');
              return;
            }

            setInputError('');
            onChange(minutes.toString());
            setInputValue(formatDisplayValue());
          }}
          className={cn(
            'w-full px-3 py-2.5 pr-10 border rounded-md bg-white font-medium outline-none',
            error || inputError ? 'border-red-300' : 'border-gray-300',
            'hover:border-gray-400 focus:border-gray-400 transition-colors',
          )}
        />
        <button
          type='button'
          onMouseDown={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
            setIsOpen((prev) => !prev);
          }}
          className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400'
          aria-label='Toggle duration picker'
        >
          <IconChevronDown className={cn('size-5 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>
      {inputError && <p className='text-xs text-red-500 mt-1'>{inputError}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[240px] left-0'>
          {/* Grid of duration options */}
          <div className='grid grid-cols-4 gap-1 max-h-48 overflow-y-auto'>
            {durationSlots.map((slot) => (
              <button
                key={slot.value}
                ref={slot.value === value ? selectedRef : null}
                type='button'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(slot.value);
                  setIsOpen(false);
                  setInputError('');
                  setInputValue(slot.label);
                }}
                className={cn(
                  'px-1 py-1.5 text-[11px] font-medium rounded transition-colors text-center whitespace-nowrap',
                  slot.value === value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

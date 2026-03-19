import { useMemo, useRef, useState, useEffect } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '../../utils/helper';

type TFormTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string | boolean;
};

export default function FormTimePicker({
  value,
  onChange,
  placeholder = 'Select Time',
  className,
  error,
}: TFormTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Generate all time slots in 15-minute intervals
  const timeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hour24 = hour.toString().padStart(2, '0');
        const min = minute.toString().padStart(2, '0');
        const val = `${hour24}:${min}`;

        // Format for display (12-hour format)
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        const label = `${hour12}:${min} ${period}`;

        slots.push({ value: val, label });
      }
    }
    return slots;
  }, []);

  const time24ToLabel = (hhmm24: string) => {
    const [h, m] = hhmm24.split(':');
    const hour = Number(h);
    const minute = Number(m);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return hhmm24;
    const period = hour < 12 ? 'AM' : 'PM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const slot = timeSlots.find((s) => s.value === value);
    // If user typed a custom time not in 15-min grid, still show AM/PM label
    return slot?.label || time24ToLabel(value);
  };

  // Parse input value (H:MM AM/PM or HH:MM AM/PM format) to 24-hour HH:MM
  const parseInputToTime = (input: string): string | null => {
    const trimmed = input.trim().toUpperCase();
    // Match H:MM AM/PM or HH:MM AM/PM format
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3];

    if (hours < 1 || hours > 12 || mins < 0 || mins > 59) return null;

    // Convert to 24-hour format
    if (period === 'AM') {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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

  // Scroll to selected time when dropdown opens
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

            const time = parseInputToTime(trimmed);
            if (time === null) {
              setInputError('Invalid format. Use H:MM AM/PM (e.g., 9:30 AM)');
              return;
            }

            setInputError('');
            onChange(time);
            setInputValue(time24ToLabel(time));
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
          aria-label='Toggle time picker'
        >
          <IconChevronDown className={cn('size-5 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>
      {inputError && <p className='text-xs text-red-500 mt-1'>{inputError}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[275px] left-0'>
          {/* Grid of time options */}
          <div className='grid grid-cols-3 gap-1 max-h-48 overflow-y-auto'>
            {timeSlots.map((slot) => (
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
                  'px-1 py-1.5 text-[11px] font-medium cursor-pointer rounded transition-colors text-center whitespace-nowrap',
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

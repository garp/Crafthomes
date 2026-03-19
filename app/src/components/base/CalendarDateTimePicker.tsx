import { useState, useEffect } from 'react';
import { Calendar } from '@mantine/dates';
import {
  IconCalendar,
  IconClock,
  IconSun,
  IconArrowRight,
  IconCalendarWeek,
} from '@tabler/icons-react';
import {
  addDays,
  startOfDay,
  format,
  nextMonday,
  isSameDay,
  setHours,
  setMinutes,
  setSeconds,
  getHours,
  getMinutes,
} from 'date-fns';
import { cn } from '../../utils/helper';

export type CalendarDateTimePickerProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  /** Show time row with AM/PM (default true) */
  showTime?: boolean;
  /** Display as inline panel (default) or dropdown from input */
  mode?: 'inline' | 'dropdown';
};

const DEFAULT_TIME = '09:00'; // 9:00 AM

function time24ToDisplay(hhmm24: string): string {
  const [h, m] = hhmm24.split(':');
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return hhmm24;
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

function displayToTime24(input: string): string | null {
  const trimmed = input.trim().toUpperCase();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3];
  if (hours < 1 || hours > 12 || mins < 0 || mins > 59) return null;
  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const QUICK_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'next_week', label: 'Next week' },
] as const;

export default function CalendarDateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  label,
  className,
  error,
  minDate,
  maxDate,
  showTime = true,
  mode = 'inline',
}: CalendarDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(value ? new Date(value) : new Date());
  const [timeStr, setTimeStr] = useState<string>(() => {
    if (value) {
      const h = getHours(value);
      const m = getMinutes(value);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return DEFAULT_TIME;
  });
  const [timeDisplay, setTimeDisplay] = useState(() =>
    value
      ? time24ToDisplay(
          `${getHours(value).toString().padStart(2, '0')}:${getMinutes(value).toString().padStart(2, '0')}`,
        )
      : time24ToDisplay(DEFAULT_TIME),
  );

  const selectedDate = value ? startOfDay(value) : null;

  useEffect(() => {
    if (value) {
      const h = getHours(value);
      const m = getMinutes(value);
      setTimeStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      setTimeDisplay(
        time24ToDisplay(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`),
      );
    }
  }, [value]);

  const applyDateAndTime = (date: Date, timeHHMM: string) => {
    const [h, m] = timeHHMM.split(':').map(Number);
    const next = setSeconds(setMinutes(setHours(startOfDay(date), h), m), 0);
    onChange(next);
  };

  const handleQuickOption = (id: (typeof QUICK_OPTIONS)[number]['id']) => {
    const today = startOfDay(new Date());
    let date: Date;
    if (id === 'today') date = today;
    else if (id === 'tomorrow') date = addDays(today, 1);
    else date = nextMonday(today);
    setMonth(date);
    applyDateAndTime(date, timeStr);
  };

  const handleCalendarSelect = (dateStr: string | null) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    setMonth(d);
    applyDateAndTime(d, timeStr);
  };

  const handleTimeBlur = () => {
    const parsed = displayToTime24(timeDisplay);
    if (parsed) {
      setTimeStr(parsed);
      setTimeDisplay(time24ToDisplay(parsed));
      if (selectedDate) applyDateAndTime(selectedDate, parsed);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeDisplay(e.target.value);
  };

  const displayValue = value
    ? `${format(value, 'dd MMM yyyy')}${showTime ? `, ${time24ToDisplay(`${getHours(value).toString().padStart(2, '0')}:${getMinutes(value).toString().padStart(2, '0')}`)}` : ''}`
    : '';

  const panel = (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden',
        mode === 'dropdown' && 'min-w-[320px]',
      )}
    >
      {/* 1. Calendar first */}
      <div className='p-3'>
        <Calendar
          date={month}
          onDateChange={(dateStr) => (dateStr ? setMonth(new Date(dateStr)) : undefined)}
          onPreviousMonth={(dateStr) => dateStr && setMonth(new Date(dateStr))}
          onNextMonth={(dateStr) => dateStr && setMonth(new Date(dateStr))}
          minDate={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
          maxDate={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
          getDayProps={(dateStr) => {
            const d = new Date(dateStr);
            const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
            return {
              selected: isSelected,
              onClick: () => handleCalendarSelect(dateStr),
            };
          }}
          size='sm'
          classNames={{
            month: 'w-full',
            monthCell: 'w-full',
            weekday: 'text-gray-500 text-xs font-medium',
            day: 'text-sm',
          }}
        />
      </div>

      {/* 2. Time with AM/PM */}
      {showTime && (
        <div className='p-3 border-t border-gray-100 flex items-center gap-2'>
          <IconClock className='size-4 text-gray-400' />
          <input
            type='text'
            value={timeDisplay}
            onChange={handleTimeChange}
            onBlur={handleTimeBlur}
            placeholder='e.g. 9:00 AM'
            className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400'
          />
        </div>
      )}

      {/* 3. Quick options: Today, Tomorrow, Next week */}
      <div className='p-3 border-t border-gray-100 space-y-1'>
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => handleQuickOption(opt.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors',
              selectedDate &&
                ((opt.id === 'today' && isSameDay(selectedDate, startOfDay(new Date()))) ||
                  (opt.id === 'tomorrow' &&
                    isSameDay(selectedDate, addDays(startOfDay(new Date()), 1))) ||
                  (opt.id === 'next_week' &&
                    isSameDay(selectedDate, nextMonday(startOfDay(new Date())))))
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100',
            )}
          >
            {opt.id === 'today' && <IconCalendar className='size-4 text-green-600' />}
            {opt.id === 'tomorrow' && <IconSun className='size-4 text-amber-500' />}
            {opt.id === 'next_week' && <IconArrowRight className='size-4 text-indigo-500' />}
            <span>{opt.label}</span>
            {opt.id === 'today' && (
              <span className='ml-auto text-gray-500'>{format(new Date(), 'EEE')}</span>
            )}
            {opt.id === 'tomorrow' && (
              <span className='ml-auto text-gray-500'>{format(addDays(new Date(), 1), 'EEE')}</span>
            )}
            {opt.id === 'next_week' && (
              <span className='ml-auto text-gray-500'>
                {format(nextMonday(new Date()), 'EEE d MMM')}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (mode === 'dropdown') {
    return (
      <div className={cn('relative', className)}>
        {label && <label className='block text-sm font-medium text-gray-700 mb-1'>{label}</label>}
        <button
          type='button'
          onClick={() => setIsOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-left text-sm font-medium bg-white',
            error ? 'border-red-300' : 'border-gray-300 hover:border-gray-400',
          )}
        >
          <IconCalendarWeek className='size-4 text-gray-400' />
          <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
            {displayValue || placeholder}
          </span>
        </button>
        {error && <p className='text-xs text-red-500 mt-1'>{error}</p>}
        {isOpen && (
          <>
            <div className='fixed inset-0 z-40' aria-hidden onClick={() => setIsOpen(false)} />
            <div className='absolute top-full left-0 mt-1 z-50'>{panel}</div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      {label && <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>}
      {panel}
      {error && <p className='text-xs text-red-500 mt-1'>{error}</p>}
    </div>
  );
}

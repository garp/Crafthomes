import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';
import { AddEventSidebar } from '../../../components/calendar/AddEventSidebar';
import { Calendar, dateFnsLocalizer, type NavigateAction } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import { Button } from '../../../components';
import { IconChevronLeft } from '@tabler/icons-react';
import { addMonths, isBefore, startOfMonth, subMonths } from 'date-fns';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const events = [
  { title: '01', start: new Date(2025, 4, 1), end: new Date(2025, 4, 1) },
  { title: '03', start: new Date(2025, 4, 2), end: new Date(2025, 4, 2) },
  { title: '02', start: new Date(2025, 4, 4), end: new Date(2025, 4, 4) },
  { title: '03', start: new Date(2025, 4, 4), end: new Date(2025, 4, 4) },
  { title: '01', start: new Date(2025, 4, 5), end: new Date(2025, 4, 5) },
  { title: '02', start: new Date(2025, 4, 5), end: new Date(2025, 4, 5) },
  { title: '03', start: new Date(2025, 4, 5), end: new Date(2025, 4, 5) },
];
const CustomToolbar = (
  openSidebar: () => void,
  onNavigate: (navigate: NavigateAction, date?: Date) => void,
  label: string,
) => (
  <div className='flex justify-between items-center mb-5'>
    <div className='flex items-center gap-3'>
      <p className='font-bold  w-32'>{label}</p>
      <button onClick={() => onNavigate('PREV')} className='cursor-pointer bg-white'>
        <IconChevronLeft className='size-5 text-text-secondary' />
      </button>
      <button onClick={() => onNavigate('NEXT')} className='cursor-pointer bg-white'>
        <IconChevronLeft className='size-5 text-text-secondary rotate-180' />
      </button>
    </div>
    <Button onClick={openSidebar} radius='full' className='!h-9 !text-sm !font-medium'>
      Create Event
    </Button>
  </div>
);
export default function CalendarSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = startOfMonth(new Date());
  return (
    <>
      <div className='min-h-full flex flex-col gap-4 px-5 py-5 rounded-lg flex-1/2 bg-white '>
        <p className='font-bold'>Calendar</p>
        <div className='border  border-gray-200 p-5 rounded-md'>
          <Calendar
            date={currentDate}
            localizer={localizer}
            events={events}
            defaultDate={new Date(2025, 4, 1)}
            views={['month']}
            defaultView='month'
            style={{ height: '80vh' }}
            onNavigate={(newDate, view, action) => {
              console.log(view);
              const newMonth = startOfMonth(newDate);
              // block navigation if before current month
              if (isBefore(newMonth, today)) return;
              if (action === 'PREV') setCurrentDate(subMonths(currentDate, 1));
              else if (action === 'NEXT') setCurrentDate(addMonths(currentDate, 1));
              else setCurrentDate(newDate);
            }}
            components={{
              event: ({ event }) => (
                <span className='inline-block px-2 py-0.5 rounded-md bg-gray-200 text-xs font-medium text-black mr-1'>
                  {event.title}
                </span>
              ),
              toolbar: ({ onNavigate, label }) =>
                CustomToolbar(() => setIsOpen(true), onNavigate, label),
            }}
          />
        </div>
      </div>
      <AddEventSidebar onSubmit={() => {}} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

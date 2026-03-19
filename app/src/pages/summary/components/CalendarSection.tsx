import { useState } from 'react';
import { motion } from 'framer-motion';

import { Calendar, dateFnsLocalizer, type NavigateAction } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import { IconChevronLeft } from '@tabler/icons-react';
import { addMonths, isBefore, startOfMonth, subMonths } from 'date-fns';

import { SAMPLE_UPCOMING_EVENTS } from '../../../constants';
import { events } from '../constants/constants';
import IconButton from '../../../components/base/button/IconButton';
import { itemVariants } from '../../../constants/common';

export default function CalendarSection() {
  const upcomingEvents = [...SAMPLE_UPCOMING_EVENTS];
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

  const CustomToolbar = (
    onNavigate: (navigate: NavigateAction, date?: Date) => void,
    label: string,
  ) => (
    <div className='flex items-center mb-5 justify-between'>
      <p className='font-bold  w-32'>{label}</p>
      <div className='space-x-3'>
        <IconButton
          onClick={() => onNavigate('PREV')}
          className='cursor-pointer p-2 rounded-full hover:bg-gray-200 '
        >
          <IconChevronLeft className='size-5 text-text-secondary' />
        </IconButton>
        <IconButton
          onClick={() => onNavigate('NEXT')}
          className='p-2 rounded-full hover:bg-gray-200 cursor-pointer '
        >
          <IconChevronLeft className='size-5 text-text-secondary rotate-180' />
        </IconButton>
      </div>
    </div>
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = startOfMonth(new Date());
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* CALENDAR SECTION */}
      <motion.div className='min-h-full flex flex-col gap-4 px-5 py-5 rounded-lg flex-1/2 bg-white '>
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
            toolbar: ({ onNavigate, label }) => CustomToolbar(onNavigate, label),
          }}
        />
      </motion.div>

      {/* UPCOMING SECTION */}
      <motion.div
        className='bg-white rounded-xl shadow-sm border border-gray-100'
        variants={itemVariants}
      >
        <div className='p-4 border-b border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900'>Upcoming</h3>
        </div>
        <div className='p-4'>
          <div className='mb-4'>
            <h4 className='text-sm font-semibold text-gray-900 mb-2'>Today</h4>
            {upcomingEvents.map((event, index) => (
              <div key={index} className='py-2 border-b border-gray-100 last:border-b-0'>
                <p className='text-sm font-medium text-gray-900'>{event.title}</p>
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                  <span>{event.time}</span>
                  <span>{event.date}</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4 className='text-sm font-semibold text-gray-900 mb-2'>Tomorrow</h4>
            {upcomingEvents.slice(0, 3).map((event, index) => (
              <div key={index} className='py-2 border-b border-gray-100 last:border-b-0'>
                <p className='text-sm font-medium text-gray-900'>{event.title}</p>
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                  <span>{event.time}</span>
                  <span>{event.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

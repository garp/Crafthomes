import type { TEventCardProps } from '../types/types';

export default function Upcoming() {
  return (
    <>
      <div className='shrink-0 min-h-full flex-1/4 flex flex-col gap-4 px-5 py-5 bg-white rounded-lg'>
        <p className='font-bold'>Upcoming</p>
        <hr className='border-gray-200' />
        <p>Today</p>
        <EventCard createdAt='Nov 01,2022' eventTime='10:00 am - 11:00 am' title='Heading1' />
        <EventCard createdAt='Nov 01,2022' eventTime='10:00 am - 11:00 am' title='Heading2' />
        <EventCard createdAt='Nov 01,2022' eventTime='10:00 am - 11:00 am' title='Heading3' />
      </div>
    </>
  );
}

function EventCard({ createdAt, eventTime, title }: TEventCardProps) {
  return (
    <div className='bg-slate-100 flex flex-col gap-1 p-5 rounded-sm'>
      <p className='text-lg font-semibold'>{title}</p>
      <div className='flex justify-between'>
        <p className='text-text-subHeading '>{eventTime}</p>
        <p className='text-text-subHeading'>{createdAt}</p>
      </div>
    </div>
  );
}

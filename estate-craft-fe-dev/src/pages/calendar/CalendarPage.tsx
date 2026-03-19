import Calendar from './components/CalendarSection';
import Peoples from './components/Peoples';
import Upcoming from './components/Upcoming';

export default function CalendarPage() {
  return (
    <div className='flex min-h-full gap-x-5'>
      <Calendar />
      <Upcoming />
      <Peoples />
    </div>
  );
}

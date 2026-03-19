import { Outlet } from 'react-router-dom';
import TemplateSubTabs from './TemplateSubTabs';

export default function TemplatePage() {
  return (
    <div className='flex flex-col h-full'>
      <TemplateSubTabs />
      <Outlet />
    </div>
  );
}

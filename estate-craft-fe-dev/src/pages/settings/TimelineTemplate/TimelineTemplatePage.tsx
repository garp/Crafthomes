import TimelineTemplateHeader from './TimelineTemplateHeader';
import TimelineTemplatesTable from './TimelineTemplatesTable';

export default function TimelineTemplatePage() {
  return (
    <div className='flex flex-col gap-5 mt-5 h-full'>
      <TimelineTemplateHeader />
      <TimelineTemplatesTable />
    </div>
  );
}

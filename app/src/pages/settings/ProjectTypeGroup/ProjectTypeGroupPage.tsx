import ProjectTypeGroupHeader from './ProjectTypeGroupHeader';
import ProjectTypeGroupTable from './ProjectTypeGroupTable';

export default function ProjectTypeGroupPage() {
  return (
    <div className='flex flex-col gap-5 mt-5 h-full'>
      <ProjectTypeGroupHeader />
      <ProjectTypeGroupTable />
    </div>
  );
}

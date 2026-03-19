import { IconHome2 } from '@tabler/icons-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useGetProjectsQuery } from '../../store/services/project/projectSlice';
import { cn, parseEndPoint } from '../../utils/helper';
import { useGetProjectQuotationsQuery } from '../../store/services/projectQuotation/projectQuotationSlice';
import { useGetProjectTimelineQuery } from '../../store/services/projectTimeline/projectTimelineSlice';

export default function Breadcrumb({ className }: { className?: string }) {
  const params = useParams();
  const location = useLocation();

  const { data: projectData } = useGetProjectsQuery({ id: params?.id });
  const { data: quotationData } = useGetProjectQuotationsQuery(
    { id: params?.quotationId },
    { skip: !params.quotationId },
  );
  const { data: timelineData } = useGetProjectTimelineQuery(
    { id: params?.timelineId },
    { skip: !params.timelineId },
  );
  const idToNameMap = new Map([
    [(params.quotationId as string) || '', quotationData?.quotations?.at(0)?.client?.name],
    [(params.id as string) || '', projectData?.projects?.at(0)?.name],
    [(params.timelineId as string) || '', timelineData?.timelines?.at(0)?.name],
  ]);

  const pathParts = location.pathname.split('/').filter(Boolean);

  // Replace project ID with project name (if matched)
  const breadCrumbData = pathParts.map((part) => {
    if (idToNameMap.has(part)) return idToNameMap.get(part);
    return part;
  });

  function getLink(index: number) {
    const parts = pathParts.slice(0, index + 1);
    //if breadcrumb is projectName, then redirect to /summary
    if (parts.at(-1) === params.id) return '/' + parts.join('/') + '/summary';

    if (parts.at(-1) === 'settings') return '/settings/user';
    // else if(parts.includes("view") || parts.includes("edit")) return '/'
    return '/' + parts.filter((part) => part !== 'view' && part !== 'edit').join('/');
  }

  return (
    <div className={cn('flex items-center gap-2 text-text-subHeading ', className)}>
      <div className='flex gap-2 items-center'>
        <IconHome2 className='text-[#8592A6] size-5' />
        <Link className='text-sm font-medium' to='/projects'>
          Home
        </Link>
      </div>
      {breadCrumbData?.map((breadcrumb, i) => (
        <div key={`${pathParts[i]}-${i}`} className='whitespace-nowrap flex items-center gap-2'>
          <p className='font-bold'>{'>'}</p>
          <Link
            className={`text-sm font-medium ${
              i === breadCrumbData.length - 1 ? 'text-muted-foreground pointer-events-none' : ''
            }`}
            to={i === breadCrumbData.length - 1 ? '#' : getLink(i)}
          >
            {parseEndPoint(breadcrumb)}
          </Link>
        </div>
      ))}
    </div>
  );
}

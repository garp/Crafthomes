import { Outlet, useParams } from 'react-router-dom';

// import Breadcrumb from '../../../components/common/Breadcrumb';
import RiskSection from './components/RiskSection';
import SummaryDetails from './components/SummaryDetails';
import SummaryStats from './components/SummaryStats';
import TimelineSection from './components/TimelineSection';
import { useGetProjectSummaryQuery } from '../../../store/services/projectSummary/projectSummarySlice';
import { Loader } from '../../../components';

// const breadcrumbData = [
//   {
//     link: '/',
//     title: 'Home',
//   },
//   {
//     link: '/projects',
//     title: 'Project Name',
//   },
//   {
//     link: '/projects/summary',
//     title: 'Summary',
//   },
// ];

export default function ProjectsSummary() {
  const { id } = useParams();
  const { data: projectSummary, isLoading } = useGetProjectSummaryQuery({
    projectId: id || '',
  });

  if (isLoading) {
    return (
      <div className='flex flex-col w-full pb-10'>
        <h6 className='font-bold mb-4'>SUMMARY</h6>
        <Loader variant='component' minHeight={400} text='Loading project summary...' />
      </div>
    );
  }

  if (!projectSummary) {
    return (
      <div className='flex flex-col w-full pb-10'>
        <h6 className='font-bold '>SUMMARY</h6>
        <p className='text-gray-500 mt-4'>No project summary data available</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full pb-10'>
      {/* <Breadcrumb /> */}
      <h6 className='font-bold '>SUMMARY</h6>
      <SummaryStats projectSummary={projectSummary} />
      <SummaryDetails projectSummary={projectSummary} />
      <TimelineSection projectSummary={projectSummary} />
      <RiskSection />
      <Outlet />
    </div>
  );
}

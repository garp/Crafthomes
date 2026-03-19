import { IconCalendarEvent, IconBuildingCommunity, IconCode } from '@tabler/icons-react';

export default function RiskSection() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8'>
      <SiteVisitPlaceholder />
      <DepartmentHighlightsPlaceholder />
    </div>
  );
}

function SiteVisitPlaceholder() {
  return (
    <div className='flex-1 px-5 py-5 bg-white rounded-md'>
      <h6 className='font-lg font-bold flex items-center gap-2'>
        <IconCalendarEvent className='size-5 text-blue-500' />
        Site Visit
      </h6>
      <div className='flex flex-col items-center justify-center h-48 text-gray-400'>
        <IconCode className='size-12 mb-3' />
        <p className='text-sm font-medium'>Under Development</p>
        <p className='text-xs mt-1'>This feature is coming soon</p>
      </div>
    </div>
  );
}

function DepartmentHighlightsPlaceholder() {
  return (
    <div className='flex-1 px-5 py-5 bg-white rounded-md'>
      <h6 className='font-lg font-bold flex items-center gap-2'>
        <IconBuildingCommunity className='size-5 text-purple-500' />
        Departmental Highlights
      </h6>
      <div className='flex flex-col items-center justify-center h-48 text-gray-400'>
        <IconCode className='size-12 mb-3' />
        <p className='text-sm font-medium'>Under Development</p>
        <p className='text-xs mt-1'>This feature is coming soon</p>
      </div>
    </div>
  );
}

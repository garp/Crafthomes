import { useParams } from 'react-router-dom';
import Container from '../../../../components/common/Container';
import { Button } from '../../../../components';
import ColoredBadge from '../../../../components/common/ColoredBadge';
import { useGetProjectSnagsQuery } from '../../../../store/services/snag/snagSlice';
import { useMemo } from 'react';
import BoxJumpLoader from '../../../../components/common/loaders/BoxJumpLoader';
import { useDisclosure } from '@mantine/hooks';
import CreateSnagSidebar from './CreateSnagSidebar';

export default function CreateSnagScreeen() {
  const { id } = useParams();
  const { data: snagData, isFetching: isFetchingSnags } = useGetProjectSnagsQuery({
    projectId: id,
  });
  const [isOpenCreateSidebar, { open: openCreateSidebar, close: closeCreateSidebar }] =
    useDisclosure(false);

  // Calculate counts based on status
  const snagCounts = useMemo(() => {
    const snags = snagData?.snags || [];
    return {
      all: snags.length,
      temporary: snags.filter((snag) => snag.snagStatus === 'TEMPORARY').length,
      pending: snags.filter((snag) => snag.snagStatus === 'PENDING').length,
      open: snags.filter((snag) => snag.snagStatus === 'OPEN').length,
      inProgress: snags.filter((snag) => snag.snagStatus === 'IN_PROGRESS').length,
      resolved: snags.filter((snag) => snag.snagStatus === 'RESOLVED').length,
      rejected: snags.filter((snag) => snag.snagStatus === 'REJECTED').length,
      closed: snags.filter((snag) => snag.snagStatus === 'CLOSED').length,
    };
  }, [snagData]);

  if (isFetchingSnags) {
    return (
      <Container className='h-full'>
        <h6 className='font-bold text-sm'>SNAG</h6>
        <div className='mt-3 py-3 flex flex-wrap gap-2 border-y border-gray-200'>
          <ColoredBadge className='bg-blue-100 text-blue-500 ' label='All(0)' />
          <ColoredBadge className='bg-gray-100 text-gray-600 ' label='Temporary (0)' />
          <ColoredBadge className='bg-yellow-100 text-yellow-600 ' label='Pending (0)' />
          <ColoredBadge className='bg-orange-100 text-orange-600 ' label='Open (0)' />
          <ColoredBadge className='bg-blue-100 text-blue-600 ' label='In Progress (0)' />
          <ColoredBadge className='bg-green-100 text-green-600 ' label='Resolved (0)' />
          <ColoredBadge className='bg-red-100 text-red-600 ' label='Rejected (0)' />
          <ColoredBadge className='bg-gray-100 text-gray-500 ' label='Closed (0)' />
        </div>
        <div className='flex items-center justify-center h-96'>
          <BoxJumpLoader />
        </div>
      </Container>
    );
  }

  return (
    <Container className='h-full'>
      <h6 className='font-bold text-sm'>SNAG</h6>
      <div className='mt-3 py-3 flex flex-wrap gap-2 border-y border-gray-200'>
        <ColoredBadge className='bg-blue-100 text-blue-500 ' label={`All(${snagCounts.all})`} />
        <ColoredBadge
          className='bg-gray-100 text-gray-600 '
          label={`Temporary (${snagCounts.temporary})`}
        />
        <ColoredBadge
          className='bg-yellow-100 text-yellow-600 '
          label={`Pending (${snagCounts.pending})`}
        />
        <ColoredBadge
          className='bg-orange-100 text-orange-600 '
          label={`Open (${snagCounts.open})`}
        />
        <ColoredBadge
          className='bg-blue-100 text-blue-600 '
          label={`In Progress (${snagCounts.inProgress})`}
        />
        <ColoredBadge
          className='bg-green-100 text-green-600 '
          label={`Resolved (${snagCounts.resolved})`}
        />
        <ColoredBadge
          className='bg-red-100 text-red-600 '
          label={`Rejected (${snagCounts.rejected})`}
        />
        <ColoredBadge
          className='bg-gray-100 text-gray-500 '
          label={`Closed (${snagCounts.closed})`}
        />
      </div>

      <div className='h-full w-full flex flex-col  items-center justify-center'>
        <p className=' font-bold text-lg'>Create Snag</p>
        <p className='mt-2 text-text-subHeading max-w-92 text-center font-medium'>
          Simply upload the image and create for correction.
        </p>
        <Button radius='full' className='mt-4' onClick={openCreateSidebar}>
          Add Snag
        </Button>
      </div>

      {/* CREATE SNAG SIDEBAR */}
      <CreateSnagSidebar
        isOpen={isOpenCreateSidebar}
        onClose={closeCreateSidebar}
        mode='create'
        projectId={id || ''}
      />
    </Container>
  );
}

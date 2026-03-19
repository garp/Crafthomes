import { IconPencil, IconShare, IconFile } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useDisclosure } from '@mantine/hooks';
import { Button, CalendarIcon, Image } from '../../../../components';
import Container from '../../../../components/common/Container';
import CreateScreeen from '../../../../components/common/CreateScreen';
import type { TMOMListPageProps } from '../types/types';
import type { TMOM } from '../../../../store/types/mom.types';
import IconButton from '../../../../components/base/button/IconButton';
import TeamMemberAvatar from '../../../../components/common/TeamMembersAvatar';
import TableSearchBar from '../../../../components/common/TableSearchBar';
import { useState } from 'react';
import { useGetMOMsQuery } from '../../../../store/services/mom/mom';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import { HELD_ON_OPTIONS, HeldOn } from '../../../../constants/mom';
import { createPageData } from '../constants/constants';
import googleMeetLogo from '../../../../assets/img/googleMeetLogo.png';
import zoomLogo from '../../../../assets/img/zoomLogo.png';
import slackLogo from '../../../../assets/img/slackLogo.png';
import teamsLogo from '../../../../assets/img/teamsLogo.png';
import inPersonLogo from '../../../../assets/img/inPersonLogo.webp';
import UploadedImagePreview from '../../../../components/common/UploadedImagePreview';
import type { TAttachment } from '../../../../store/types/common.types';
import ShareMOMModal from './ShareMOMModal';

// Helper to get user initials
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper to get color for avatar
const getAvatarColor = (index: number): string => {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-amber-600', 'bg-purple-500'];
  return colors[index % colors.length];
};

// Convert MOM attendees to TeamMember format
const convertAttendeesToTeamMembers = (attendees: TMOM['momAttendees']) => {
  return attendees.map((attendee, index) => ({
    id: attendee.user.id,
    name: attendee.user.name,
    initial: getInitials(attendee.user.name),
    color: getAvatarColor(index),
  }));
};
// Get platform logo based on heldOn value
const getPlatformLogo = (heldOn: string) => {
  switch (heldOn) {
    case HeldOn.GMEET:
      return googleMeetLogo;
    case HeldOn.ZOOM:
      return zoomLogo;
    case HeldOn.SLACK:
      return slackLogo;
    case HeldOn.TEAMS:
      return teamsLogo;
    case HeldOn.IN_PERSON:
      return inPersonLogo;
    default:
      return null;
  }
};

export default function MOMListPage({ openSidebar, projectId }: TMOMListPageProps) {
  const { getParam } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');
  const searchQuery = getParam('query') || '';
  const [activeAttachment, setActiveAttachment] = useState<TAttachment | null>(null);
  const [isOpenImagePreview, { open: openImagePreview, close: closeImagePreview }] =
    useDisclosure();

  const { data: momsData, isFetching } = useGetMOMsQuery({
    projectId: projectId || undefined,
    search: searchQuery || undefined,
  });

  const handleEdit = (mom: TMOM) => {
    openSidebar(mom);
  };

  const handleImageClick = (attachment: TAttachment) => {
    setActiveAttachment(attachment);
    openImagePreview();
  };

  // Show CreateScreen if no MOMs exist and not searching
  if (!isFetching && (!momsData?.moms || momsData.moms.length === 0) && !searchQuery) {
    return <CreateScreeen createPageData={createPageData} onClick={() => openSidebar()} />;
  }

  return (
    <Container className='border-black min-h-[calc(100vh-11rem)]'>
      <h6 className='font-bold'>MOM</h6>
      {/* FILTERS*/}
      <section className='flex flex-wrap gap-3 justify-between mt-3'>
        <div className='flex flex-wrap gap-2'>
          <TableSearchBar className='border rounded-md' query={query} setQuery={setQuery} />
        </div>
        <Button onClick={() => openSidebar()} radius='full' className='px-4 cursor-pointer'>
          Create MOM
        </Button>
      </section>
      {/* MOM LIST */}
      {isFetching ? (
        <div className='flex justify-center items-center min-h-[200px]'>
          <p className='text-text-subHeading'>Loading...</p>
        </div>
      ) : momsData?.moms && momsData.moms.length > 0 ? (
        <section className='mt-5 grid 2xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-x-5 gap-y-10'>
          {momsData.moms.map((mom) => (
            <MOMCard key={mom.id} mom={mom} onEdit={handleEdit} onImageClick={handleImageClick} />
          ))}
        </section>
      ) : (
        <div className='flex justify-center items-center min-h-[200px]'>
          <p className='text-text-subHeading'>No MOMs found</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {activeAttachment && (
        <UploadedImagePreview
          onClose={closeImagePreview}
          opened={isOpenImagePreview}
          attachment={activeAttachment}
        />
      )}
    </Container>
  );
}

function MOMCard({
  mom,
  onEdit,
  onImageClick,
}: {
  mom: TMOM;
  onEdit: (mom: TMOM) => void;
  onImageClick: (attachment: TAttachment) => void;
}) {
  const [isShareModalOpen, { open: openShareModal, close: closeShareModal }] = useDisclosure(false);
  const startDate = mom.startDate ? new Date(mom.startDate) : null;
  const formattedDateShort = startDate ? format(startDate, 'hh:mm a dd MMM, yyyy') : '—';

  // Get held on label
  const heldOnLabel = HELD_ON_OPTIONS.find((opt) => opt.value === mom.heldOn)?.label || mom.heldOn;

  // Convert attendees to team members format
  const teamMembers = convertAttendeesToTeamMembers(mom.momAttendees);

  // Get file icon based on MIME type
  const getFileIcon = (attachment: TMOM['attachments'][0]) => {
    const mimeType = attachment.mimeType?.toLowerCase() || '';
    const fileType = attachment.type?.toLowerCase() || '';

    // Check if it's an image (using mimeType first, then type as fallback)
    const isImage =
      mimeType.startsWith('image/') ||
      (fileType && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType));

    if (isImage) {
      return (
        <Image
          src={attachment.url}
          alt={attachment.name}
          width={24}
          height={24}
          className='rounded cursor-pointer hover:opacity-80 transition-opacity'
          onClick={() =>
            onImageClick({
              url: attachment.url,
              name: attachment.name,
              key: attachment.key || '',
              type: attachment.type || '',
            } as TAttachment)
          }
        />
      );
    }

    // For all other file types (PDF, Word, Excel, Video, etc.), show file icon
    return <IconFile className='size-6 text-text-subHeading' />;
  };

  return (
    <div className='w-full shadow-lg rounded-lg px-4 py-5 border min-w-60 h-full flex flex-col'>
      <div className='flex justify-between items-center'>
        <h6 className='text-xs uppercase font-medium text-text-subHeading line-clamp-1'>
          {mom.title}
        </h6>
        <div className='flex gap-2'>
          <IconButton className='cursor-pointer' onClick={openShareModal}>
            <IconShare className='size-6 text-text-subHeading' />
          </IconButton>
          <IconButton className='cursor-pointer' onClick={() => onEdit(mom)}>
            <IconPencil className='size-6 text-text-subHeading' />
          </IconButton>
        </div>
      </div>

      <div className='mt-4 p-0 flex flex-col flex-1 space-y-4'>
        {/* Owner & Attendees */}
        <div className='flex justify-between items-center'>
          <div className='flex flex-col items-center gap-2'>
            <span className='text-sm text-gray-700 font-medium'>Owner</span>
            <div className='w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold'>
              {mom.createdByUser?.name ? getInitials(mom.createdByUser.name) : '—'}
            </div>
          </div>

          <div className=''>
            <p className='text-end text-text-subHeading text-sm'>Attendees</p>
            {teamMembers.length > 0 ? (
              <TeamMemberAvatar members={teamMembers} />
            ) : (
              <p className='text-xs text-text-subHeading mt-1'>No attendees</p>
            )}
          </div>
        </div>

        {mom.attachments && mom.attachments.length > 0 ? (
          <div className='border-t pt-3 h-[84px] flex flex-col justify-start'>
            <p className='text-sm font-medium mb-2'>Attachments</p>
            <div className='flex gap-3 flex-wrap items-start'>
              {mom.attachments.slice(0, 3).map((attachment, index) => (
                <div key={attachment.id || index} className='cursor-pointer'>
                  {getFileIcon(attachment)}
                </div>
              ))}
              {mom.attachments.length > 3 && (
                <div className='w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-semibold'>
                  +{mom.attachments.length - 3}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Meeting Purpose - flex-grow to push Date & Time to bottom */}
        <div className='border-t pt-3 flex-1 flex flex-col'>
          <p className='text-sm font-medium mb-1'>Meeting Purpose</p>
          <div
            dangerouslySetInnerHTML={{ __html: mom.purpose }}
            className='text-sm text-text-subHeading font-medium line-clamp-2 flex-1'
          />
        </div>

        {/* Date & Time - Always at bottom */}
        <div className='flex justify-between items-center border-t pt-3 mt-auto'>
          <div className='flex items-center gap-2 text-sm text-text-subHeading'>
            {getPlatformLogo(mom.heldOn) && (
              <Image src={getPlatformLogo(mom.heldOn)!} alt={heldOnLabel} width={18} height={18} />
            )}
            <p className='text-sm font-medium'>{heldOnLabel}</p>
          </div>
          <div className='flex gap-2 items-center'>
            <CalendarIcon className='fill-text-subHeading' />
            <p className='text-text-subHeading text-sm font-medium'>{formattedDateShort}</p>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareMOMModal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        momId={mom.id}
        momTitle={mom.title}
      />
    </div>
  );
}

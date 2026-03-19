import SidebarModal from '../../../../components/base/SidebarModal';
import type { TSnag } from '../../../../store/types/snag.types';
import { Image } from '../../../../components/base/Image';
import { format } from 'date-fns';
import StatusBadge from '../../../../components/common/StatusBadge';
import { IconMapPin, IconCategory, IconCalendar, IconBuildingStore } from '@tabler/icons-react';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import UploadedImagePreview from '../../../../components/common/UploadedImagePreview';
import { sanitizeHTML } from '../../../../utils/helper';
import { useGetVendorsQuery } from '../../../../store/services/vendor/vendorSlice';

type TViewSnagSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  snag: TSnag | null;
};

export default function ViewSnagSidebar({ isOpen, onClose, snag }: TViewSnagSidebarProps) {
  const [activeAttachment, setActiveAttachment] = useState<{
    url: string;
    name: string;
    key: string;
    type: string;
  } | null>(null);
  const [isOpenImagePreview, { open: openImagePreview, close: closeImagePreview }] =
    useDisclosure();

  // Fetch vendor data if vendorId exists
  const { data: vendorData } = useGetVendorsQuery(
    { pageLimit: '1', id: snag?.vendorId || '' },
    { skip: !snag?.vendorId },
  );
  const vendor = vendorData?.vendor?.[0];

  if (!snag) return null;

  function handleImageClick(attachment: any) {
    setActiveAttachment(attachment);
    openImagePreview();
  }

  return (
    <>
      <SidebarModal heading='Snag Details' opened={isOpen} onClose={onClose} size='700px'>
        <div className='h-full bg-white overflow-y-auto'>
          {/* Header Info */}
          <div className='p-6 border-b'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <h3 className='text-2xl font-bold text-gray-900 mb-2'>{snag.title}</h3>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-500'>Status:</span>
                  <StatusBadge status={snag.snagStatus || 'PENDING'} />
                </div>
              </div>
            </div>

            {/* Snag Code Badge */}
            <div className='inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm'>
              <span className='text-gray-600'>Snag Code - </span>
              <span className='font-semibold text-gray-900 ml-1'>{snag.id.slice(0, 8)}</span>
            </div>
          </div>

          {/* Main Image */}
          {snag.attachments && snag.attachments.length > 0 && (
            <div className='p-6 border-b'>
              <h4 className='text-sm font-semibold text-gray-700 mb-3'>Snag Images</h4>
              <div className='grid grid-cols-2 gap-4'>
                {snag.attachments.map((attachment) => (
                  <div
                    key={attachment.key}
                    className='relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors'
                    onClick={() => handleImageClick(attachment)}
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.name}
                      className='w-full h-48 object-cover'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snag Info Section */}
          <div className='p-6 space-y-6'>
            {/* Title & Description */}
            <div>
              <h4 className='text-lg font-semibold text-gray-900 mb-2'>{snag.title}</h4>
              <div className='flex items-start gap-2 text-gray-600'>
                <IconMapPin className='size-5 mt-0.5 shrink-0' />
                <span>{snag.location}</span>
              </div>
            </div>

            {/* Category Info */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500 mb-1'>Snag Category</p>
                <div className='flex items-center gap-2'>
                  <IconCategory className='size-4 text-gray-400' />
                  <p className='font-medium text-gray-900'>{snag.snagCategory}</p>
                </div>
              </div>
              <div>
                <p className='text-sm text-gray-500 mb-1'>Sub Category</p>
                <p className='font-medium text-gray-900'>{snag.snagSubCategory}</p>
              </div>
            </div>

            {/* Vendor Info */}
            {vendor && (
              <div>
                <p className='text-sm text-gray-500 mb-1'>Vendor</p>
                <div className='flex items-center gap-2'>
                  <IconBuildingStore className='size-4 text-gray-400' />
                  <p className='font-medium text-gray-900'>{vendor.name}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className='text-sm text-gray-500 mb-2'>Description</p>
              <div
                className='text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg'
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(snag.description) }}
              />
            </div>

            {/* Dates */}
            {snag.createdAt && (
              <div>
                <p className='text-sm text-gray-500 mb-1'>Created Date</p>
                <div className='flex items-center gap-2 text-gray-700'>
                  <IconCalendar className='size-4 text-gray-400' />
                  <span>{format(new Date(snag.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
              </div>
            )}

            {snag.updatedAt && (
              <div>
                <p className='text-sm text-gray-500 mb-1'>Last Updated</p>
                <div className='flex items-center gap-2 text-gray-700'>
                  <IconCalendar className='size-4 text-gray-400' />
                  <span>{format(new Date(snag.updatedAt), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
              </div>
            )}

            {/* Assignment Section - Placeholder for future */}
            {/* <div className='border-t pt-6'>
              <h4 className='text-sm font-semibold text-gray-700 mb-3'>Assigned to Estate</h4>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <p className='text-sm text-gray-600'>By Padma on 23 May 2025</p>
                <p className='text-sm text-gray-600 mt-1'>
                  Expected date of closer: <span className='font-medium'>28 May 2025</span>
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </SidebarModal>

      {/* Image Preview Modal */}
      {activeAttachment && (
        <UploadedImagePreview
          onClose={closeImagePreview}
          opened={isOpenImagePreview}
          attachment={activeAttachment}
        />
      )}
    </>
  );
}

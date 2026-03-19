import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackButton from '../../../../components/base/button/BackButton';
import Container from '../../../../components/common/Container';
import { Button } from '../../../../components';
import { IconPencil, IconPhotoPlus } from '@tabler/icons-react';
import { Table } from '@mantine/core';
import { TextHeader } from '../../../../components/base/table/TableHeader';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import TableData from '../../../../components/base/table/TableData';
import { format } from 'date-fns';
import {
  useGetSiteVisitByIdQuery,
  useGetGalleryCollectionsQuery,
  type TSiteVisitTaskSnapshot,
  type TSiteVisitAttachment,
  type TGalleryCollection,
  type TGalleryCollectionAttachment,
} from '../services';
import StatusBadge from '../../../../components/common/StatusBadge';
import UploadedImagePreview from '../../../../components/common/UploadedImagePreview';

export default function SiteVisitSummaryPage() {
  const { id, siteVisitId } = useParams();
  const [previewAttachment, setPreviewAttachment] = useState<TSiteVisitAttachment | null>(null);
  const { data: siteVisit, isFetching } = useGetSiteVisitByIdQuery(siteVisitId || '', {
    skip: !siteVisitId,
  });
  const { data: galleryCollections = [], isFetching: isFetchingGallery } =
    useGetGalleryCollectionsQuery(siteVisitId || '', { skip: !siteVisitId });

  return (
    <Container>
      <div className='flex items-center justify-between'>
        <BackButton backTo={`/projects/${id}/site-visit`}>SITE VISIT SUMMARY</BackButton>
        {siteVisitId && id && (
          <div className='flex gap-2'>
            <Link to={`/projects/${id}/site-visit/${siteVisitId}/edit#gallery`}>
              <Button variant='outline' size='sm' radius='md'>
                <IconPhotoPlus className='size-4 mr-1' />
                Manage gallery
              </Button>
            </Link>
            <Link to={`/projects/${id}/site-visit/${siteVisitId}/edit`}>
              <Button variant='outline' size='sm' radius='md'>
                <IconPencil className='size-4 mr-1' />
                Edit
              </Button>
            </Link>
          </div>
        )}
      </div>

      {isFetching ? (
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500' />
        </div>
      ) : siteVisit ? (
        <>
          {/* HEADER INFO */}
          <div className='mt-4 bg-gray-50 rounded-lg p-4 space-y-2'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='text-sm text-gray-600'>Conducted by</p>
                <p className='font-medium'>
                  {siteVisit.engineers
                    ?.map((e: { engineer: { name: string } }) => e.engineer.name)
                    .join(', ') || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Visit Date</p>
                <p className='font-medium'>
                  {siteVisit.startedAt &&
                    format(new Date(siteVisit.startedAt), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Status</p>
                <StatusBadge status={siteVisit.status} />
              </div>
            </div>

            {siteVisit.summaryText && (
              <div className='pt-3 border-t'>
                <p className='text-sm text-gray-600 mb-1'>Summary</p>
                <p className='text-sm'>{siteVisit.summaryText}</p>
              </div>
            )}

            {siteVisit.submittedAt && (
              <div className='pt-3 border-t'>
                <p className='text-sm text-gray-600'>
                  Submitted on {format(new Date(siteVisit.submittedAt), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            )}

            {siteVisit.reviewedAt && (
              <div className='pt-2'>
                <p className='text-sm text-gray-600'>
                  Reviewed on {format(new Date(siteVisit.reviewedAt), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            )}
          </div>

          {/* TASK SNAPSHOTS TABLE */}
          <div className='mt-6'>
            <h6 className='font-medium mb-3'>Tasks</h6>
            <TableWrapper totalCount={siteVisit.taskSnapshots?.length || 0}>
              <Table
                stickyHeader
                verticalSpacing='sm'
                highlightOnHover
                withColumnBorders
                className='rounded-md! overflow-hidden!'
              >
                <Table.Thead className='bg-neutral-100!'>
                  <Table.Tr>
                    <TextHeader>S.No</TextHeader>
                    <TextHeader>Task Title</TextHeader>
                    <TextHeader>Status</TextHeader>
                    <TextHeader>Notes</TextHeader>
                    <TextHeader>Attachments</TextHeader>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {siteVisit.taskSnapshots && siteVisit.taskSnapshots.length > 0 ? (
                    siteVisit.taskSnapshots.map((task: TSiteVisitTaskSnapshot, index: number) => (
                      <Table.Tr key={task.id}>
                        <TableData>{index + 1}</TableData>
                        <TableData>{task.taskTitle}</TableData>
                        <Table.Td>
                          <StatusBadge status={task.statusAtVisit} />
                        </Table.Td>
                        <TableData>{task.notes || '—'}</TableData>
                        <TableData>
                          {task.attachments?.length ? (
                            <div className='flex flex-wrap gap-1'>
                              {task.attachments.map((att: TSiteVisitAttachment) => (
                                <button
                                  key={att.id ?? att.url}
                                  type='button'
                                  onClick={() => setPreviewAttachment(att)}
                                  className='text-xs text-blue-600 hover:underline truncate max-w-[120px]'
                                  title={att.name}
                                >
                                  {att.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableData>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5} className='text-center text-gray-500 py-8'>
                        No tasks recorded for this visit
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </TableWrapper>
          </div>

          {/* GALLERY COLLECTIONS */}
          <div className='mt-6'>
            <h6 className='font-medium mb-3'>Gallery</h6>
            {isFetchingGallery ? (
              <div className='flex items-center justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400' />
              </div>
            ) : galleryCollections.length > 0 ? (
              <div className='space-y-4'>
                {(galleryCollections as TGalleryCollection[]).map((collection) => (
                  <div
                    key={collection.id}
                    className='bg-gray-50 rounded-lg p-4 border border-gray-100'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {collection.name || 'Unnamed collection'}
                        </p>
                        {collection.area && (
                          <p className='text-sm text-gray-500'>{collection.area}</p>
                        )}
                      </div>
                      <span className='text-xs text-gray-400'>
                        {collection.siteVisitGalleryAttachments?.length ?? 0} photo
                        {(collection.siteVisitGalleryAttachments?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {collection.siteVisitGalleryAttachments &&
                    collection.siteVisitGalleryAttachments.length > 0 ? (
                      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                        {(
                          collection.siteVisitGalleryAttachments as TGalleryCollectionAttachment[]
                        ).map((item) => (
                          <button
                            key={item.id}
                            type='button'
                            onClick={() =>
                              setPreviewAttachment(item.attachment as TSiteVisitAttachment)
                            }
                            className='border border-gray-200 rounded-lg p-2 hover:bg-gray-100 transition-colors text-left cursor-pointer overflow-hidden'
                          >
                            <p
                              className='text-xs font-medium text-gray-700 truncate'
                              title={item.attachment?.name ?? item.caption ?? ''}
                            >
                              {item.caption || item.attachment?.name || 'Photo'}
                            </p>
                            <p className='text-xs text-gray-500 truncate'>
                              {item.attachment?.type || 'File'}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>No photos in this collection</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='bg-gray-50 rounded-lg border border-gray-100 p-6 text-center'>
                <p className='text-sm text-gray-500 mb-3'>No gallery collections for this visit</p>
                {siteVisitId && id && (
                  <Link to={`/projects/${id}/site-visit/${siteVisitId}/edit#gallery`}>
                    <Button
                      variant='light'
                      size='sm'
                      leftIcon={<IconPhotoPlus className='size-4' />}
                    >
                      Add collection
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ATTACHMENTS */}
          {siteVisit.attachments && siteVisit.attachments.length > 0 && (
            <div className='mt-6'>
              <h6 className='font-medium mb-3'>Attachments</h6>
              <div className='grid grid-cols-3 gap-4'>
                {siteVisit.attachments.map((att: TSiteVisitAttachment) => (
                  <button
                    key={att.id}
                    type='button'
                    onClick={() => setPreviewAttachment(att)}
                    className='border rounded-lg p-3 hover:bg-gray-50 transition-colors text-left cursor-pointer'
                  >
                    <p className='text-sm font-medium truncate'>{att.name}</p>
                    <p className='text-xs text-gray-500'>{att.type || 'File'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ATTACHMENT PREVIEW MODAL */}
          {previewAttachment && (
            <UploadedImagePreview
              attachment={{
                name: previewAttachment.name,
                url: previewAttachment.url,
                type: previewAttachment.type ?? 'application/octet-stream',
                key: previewAttachment.key ?? '',
              }}
              opened={!!previewAttachment}
              onClose={() => setPreviewAttachment(null)}
            />
          )}
        </>
      ) : (
        <div className='text-center py-12 text-gray-500'>Site visit not found</div>
      )}
    </Container>
  );
}

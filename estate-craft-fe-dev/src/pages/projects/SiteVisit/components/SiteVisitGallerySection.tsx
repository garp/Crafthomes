import { useState, useMemo } from 'react';
import { Button, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconPencil, IconTrash, IconPhotoPlus } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import DialogModal from '../../../../components/base/ModalWrapper';
import AlertModal from '../../../../components/base/AlertModal';
import FormLabel from '../../../../components/base/FormLabel';
import FormSelect from '../../../../components/base/FormSelect';
import { Button as BaseButton } from '../../../../components';
import {
  useGetSiteVisitByIdQuery,
  useGetGalleryCollectionsQuery,
  useCreateGalleryCollectionMutation,
  useUpdateGalleryCollectionMutation,
  useDeleteGalleryCollectionMutation,
  useCreateGalleryAttachmentMutation,
  useUpdateGalleryAttachmentMutation,
  useDeleteGalleryAttachmentMutation,
} from '../services';
import { useUploadFilesMutation } from '../../../../store/services/upload/upload';
import type {
  TGalleryCollection,
  TGalleryCollectionAttachment,
} from '../../../../store/types/siteVisit.types';
import type { TErrorResponse } from '../../../../store/types/common.types';

type SiteVisitGallerySectionProps = {
  siteVisitId: string;
};

export default function SiteVisitGallerySection({ siteVisitId }: SiteVisitGallerySectionProps) {
  const { data: siteVisit } = useGetSiteVisitByIdQuery(siteVisitId, { skip: !siteVisitId });
  const { data: collections = [], isFetching } = useGetGalleryCollectionsQuery(siteVisitId, {
    skip: !siteVisitId,
  });
  const [createCollection, { isLoading: isCreatingCollection }] =
    useCreateGalleryCollectionMutation();
  const [updateCollection, { isLoading: isUpdatingCollection }] =
    useUpdateGalleryCollectionMutation();
  const [deleteCollection, { isLoading: isDeletingCollection }] =
    useDeleteGalleryCollectionMutation();
  const [createAttachment, { isLoading: isCreatingAttachment }] =
    useCreateGalleryAttachmentMutation();
  const [updateAttachment, { isLoading: isUpdatingAttachment }] =
    useUpdateGalleryAttachmentMutation();
  const [deleteAttachment, { isLoading: isDeletingAttachment }] =
    useDeleteGalleryAttachmentMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();

  const taskOptions = useMemo(() => {
    const snapshots = siteVisit?.taskSnapshots ?? [];
    const withTaskId = snapshots.filter((s) => s.originalTaskId);
    return [
      { value: '', label: 'None' },
      ...withTaskId.map((s) => ({ value: s.originalTaskId!, label: s.taskTitle })),
    ];
  }, [siteVisit?.taskSnapshots]);

  const [addCollectionOpened, { open: openAddCollection, close: closeAddCollection }] =
    useDisclosure(false);
  const [editCollectionOpened, { open: openEditCollection, close: closeEditCollection }] =
    useDisclosure(false);
  const [editAttachmentOpened, { open: openEditAttachment, close: closeEditAttachment }] =
    useDisclosure(false);
  const [removeAttachmentOpened, { open: openRemoveAttachment, close: closeRemoveAttachment }] =
    useDisclosure(false);
  const [deleteCollectionOpened, { open: openDeleteCollection, close: closeDeleteCollection }] =
    useDisclosure(false);
  const [collectionForm, setCollectionForm] = useState<{ name: string; area: string }>({
    name: '',
    area: '',
  });
  const [editingCollection, setEditingCollection] = useState<TGalleryCollection | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<TGalleryCollectionAttachment | null>(
    null,
  );
  const [editAttachmentForm, setEditAttachmentForm] = useState<{ caption: string; taskId: string }>(
    { caption: '', taskId: '' },
  );
  const [taskIdForNewPhotos, setTaskIdForNewPhotos] = useState<Record<string, string>>({});
  const [attachmentToRemove, setAttachmentToRemove] = useState<TGalleryCollectionAttachment | null>(
    null,
  );
  const [collectionToDelete, setCollectionToDelete] = useState<TGalleryCollection | null>(null);

  const handleAddCollection = async () => {
    if (!collectionForm.name.trim()) {
      toast.error('Collection name is required');
      return;
    }
    try {
      await createCollection({
        siteVisitId,
        name: collectionForm.name.trim(),
        area: collectionForm.area.trim() || null,
      }).unwrap();
      toast.success('Collection created');
      setCollectionForm({ name: '', area: '' });
      closeAddCollection();
    } catch (err: unknown) {
      const e = err as { data?: TErrorResponse };
      toast.error(e?.data?.message ?? 'Failed to create collection');
    }
  };

  const handleEditCollection = (col: TGalleryCollection) => {
    setEditingCollection(col);
    setCollectionForm({ name: col.name ?? '', area: col.area ?? '' });
    openEditCollection();
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection) return;
    try {
      await updateCollection({
        id: editingCollection.id,
        name: collectionForm.name.trim() || null,
        area: collectionForm.area.trim() || null,
      }).unwrap();
      toast.success('Collection updated');
      setEditingCollection(null);
      setCollectionForm({ name: '', area: '' });
      closeEditCollection();
    } catch (err: unknown) {
      const e = err as { data?: TErrorResponse };
      toast.error(e?.data?.message ?? 'Failed to update collection');
    }
  };

  const openDeleteCollectionModal = (col: TGalleryCollection) => {
    setCollectionToDelete(col);
    openDeleteCollection();
  };

  const handleConfirmDeleteCollection = async () => {
    if (!collectionToDelete) return;
    try {
      await deleteCollection({ id: collectionToDelete.id, siteVisitId }).unwrap();
      toast.success('Collection deleted');
      setCollectionToDelete(null);
      closeDeleteCollection();
    } catch (err: unknown) {
      const e = err as { data?: TErrorResponse };
      toast.error(e?.data?.message ?? 'Failed to delete collection');
    }
  };

  const onFileSelect = async (collectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const linkTaskId = taskIdForNewPhotos[collectionId] || null;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('folder', 'estate');
    try {
      const res = await uploadFiles(formData).unwrap();
      const uploaded = res?.data?.files ?? [];
      for (const file of uploaded) {
        if (file.id) {
          await createAttachment({
            siteVisitGalleryCollectionId: collectionId,
            attachmentId: file.id,
            ...(linkTaskId ? { taskId: linkTaskId } : {}),
          }).unwrap();
        }
      }
      if (uploaded.length) toast.success('Photo(s) added');
      e.target.value = '';
    } catch (err: unknown) {
      const errPayload = err as { data?: TErrorResponse };
      toast.error(errPayload?.data?.message ?? 'Failed to upload');
    }
  };

  const openEditAttachmentModal = (att: TGalleryCollectionAttachment) => {
    setEditingAttachment(att);
    setEditAttachmentForm({
      caption: att.caption ?? '',
      taskId: att.taskId ?? '',
    });
    openEditAttachment();
  };

  const handleSaveEditAttachment = async () => {
    if (!editingAttachment) return;
    try {
      await updateAttachment({
        id: editingAttachment.id,
        caption: editAttachmentForm.caption.trim() || null,
        taskId: editAttachmentForm.taskId.trim() || null,
      }).unwrap();
      toast.success('Photo updated');
      setEditingAttachment(null);
      setEditAttachmentForm({ caption: '', taskId: '' });
      closeEditAttachment();
    } catch (err: unknown) {
      const e = err as { data?: TErrorResponse };
      toast.error(e?.data?.message ?? 'Failed to update photo');
    }
  };

  const openRemoveAttachmentModal = (att: TGalleryCollectionAttachment) => {
    setAttachmentToRemove(att);
    openRemoveAttachment();
  };

  const handleConfirmRemoveAttachment = async () => {
    if (!attachmentToRemove) return;
    try {
      await deleteAttachment({
        id: attachmentToRemove.id,
        siteVisitGalleryCollectionId: attachmentToRemove.siteVisitGalleryCollectionId,
      }).unwrap();
      toast.success('Photo removed');
      setAttachmentToRemove(null);
      closeRemoveAttachment();
    } catch (err: unknown) {
      const e = err as { data?: TErrorResponse };
      toast.error(e?.data?.message ?? 'Failed to remove photo');
    }
  };

  const isLoading =
    isCreatingCollection ||
    isUpdatingCollection ||
    isDeletingCollection ||
    isCreatingAttachment ||
    isUpdatingAttachment ||
    isDeletingAttachment ||
    isUploading;

  return (
    <div className='relative z-10 mt-4 mb-6 p-5 pb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h6 className='text-lg font-semibold text-gray-900'>Gallery</h6>
          <p className='text-sm text-gray-500 mt-0.5'>
            Add and manage photo collections for this visit
          </p>
        </div>
        <BaseButton
          variant='primary'
          size='sm'
          leftIcon={<IconPlus className='size-4' />}
          onClick={openAddCollection}
          disabled={isLoading}
        >
          Add collection
        </BaseButton>
      </div>

      {isFetching ? (
        <div className='flex justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent' />
        </div>
      ) : collections.length === 0 ? (
        <div className='bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center'>
          <p className='text-sm text-gray-600 mb-4'>
            No gallery collections yet. Create one to group and upload photos.
          </p>
          <BaseButton
            variant='primary'
            size='md'
            leftIcon={<IconPlus className='size-4' />}
            onClick={openAddCollection}
            disabled={isLoading}
          >
            Add your first collection
          </BaseButton>
        </div>
      ) : (
        <div className='space-y-6'>
          {collections.map((col) => (
            <div key={col.id} className='bg-gray-50 rounded-lg border border-gray-100 p-4 pb-6'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <span className='font-medium'>{col.name || 'Unnamed collection'}</span>
                  {col.area && <span className='text-sm text-gray-500 ml-2'>— {col.area}</span>}
                </div>
                <div className='flex gap-2'>
                  <BaseButton
                    variant='light'
                    size='sm'
                    leftIcon={<IconPencil className='size-4' />}
                    onClick={() => handleEditCollection(col)}
                    disabled={isLoading}
                  >
                    Edit
                  </BaseButton>
                  <BaseButton
                    variant='danger'
                    size='sm'
                    leftIcon={<IconTrash className='size-4' />}
                    onClick={() => openDeleteCollectionModal(col)}
                    disabled={isLoading}
                  >
                    Delete
                  </BaseButton>
                </div>
              </div>
              {taskOptions.length > 1 && (
                <div className='mb-3'>
                  <FormLabel>Link Task</FormLabel>
                  <FormSelect
                    options={taskOptions}
                    value={taskIdForNewPhotos[col.id] ?? ''}
                    onChange={(value) =>
                      setTaskIdForNewPhotos((p) => ({ ...p, [col.id]: value ?? '' }))
                    }
                    placeholder='None'
                    clearable
                    size='xs'
                    className='max-w-xs'
                  />
                </div>
              )}
              <div className='flex flex-wrap gap-3 pb-2'>
                {(col.siteVisitGalleryAttachments ?? []).map((att) => (
                  <div
                    key={att.id}
                    className='relative group w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-white'
                  >
                    {att.attachment?.url && (
                      <img
                        src={att.attachment.url}
                        alt={att.attachment.name ?? ''}
                        className='w-full h-full object-cover'
                      />
                    )}
                    {(att.task?.name ??
                      (att.taskId && taskOptions.find((o) => o.value === att.taskId)?.label)) && (
                      <span className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate'>
                        {att.task?.name ?? taskOptions.find((o) => o.value === att.taskId)?.label}
                      </span>
                    )}
                    <div className='absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <button
                        type='button'
                        className='p-1 rounded bg-primary-500 text-white'
                        onClick={() => openEditAttachmentModal(att)}
                        disabled={isLoading}
                        aria-label='Edit photo'
                      >
                        <IconPencil className='size-3' />
                      </button>
                      <button
                        type='button'
                        className='p-1 rounded bg-red-500 text-white'
                        onClick={() => openRemoveAttachmentModal(att)}
                        disabled={isLoading}
                        aria-label='Remove photo'
                      >
                        <IconTrash className='size-3' />
                      </button>
                    </div>
                  </div>
                ))}
                <label className='w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors'>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    onChange={(e) => onFileSelect(col.id, e)}
                    disabled={isLoading}
                  />
                  <IconPhotoPlus className='size-8 text-gray-400' />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add collection modal */}
      <DialogModal
        title='Add collection'
        opened={addCollectionOpened}
        onClose={closeAddCollection}
        size='sm'
      >
        <div className='space-y-4'>
          <div>
            <FormLabel htmlFor='gallery-collection-name'>Name</FormLabel>
            <TextInput
              id='gallery-collection-name'
              value={collectionForm.name}
              onChange={(e) => setCollectionForm((p) => ({ ...p, name: e.target.value }))}
              placeholder='e.g. Living room'
            />
          </div>
          <div>
            <FormLabel htmlFor='gallery-collection-area'>Area (optional)</FormLabel>
            <TextInput
              id='gallery-collection-area'
              value={collectionForm.area}
              onChange={(e) => setCollectionForm((p) => ({ ...p, area: e.target.value }))}
              placeholder='e.g. Block A'
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='subtle'
              color='dark'
              className='text-gray-700'
              onClick={closeAddCollection}
            >
              Cancel
            </Button>
            <Button color='dark' onClick={handleAddCollection} loading={isCreatingCollection}>
              Create
            </Button>
          </div>
        </div>
      </DialogModal>

      {/* Edit collection modal */}
      <DialogModal
        title='Edit collection'
        size='sm'
        opened={editCollectionOpened}
        onClose={() => {
          closeEditCollection();
          setEditingCollection(null);
          setCollectionForm({ name: '', area: '' });
        }}
      >
        <div className='space-y-4'>
          <div>
            <FormLabel htmlFor='edit-gallery-collection-name'>Name</FormLabel>
            <TextInput
              id='edit-gallery-collection-name'
              value={collectionForm.name}
              onChange={(e) => setCollectionForm((p) => ({ ...p, name: e.target.value }))}
              placeholder='e.g. Living room'
            />
          </div>
          <div>
            <FormLabel htmlFor='edit-gallery-collection-area'>Area (optional)</FormLabel>
            <TextInput
              id='edit-gallery-collection-area'
              value={collectionForm.area}
              onChange={(e) => setCollectionForm((p) => ({ ...p, area: e.target.value }))}
              placeholder='e.g. Block A'
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='subtle'
              color='dark'
              className='text-gray-700'
              onClick={closeEditCollection}
            >
              Cancel
            </Button>
            <Button color='dark' onClick={handleUpdateCollection} loading={isUpdatingCollection}>
              Save
            </Button>
          </div>
        </div>
      </DialogModal>

      {/* Edit attachment (caption + link to task) */}
      <DialogModal
        title='Edit photo'
        size='sm'
        opened={editAttachmentOpened}
        onClose={() => {
          closeEditAttachment();
          setEditingAttachment(null);
          setEditAttachmentForm({ caption: '', taskId: '' });
        }}
      >
        <div className='space-y-4'>
          <div>
            <FormLabel htmlFor='edit-attachment-caption'>Caption (optional)</FormLabel>
            <TextInput
              id='edit-attachment-caption'
              value={editAttachmentForm.caption}
              onChange={(e) => setEditAttachmentForm((p) => ({ ...p, caption: e.target.value }))}
              placeholder='Add a caption'
            />
          </div>
          {taskOptions.length > 1 && (
            <div>
              <FormLabel>Link to task</FormLabel>
              <FormSelect
                options={taskOptions}
                value={editAttachmentForm.taskId}
                onChange={(value) => setEditAttachmentForm((p) => ({ ...p, taskId: value ?? '' }))}
                placeholder='None'
                clearable
              />
            </div>
          )}
          <div className='flex justify-end gap-2'>
            <Button
              variant='subtle'
              color='dark'
              className='text-gray-700'
              onClick={closeEditAttachment}
            >
              Cancel
            </Button>
            <Button color='dark' onClick={handleSaveEditAttachment} loading={isUpdatingAttachment}>
              Save
            </Button>
          </div>
        </div>
      </DialogModal>

      {/* Remove photo from collection */}
      <AlertModal
        opened={removeAttachmentOpened}
        onClose={() => {
          closeRemoveAttachment();
          setAttachmentToRemove(null);
        }}
        title='Remove photo'
        subtitle='Remove this photo from the collection?'
        onConfirm={handleConfirmRemoveAttachment}
        isLoading={isDeletingAttachment}
        isDeleting={isDeletingAttachment}
      />

      {/* Delete collection */}
      <AlertModal
        opened={deleteCollectionOpened}
        onClose={() => {
          closeDeleteCollection();
          setCollectionToDelete(null);
        }}
        title='Delete collection'
        subtitle={
          collectionToDelete
            ? `Delete "${collectionToDelete.name ?? 'Unnamed'}"? This will remove all photos in it.`
            : 'This will remove all photos in this collection.'
        }
        onConfirm={handleConfirmDeleteCollection}
        isLoading={isDeletingCollection}
        isDeleting={isDeletingCollection}
      />
    </div>
  );
}

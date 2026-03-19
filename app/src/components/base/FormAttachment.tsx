import FormLabel from './FormLabel';
import Spinner from '../common/loaders/Spinner';

import { IconFile, IconFileTypePdf, IconFileTypeDoc, IconPresentation } from '@tabler/icons-react';
import PlusCircle from '../icons/PlusCircle';
import IconButton from './button/IconButton';
import { Image } from './Image';
import { CloseIcon } from '@mantine/core';
import { toast } from 'react-toastify';
import { MAX_FILE_SIZE } from '../../constants/common';
import type { TAttachment, TErrorResponse } from '../../store/types/common.types';
import { useDeleteFileMutation, useUploadFilesMutation } from '../../store/services/upload/upload';
import { useState, type ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';
// import DialogModal from './ModalWrapper';
// import type { TFunc } from '../../types/common.types';
import { cn } from '../../utils/helper';
import UploadedImagePreview from '../common/UploadedImagePreview';

type TFormAttachmentProps = {
  currentAttachments: TAttachment[] | null | undefined;
  onUpload: (arg: TAttachment[]) => void;
  folderName: string;
  fieldName?: string;
  label?: string;
  className?: string;
  icon?: ReactNode;
  labelWrapperClassName?: string;
  multiple?: boolean;
  labelClassName?: string;
  inputId: string;
  disabled?: boolean;
  removeAttachmentFromLocal?: (arg: string) => void;
  iconWrapperClassName?: string;
  addButtonText?: string;
  maxFiles?: number;
  // onInputChange : (e,setFieldv)
};

export default function FormAttachment({
  currentAttachments,
  folderName,
  onUpload,
  //   fieldName = 'attachment',
  label = 'Attachment',
  className,
  icon = <PlusCircle />,
  labelWrapperClassName,
  multiple = true,
  labelClassName,
  inputId = 'attachment',
  disabled,
  removeAttachmentFromLocal,
  iconWrapperClassName,
  addButtonText = 'Add Image',
  maxFiles = 5,
}: TFormAttachmentProps) {
  // console.log({ currentAttachments });
  const [isOpenImagePreview, { open: openImagePreview, close: closeImagePreview }] =
    useDisclosure();
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [activeAttachment, setActiveAttachment] = useState<TAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();
  const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFileMutation();
  const isLoading = isUploadingFiles || isDeletingFile || disabled;

  function uploadFilesList(files: File[]) {
    if (disabled) return;
    if (!files.length) return;
    const currentCount = currentAttachments?.length ?? 0;
    if (currentCount + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    const formData = new FormData();
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 10 MB');
        return;
      }
      formData.append('files', file);
    }
    formData.append('folder', folderName);
    uploadFiles(formData)
      .unwrap()
      .then((res) => {
        const uploadedFiles = res?.data?.files;
        if (uploadedFiles && Array.isArray(uploadedFiles)) {
          onUpload([...(currentAttachments || []), ...uploadedFiles]);
        } else {
          toast.error('Failed to upload files');
        }
      })
      .catch((error) => {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload files');
      });
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const files = e.target.files;
    if (!files) return;
    uploadFilesList(Array.from(files));
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    uploadFilesList(Array.from(files));
  }

  function removeAttachment(
    attachment: TAttachment,
    index: number,
    // values: T,
  ) {
    if (disabled) return;
    setActiveAttachmentIndex(index);
    deleteFile({ key: attachment?.key })
      .unwrap()
      .then(() => {
        onUpload(currentAttachments?.filter((att) => att.key !== attachment?.key) || []);
        if (removeAttachmentFromLocal) removeAttachmentFromLocal(attachment?.key);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to delete file');
        console.log('Error in deleting file-', error);
      });
  }
  function handleImageClick(att: TAttachment) {
    setActiveAttachment(att);
    openImagePreview();
  }

  function getFileIcon(fileType: string) {
    const type = fileType.toLowerCase();

    // PDF files
    if (type === 'pdf') {
      return <IconFileTypePdf className={cn('text-red-500', multiple ? 'size-12' : 'size-14')} />;
    }

    // Word documents
    if (type === 'doc' || type === 'docx') {
      return <IconFileTypeDoc className={cn('text-blue-500', multiple ? 'size-12' : 'size-14')} />;
    }

    // PowerPoint presentations
    if (type === 'ppt' || type === 'pptx') {
      return (
        <IconPresentation className={cn('text-orange-500', multiple ? 'size-12' : 'size-14')} />
      );
    }

    // Excel files
    if (type === 'xls' || type === 'xlsx') {
      return <IconFile className={cn('text-green-600', multiple ? 'size-12' : 'size-14')} />;
    }

    // Default file icon
    return <IconFile className={cn('text-text-subHeading', multiple ? 'size-12' : 'size-14')} />;
  }

  // console.log({ currentAttachments });
  return (
    <>
      <div className={cn('flex', multiple ? 'flex-col' : 'flex-row items-start gap-6', className)}>
        {/* LABEL SECTION */}
        {multiple && (
          <section className={cn('flex items-center w-full', labelWrapperClassName)}>
            {label && <FormLabel className={cn('w-[40%]', labelClassName)}>{label}</FormLabel>}
          </section>
        )}

        {/* LABEL AND UPLOAD BUTTON SECTION (for single image) */}
        {!multiple && (
          <section className={cn('flex items-center shrink-0', labelWrapperClassName)}>
            {label && <FormLabel className={cn('w-auto mr-4', labelClassName)}>{label}</FormLabel>}
            <label
              aria-disabled={currentAttachments?.length === 1}
              htmlFor={inputId}
              className={cn(
                'cursor-pointer w-fit h-fit px-5 py-3 border border-gray-300 rounded-lg inline-block shadow-sm bg-white',
                'aria-disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:bg-bg-light aria-disabled:text-text-subHeading',
                iconWrapperClassName,
              )}
            >
              {icon}
            </label>
            <input
              disabled={currentAttachments?.length === 1}
              type='file'
              id={inputId}
              multiple={multiple}
              onChange={handleAttachmentChange}
              className='hidden'
            />
          </section>
        )}

        {/* Attachment Preview Grid - with drag and drop */}
        <section
          className={cn(
            multiple
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5 w-full'
              : 'flex-1',
            'rounded-lg transition-colors',
            isDragging && 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            if (!disabled && (currentAttachments?.length ?? 0) < maxFiles) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          {/* Add Button in Grid (for multiple) */}
          {multiple && (
            <label
              aria-disabled={disabled || (currentAttachments?.length || 0) >= maxFiles}
              htmlFor={inputId}
              className={cn(
                'cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors min-h-[140px]',
                'aria-disabled:opacity-60 aria-disabled:cursor-not-allowed',
                iconWrapperClassName,
              )}
            >
              <div className='text-gray-400 mb-2'>{icon}</div>
              <span className='text-xs text-gray-500'>{addButtonText}</span>
              <input
                disabled={disabled || (currentAttachments?.length || 0) >= maxFiles}
                type='file'
                id={inputId}
                multiple={multiple}
                onChange={handleAttachmentChange}
                className='hidden'
              />
            </label>
          )}

          {/* Image Cards */}
          {currentAttachments?.map((attachment, index) => (
            <div
              key={attachment?.key}
              className={cn(
                multiple
                  ? 'group relative rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:shadow-md transition-shadow'
                  : 'relative w-full rounded-lg border border-gray-200 bg-gray-50 p-3',
              )}
            >
              {isDeletingFile && index === activeAttachmentIndex ? (
                <div className='flex items-center justify-center min-h-[120px]'>
                  <Spinner />
                </div>
              ) : (
                <>
                  {/(jpe?g|png|webp|gif|svg)$/i.test(attachment?.type || '') ? (
                    <div className={cn('relative', !multiple && 'rounded-md overflow-hidden mb-2')}>
                      <Image
                        className={cn(
                          'cursor-pointer',
                          multiple
                            ? 'w-full h-32 object-cover rounded-md'
                            : 'w-full h-auto object-cover rounded-md',
                        )}
                        src={attachment?.url}
                        alt={attachment?.name}
                        height={multiple ? 128 : undefined}
                        width={multiple ? undefined : undefined}
                        onClick={() => handleImageClick(attachment)}
                      />
                      <IconButton
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(attachment, index);
                        }}
                        className={cn(
                          'absolute -top-0.5 -right-0.5 z-10 bg-white rounded-full p-0.5 shadow-md hover:bg-gray-100',
                          multiple
                            ? 'opacity-0 group-hover:opacity-100 transition-opacity'
                            : 'opacity-100',
                        )}
                      >
                        <CloseIcon size='15' />
                      </IconButton>
                    </div>
                  ) : (
                    <div className={cn('relative', !multiple && 'mb-2')}>
                      <div
                        className={cn(
                          'flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity',
                          multiple ? 'min-h-[120px]' : '',
                        )}
                        onClick={() => handleImageClick(attachment)}
                      >
                        {getFileIcon(attachment?.type || '')}
                      </div>
                      <IconButton
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(attachment, index);
                        }}
                        className={cn(
                          'absolute -top-0.5 -right-0.5 z-10 bg-white rounded-full p-0.5 shadow-md hover:bg-gray-100',
                          multiple
                            ? 'opacity-0 group-hover:opacity-100 transition-opacity'
                            : 'opacity-100',
                        )}
                      >
                        <CloseIcon size='15' />
                      </IconButton>
                    </div>
                  )}
                  <p
                    className={cn(
                      'text-xs line-clamp-1 text-gray-600 mt-2',
                      !multiple && 'text-center',
                      multiple && 'px-1',
                    )}
                  >
                    {attachment?.name}
                  </p>
                </>
              )}
            </div>
          ))}
          {isUploadingFiles && (
            <div className='flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[140px]'>
              <IsUploadingLoader />
            </div>
          )}
        </section>
      </div>
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

////////IsUploadingLoader
function IsUploadingLoader() {
  return (
    <div className='flex gap-2 items-center text-text-subHeading'>
      <Spinner />
      <p className='text-sm text-center'>Uploading...</p>
    </div>
  );
}

import type { TAttachment } from '../../store/types/common.types';
import type { TFunc } from '../../types/common.types';
import { Image } from '../base';
import DialogModal from '../base/ModalWrapper';
import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';

const PREVIEW_MODAL_SIZE = '90vw';
const PREVIEW_CONTENT_MAX_HEIGHT = '80vh';

function getFileKind(attachment: TAttachment) {
  const type = attachment?.type?.toLowerCase() || '';
  const name = attachment?.name?.toLowerCase() || '';
  // Support MIME types and extension-based detection
  const isImage =
    /(jpe?g|png|webp|gif|svg|image)/i.test(type) || /\.(jpe?g|png|webp|gif|svg)$/i.test(name);
  const isPdf = type === 'pdf' || type === 'application/pdf' || name.endsWith('.pdf');
  const isDocx =
    /(msword|vnd\.openxmlformats-officedocument\.wordprocessingml)/i.test(type) ||
    name.endsWith('.docx') ||
    name.endsWith('.doc');
  const isVideo =
    /(mp4|webm|ogg|mov|avi|video)/i.test(type) || /\.(mp4|webm|ogg|mov|avi)$/i.test(name);
  return { isImage, isPdf, isDocx, isVideo };
}

type TUploadedImagePreviewProps = {
  attachment: TAttachment;
  opened: boolean;
  onClose: TFunc;
};

export default function UploadedImagePreview({
  attachment,
  onClose,
  opened,
}: TUploadedImagePreviewProps) {
  const { isImage, isPdf, isDocx, isVideo } = getFileKind(attachment);

  return (
    <DialogModal
      title={attachment?.name}
      titleClassName='text-text-secondary! text-xl!'
      size={PREVIEW_MODAL_SIZE}
      opened={opened}
      onClose={onClose}
      styles={{
        body: { maxHeight: PREVIEW_CONTENT_MAX_HEIGHT, overflow: 'auto' },
      }}
    >
      {/* Image Preview */}
      {isImage && (
        <div className='flex justify-center items-center w-full border rounded-md min-h-[50vh]'>
          <Image
            className='object-contain max-h-[75vh] w-auto'
            src={attachment?.url}
            alt={attachment?.name}
            height={600}
            width={600}
          />
        </div>
      )}

      {/* PDF Preview */}
      {isPdf && <PdfViewer url={attachment?.url} contentClassName='max-h-[80vh] min-h-[60vh]' />}

      {/* DOC/DOCX Preview */}
      {isDocx && (
        <div className='min-h-[60vh]'>
          <DocxViewer url={attachment?.url} className='min-h-[60vh]' />
        </div>
      )}

      {/* Video Preview */}
      {isVideo && (
        <div className='w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[50vh]'>
          <video
            src={attachment?.url}
            controls
            className='w-full h-auto max-h-[75vh] object-contain'
            preload='metadata'
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Unsupported type */}
      {!isImage && !isPdf && !isDocx && !isVideo && (
        <div className='flex flex-col items-center justify-center min-h-[200px] bg-gray-50 rounded-lg border border-gray-200 p-6'>
          <p className='text-gray-600 text-sm'>Preview not available for this file type.</p>
          <a
            href={attachment?.url}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-3 text-sm text-blue-600 hover:underline'
          >
            Download file
          </a>
        </div>
      )}
    </DialogModal>
  );
}

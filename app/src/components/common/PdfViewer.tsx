import { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import IconButton from '../base/button/IconButton';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type TPdfViewerProps = {
  url: string;
  className?: string;
  /** Applied to the scrollable PDF content container (default: max-h-[400px]) */
  contentClassName?: string;
};

export default function PdfViewer({
  url,
  className = '',
  contentClassName = 'max-h-[400px]',
}: TPdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    pageRefs.current = new Array(numPages).fill(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err);
    setError('Failed to load PDF');
    setIsLoading(false);
  }

  const scrollToPage = (pageNum: number) => {
    const pageElement = pageRefs.current[pageNum - 1];
    if (pageElement && containerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  const goToPrevPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    scrollToPage(newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(currentPage + 1, numPages);
    scrollToPage(newPage);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Handle scroll to update current page indicator
  const handleScroll = useCallback(() => {
    if (!containerRef.current || numPages === 0) return;

    const container = containerRef.current;
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Find which page is most visible
    let mostVisiblePage = 1;
    let maxVisibleArea = 0;

    pageRefs.current.forEach((pageEl, index) => {
      if (!pageEl) return;

      const pageTop = pageEl.offsetTop - container.offsetTop;
      const pageBottom = pageTop + pageEl.clientHeight;

      // Calculate visible area of this page
      const visibleTop = Math.max(containerTop, pageTop);
      const visibleBottom = Math.min(containerTop + containerHeight, pageBottom);
      const visibleArea = Math.max(0, visibleBottom - visibleTop);

      if (visibleArea > maxVisibleArea) {
        maxVisibleArea = visibleArea;
        mostVisiblePage = index + 1;
      }
    });

    setCurrentPage(mostVisiblePage);
  }, [numPages]);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-gray-200 ${className}`}
      >
        <p className='text-red-500 text-sm'>{error}</p>
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className='mt-2 text-sm text-blue-600 hover:underline'
        >
          Open PDF in new tab
        </a>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Controls */}
      <div className='flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200'>
        <div className='flex items-center gap-2'>
          <IconButton
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className='p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded'
          >
            <IconChevronLeft className='size-5 text-gray-600' />
          </IconButton>
          <span className='text-sm text-gray-700 min-w-[80px] text-center'>
            {currentPage} / {numPages || '...'}
          </span>
          <IconButton
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className='p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded'
          >
            <IconChevronRight className='size-5 text-gray-600' />
          </IconButton>
        </div>
        <div className='flex items-center gap-2'>
          <IconButton
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className='p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded'
          >
            <IconZoomOut className='size-5 text-gray-600' />
          </IconButton>
          <span className='text-sm text-gray-700 min-w-[50px] text-center'>
            {Math.round(scale * 100)}%
          </span>
          <IconButton
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className='p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded'
          >
            <IconZoomIn className='size-5 text-gray-600' />
          </IconButton>
        </div>
      </div>

      {/* PDF Document - Scrollable container for all pages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-auto bg-gray-800 p-4 ${contentClassName}`}
      >
        {isLoading && (
          <div className='flex items-center justify-center h-full'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className='flex flex-col items-center gap-4'
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
              className='shadow-lg'
            >
              <Page
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

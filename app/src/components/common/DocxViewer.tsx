import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import IconButton from '../base/button/IconButton';

type TDocxViewerProps = {
  url: string;
  className?: string;
};

export default function DocxViewer({ url, className = '' }: TDocxViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const loadDocx = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the DOCX file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const arrayBuffer = await response.arrayBuffer();

        // Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (result.messages.length > 0) {
          console.warn('Mammoth conversion warnings:', result.messages);
        }

        setHtmlContent(result.value);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading DOCX:', err);
        setError('Failed to load document');
        setIsLoading(false);
      }
    };

    if (url) {
      loadDocx();
    }
  }, [url]);

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

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
          Download document
        </a>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Controls */}
      <div className='flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200'>
        <span className='text-sm text-gray-600'>Document Preview</span>
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

      {/* Document Content */}
      <div className='flex-1 overflow-auto bg-white p-4 max-h-[400px]'>
        {isLoading ? (
          <div className='flex items-center justify-center h-full min-h-[200px]'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600'></div>
          </div>
        ) : (
          <div
            className='docx-content prose prose-sm max-w-none'
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>

      {/* Styles for DOCX content */}
      <style>{`
        .docx-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .docx-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
        }
        .docx-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          margin-top: 1.25rem;
        }
        .docx-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
        }
        .docx-content p {
          margin-bottom: 0.75rem;
        }
        .docx-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        .docx-content table, .docx-content th, .docx-content td {
          border: 1px solid #ddd;
        }
        .docx-content th, .docx-content td {
          padding: 8px;
          text-align: left;
        }
        .docx-content th {
          background-color: #f3f4f6;
        }
        .docx-content ul, .docx-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .docx-content li {
          margin-bottom: 0.25rem;
        }
        .docx-content img {
          max-width: 100%;
          height: auto;
        }
        .docx-content strong, .docx-content b {
          font-weight: 600;
        }
        .docx-content em, .docx-content i {
          font-style: italic;
        }
        .docx-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .docx-content a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}

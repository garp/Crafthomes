/**
 * File Upload Constants and Validation Helpers
 *
 * This file contains constants and helper functions for file upload validation.
 * Note: MAX_FILE_SIZE in common.ts is kept separate as it's used for different purposes.
 */

// Maximum file size for uploads (10 MB in bytes)
export const MAX_FILE_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

// Maximum number of files that can be uploaded at once
export const MAX_FILES_PER_UPLOAD = 5;

// Accepted MIME types for file uploads
export const ACCEPTED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  // Compressed
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // CAD files
  'application/acad',
  'application/x-acad',
  'application/autocad_dwg',
  'image/vnd.dwg',
  'image/vnd.dxf',
  'application/dxf',
  // Other
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
];

// Accepted file extensions
export const ACCEPTED_FILE_EXTENSIONS = [
  // Documents
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  // Images
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  // Videos
  '.mp4',
  '.mov',
  '.avi',
  '.wmv',
  // Compressed
  '.zip',
  '.rar',
  '.7z',
  // CAD files
  '.dwg',
  '.dxf',
  // Other
  '.rtf',
  '.odt',
  '.ods',
];

/**
 * Check if a file type is valid
 */
export function isValidFileType(file: File): boolean {
  // Check MIME type
  if (ACCEPTED_FILE_TYPES.includes(file.type)) {
    return true;
  }

  // Check file extension as fallback (for cases where MIME type might not be set correctly)
  const fileName = file.name.toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

/**
 * Check if a file size is within the allowed limit
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_UPLOAD_SIZE;
}

/**
 * Validate multiple files and return valid files with error messages
 */
export function validateFiles(files: File[]): {
  valid: File[];
  errors: string[];
} {
  const valid: File[] = [];
  const errors: string[] = [];

  // Check total file count
  if (files.length > MAX_FILES_PER_UPLOAD) {
    errors.push(
      `Maximum ${MAX_FILES_PER_UPLOAD} files allowed. You selected ${files.length} files.`,
    );
    return { valid, errors };
  }

  files.forEach((file) => {
    // Check file type
    if (!isValidFileType(file)) {
      errors.push(
        `"${file.name}" - Invalid file type. Accepted types: Documents (PDF, Word, Excel, PowerPoint, Text, CSV), Images (JPEG, PNG, WebP, GIF, SVG), Videos (MP4, MOV, AVI, WMV), Compressed (ZIP, RAR, 7Z), CAD (DWG, DXF), and other supported formats.`,
      );
      return;
    }

    // Check file size
    if (!isValidFileSize(file)) {
      errors.push(
        `"${file.name}" - File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(MAX_FILE_UPLOAD_SIZE)})`,
      );
      return;
    }

    // File is valid
    valid.push(file);
  });

  return { valid, errors };
}

/**
 * Format bytes to human-readable size string
 * Example: 41943040 -> "40 mb"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'kb', 'mb', 'gb'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = Math.round((bytes / Math.pow(k, i)) * 100) / 100;
  return size + ' ' + sizes[i];
}

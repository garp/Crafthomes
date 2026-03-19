import axios from 'axios';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';
import { AWS_CONFIG, MEDIA_COMPRESSOR } from '../../../config/server.js';

/**
 * Media Compressor Service
 *
 * Integrates with the FastAPI Image & Video Compressor Server
 * Supports image compression (WebP, AVIF, JPEG, PNG) and video compression (WebM)
 * Uploads compressed files directly to your cloud storage (S3, DigitalOcean Spaces, Azure)
 *
 * API Docs: https://assets-compress.bytive.in/docs
 */

/**
 * Encrypt a string using AES-256-CBC (matches Python server format)
 * Format: Base64(IV + ciphertext)
 * @param {string} plainText - The text to encrypt
 * @returns {string} - Encrypted text (Base64 encoded)
 */
const encryptAES = plainText => {
	if (!MEDIA_COMPRESSOR.AES_KEY) {
		throw new Error('MEDIA_COMPRESSOR_AES_KEY is not configured');
	}

	const hexKey = MEDIA_COMPRESSOR.AES_KEY;

	if (!hexKey || hexKey.length !== 64) {
		throw new Error('AES key must be exactly 64 hex characters (32 bytes)');
	}

	// Convert hex key to WordArray (32 bytes = 256 bits)
	const key = CryptoJS.enc.Hex.parse(hexKey);

	// Generate random IV (16 bytes = 128 bits)
	const iv = CryptoJS.lib.WordArray.random(16);

	// Encrypt using AES-256-CBC with PKCS7 padding
	const encrypted = CryptoJS.AES.encrypt(plainText, key, {
		iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	});

	// Extract the raw ciphertext (WordArray)
	const ciphertext = encrypted.ciphertext;

	// Convert IV to bytes (16 bytes)
	const ivHex = iv.toString(CryptoJS.enc.Hex);
	const ivBytes = Buffer.from(ivHex, 'hex');

	// Convert ciphertext to bytes
	const ciphertextHex = ciphertext.toString(CryptoJS.enc.Hex);
	const ciphertextBytes = Buffer.from(ciphertextHex, 'hex');

	// Combine IV (16 bytes) + ciphertext bytes
	// This exactly matches Python's: base64.b64encode(iv + encrypted_bytes)
	const combined = Buffer.concat([ivBytes, ciphertextBytes]);

	// Convert to base64 string
	return combined.toString('base64');
};

/**
 * Get encrypted S3 credentials for the compressor service
 * @returns {string} - Encrypted JSON credentials
 */
const getEncryptedS3Credentials = () => {
  const credentials = {
    api_key: AWS_CONFIG.ACCESS_KEY_ID,
    secret_key: AWS_CONFIG.SECRET_ACCESS_KEY,
    bucket_name: AWS_CONFIG.BUCKET_NAME,
    region: AWS_CONFIG.REGION,
  };

  return encryptAES(JSON.stringify(credentials));
};

/**
 * Supported image output formats
 */
export const IMAGE_FORMATS = {
  WEBP: 'webp',
  AVIF: 'avif',
  JPEG: 'jpeg',
  PNG: 'png',
};

/**
 * Storage types supported by the compressor
 */
export const STORAGE_TYPES = {
  S3: 's3',
  DIGITALOCEAN: 'do',
  AZURE: 'azure',
};

class MediaCompressorService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: MEDIA_COMPRESSOR.URL,
      timeout: MEDIA_COMPRESSOR.TIMEOUT,
    });
  }

  /**
   * Compress and upload an image from a file buffer
   *
   * @param {Object} options - Compression options
   * @param {Buffer} options.buffer - File buffer
   * @param {string} options.originalName - Original filename
   * @param {string} options.mimeType - MIME type of the file
   * @param {string} [options.filename] - Custom filename (without extension)
   * @param {string} [options.format='webp'] - Output format (webp, avif, jpeg, png)
   * @param {string} [options.directory='files/compressed'] - S3 directory path
   * @returns {Promise<{compressedUrl: string, filename: string}>}
   */
  async compressImage({ buffer, originalName, mimeType, filename, format = IMAGE_FORMATS.WEBP, directory = 'files/compressed' }) {
    try {
      const formData = new FormData();

      // Add the image file
      formData.append('image_file', buffer, {
        filename: originalName,
        contentType: mimeType,
      });

      // Add compression parameters
      formData.append('filetype', format);
      if (filename) {
        formData.append('filename', filename);
      }

      // Add S3 storage configuration
      formData.append('storage_type', STORAGE_TYPES.S3);
      formData.append('encrypted_credentials', getEncryptedS3Credentials());

      // Add directory for S3 (using do_directory as the API expects)
      // Note: The API uses do_directory for subdirectory in all S3-compatible storages
      formData.append('do_directory', directory);

      const response = await this.apiClient.post('/api/v1/files/upload_image', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Handle response format: { detail: { status, message, data: { compressed_url, filename } } }
      const responseData = response.data?.detail?.data || response.data?.data || response.data;
      const compressedUrl = responseData?.compressed_url || responseData?.url;
      const resultFilename = responseData?.filename || responseData?.file_name;

      if (!compressedUrl) {
        console.error('Unexpected response format:', JSON.stringify(response.data, null, 2));
        throw new Error('No compressed URL in response');
      }

      return {
        compressedUrl,
        filename: resultFilename,
      };
    } catch (error) {
      console.error('Image compression error:', error.response?.data || error.message);
      throw new Error(`Failed to compress image: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Compress and upload an image from a URL
   *
   * @param {Object} options - Compression options
   * @param {string} options.imageUrl - URL of the image to compress
   * @param {string} [options.filename] - Custom filename (without extension)
   * @param {string} [options.format='webp'] - Output format (webp, avif, jpeg, png)
   * @param {string} [options.directory='files/compressed'] - S3 directory path
   * @returns {Promise<{compressedUrl: string, filename: string}>}
   */
  async compressImageFromUrl({ imageUrl, filename, format = IMAGE_FORMATS.WEBP, directory = 'files/compressed' }) {
    try {
      const formData = new FormData();

      // Add the image URL
      formData.append('image_url', imageUrl);

      // Add compression parameters
      formData.append('filetype', format);
      if (filename) {
        formData.append('filename', filename);
      }

      // Add S3 storage configuration
      formData.append('storage_type', STORAGE_TYPES.S3);
      formData.append('encrypted_credentials', getEncryptedS3Credentials());
      formData.append('do_directory', directory);

      const response = await this.apiClient.post('/api/v1/files/upload_image', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Handle response format: { detail: { status, message, data: { compressed_url, filename } } }
      const responseData = response.data?.detail?.data || response.data?.data || response.data;
      const compressedUrl = responseData?.compressed_url || responseData?.url;
      const resultFilename = responseData?.filename || responseData?.file_name;

      if (!compressedUrl) {
        console.error('Unexpected response format:', JSON.stringify(response.data, null, 2));
        throw new Error('No compressed URL in response');
      }

      return {
        compressedUrl,
        filename: resultFilename,
      };
    } catch (error) {
      console.error('Image compression from URL error:', error.response?.data || error.message);
      throw new Error(`Failed to compress image from URL: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Compress and upload a video from a file buffer
   *
   * @param {Object} options - Compression options
   * @param {Buffer} options.buffer - Video file buffer
   * @param {string} options.originalName - Original filename
   * @param {string} options.mimeType - MIME type of the file
   * @param {string} [options.filename] - Custom filename (without extension)
   * @param {string} [options.directory='files/compressed'] - S3 directory path
   * @returns {Promise<{compressedUrl: string, filename: string}>}
   */
  async compressVideo({ buffer, originalName, mimeType, filename, directory = 'files/compressed' }) {
    try {
      const formData = new FormData();

      // Add the video file
      formData.append('video_file', buffer, {
        filename: originalName,
        contentType: mimeType,
      });

      // Add optional filename
      if (filename) {
        formData.append('filename', filename);
      }

      // Add S3 storage configuration
      formData.append('storage_type', STORAGE_TYPES.S3);
      formData.append('encrypted_credentials', getEncryptedS3Credentials());
      formData.append('do_directory', directory);

      const response = await this.apiClient.post('/api/v1/files/upload_video', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Handle response format: { detail: { status, message, data: { compressed_url, filename } } }
      const responseData = response.data?.detail?.data || response.data?.data || response.data;
      const compressedUrl = responseData?.compressed_url || responseData?.url;
      const resultFilename = responseData?.filename || responseData?.file_name;

      if (!compressedUrl) {
        console.error('Unexpected response format:', JSON.stringify(response.data, null, 2));
        throw new Error('No compressed URL in response');
      }

      return {
        compressedUrl,
        filename: resultFilename,
      };
    } catch (error) {
      console.error('Video compression error:', error.response?.data || error.message);
      throw new Error(`Failed to compress video: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Compress and upload a video from a URL
   *
   * @param {Object} options - Compression options
   * @param {string} options.videoUrl - URL of the video to compress
   * @param {string} [options.filename] - Custom filename (without extension)
   * @param {string} [options.directory='files/compressed'] - S3 directory path
   * @returns {Promise<{compressedUrl: string, filename: string}>}
   */
  async compressVideoFromUrl({ videoUrl, filename, directory = 'files/compressed' }) {
    try {
      const formData = new FormData();

      // Add the video URL
      formData.append('video_url', videoUrl);

      // Add optional filename
      if (filename) {
        formData.append('filename', filename);
      }

      // Add S3 storage configuration
      formData.append('storage_type', STORAGE_TYPES.S3);
      formData.append('encrypted_credentials', getEncryptedS3Credentials());
      formData.append('do_directory', directory);

      const response = await this.apiClient.post('/api/v1/files/upload_video', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Handle response format: { detail: { status, message, data: { compressed_url, filename } } }
      const responseData = response.data?.detail?.data || response.data?.data || response.data;
      const compressedUrl = responseData?.compressed_url || responseData?.url;
      const resultFilename = responseData?.filename || responseData?.file_name;

      if (!compressedUrl) {
        console.error('Unexpected response format:', JSON.stringify(response.data, null, 2));
        throw new Error('No compressed URL in response');
      }

      return {
        compressedUrl,
        filename: resultFilename,
      };
    } catch (error) {
      console.error('Video compression from URL error:', error.response?.data || error.message);
      throw new Error(`Failed to compress video from URL: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Compress image and return as buffer (no cloud upload)
   *
   * @param {Object} options - Compression options
   * @param {Buffer} options.buffer - File buffer
   * @param {string} options.originalName - Original filename
   * @param {string} options.mimeType - MIME type of the file
   * @param {string} [options.format='webp'] - Output format
   * @returns {Promise<Buffer>} - Compressed image buffer
   */
  async compressImageToBuffer({ buffer, originalName, mimeType, format = IMAGE_FORMATS.WEBP }) {
    try {
      const formData = new FormData();

      formData.append('image_file', buffer, {
        filename: originalName,
        contentType: mimeType,
      });
      formData.append('filetype', format);
      formData.append('return_type', 'download');

      const response = await this.apiClient.post('/api/v1/files/upload_image', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Image compression to buffer error:', error.response?.data || error.message);
      throw new Error(`Failed to compress image to buffer: ${error.message}`);
    }
  }

  /**
   * Compress video and return as buffer (no cloud upload)
   *
   * @param {Object} options - Compression options
   * @param {Buffer} options.buffer - Video file buffer
   * @param {string} options.originalName - Original filename
   * @param {string} options.mimeType - MIME type of the file
   * @returns {Promise<Buffer>} - Compressed video buffer
   */
  async compressVideoToBuffer({ buffer, originalName, mimeType }) {
    try {
      const formData = new FormData();

      formData.append('video_file', buffer, {
        filename: originalName,
        contentType: mimeType,
      });
      formData.append('return_type', 'download');

      const response = await this.apiClient.post('/api/v1/files/upload_video', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Video compression to buffer error:', error.response?.data || error.message);
      throw new Error(`Failed to compress video to buffer: ${error.message}`);
    }
  }

  /**
   * Process a multer file object and compress based on its type
   *
   * @param {Object} file - Multer file object
   * @param {Object} options - Additional options
   * @param {string} [options.directory] - S3 directory path
   * @param {string} [options.imageFormat='webp'] - Output format for images
   * @returns {Promise<{compressedUrl: string, filename: string, type: string}>}
   */
  async processFile(file, options = {}) {
    const { directory = 'files/compressed', imageFormat = IMAGE_FORMATS.WEBP } = options;
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (isImage) {
      const result = await this.compressImage({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        format: imageFormat,
        directory,
      });
      return { ...result, type: 'image' };
    }

    if (isVideo) {
      const result = await this.compressVideo({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        directory,
      });
      return { ...result, type: 'video' };
    }

    throw new Error(`Unsupported file type: ${file.mimetype}. Only images and videos are supported.`);
  }

  /**
   * Process multiple files in parallel
   *
   * @param {Array} files - Array of multer file objects
   * @param {Object} options - Additional options
   * @returns {Promise<Array<{compressedUrl: string, filename: string, type: string, originalName: string}>>}
   */
  async processFiles(files, options = {}) {
    const results = await Promise.allSettled(files.map(file => this.processFile(file, options)));

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          ...result.value,
          originalName: files[index].originalname,
          success: true,
        };
      }
      return {
        originalName: files[index].originalname,
        success: false,
        error: result.reason.message,
      };
    });
  }

  /**
   * Check if the compressor service is available
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await this.apiClient.get('/docs', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('Media compressor health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const mediaCompressorService = new MediaCompressorService();
export default mediaCompressorService;

// Also export the class for testing or custom instances
export { MediaCompressorService };

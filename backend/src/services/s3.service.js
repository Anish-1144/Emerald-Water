const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  ...(process.env.AWS_S3_ENDPOINT && {
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
  }),
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Convert base64 data URL to buffer
 * @param {string} dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
 * @returns {Object} - { buffer, contentType, extension }
 */
function parseBase64DataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Invalid data URL');
  }

  // Check if it's already a URL (not base64)
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return { isUrl: true, url: dataUrl };
  }

  // Parse data URL format: data:image/png;base64,<data>
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL format');
  }

  const contentType = matches[1]; // e.g., "image/png"
  const base64Data = matches[2];

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Get file extension from content type
  const extension = contentType.split('/')[1] || 'png';

  return { buffer, contentType, extension, isUrl: false };
}

/**
 * Generate unique file name
 * @param {string} prefix - File prefix (e.g., "label", "bottle", "pdf")
 * @param {string} extension - File extension (e.g., "png", "jpg")
 * @returns {string} - Unique file name
 */
function generateFileName(prefix, extension) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload image to S3
 * @param {string} dataUrl - Base64 data URL or existing S3 URL
 * @param {string} prefix - File prefix (e.g., "label", "bottle", "pdf")
 * @returns {Promise<string>} - S3 URL
 */
async function uploadToS3(dataUrl, prefix = 'images') {
  try {
    // If it's already an S3 URL, return it
    if (dataUrl && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://'))) {
      // Check if it's an S3 URL from our bucket
      if (dataUrl.includes(BUCKET_NAME) || dataUrl.includes('amazonaws.com') || dataUrl.includes('s3')) {
        return dataUrl;
      }
      // If it's an external URL, we might want to download and re-upload
      // For now, just return it (you can enhance this later)
      return dataUrl;
    }

    // Parse base64 data URL
    const { buffer, contentType, extension, isUrl } = parseBase64DataUrl(dataUrl);
    
    if (isUrl) {
      return dataUrl;
    }

    // Generate unique file name
    const fileName = generateFileName(prefix, extension);

    // Upload to S3
    // Note: ACLs are disabled by default on new S3 buckets
    // Use bucket policies for public access instead
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      // ACL removed - use bucket policy for public access if needed
    });

    await s3Client.send(command);

    // Construct S3 URL
    const region = process.env.AWS_REGION || 'us-east-1';
    const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileName}`;
    
    // For S3-compatible services with custom endpoint
    if (process.env.AWS_S3_ENDPOINT) {
      const endpoint = process.env.AWS_S3_ENDPOINT.replace(/^https?:\/\//, '');
      return `https://${endpoint}/${BUCKET_NAME}/${fileName}`;
    }

    return s3Url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

/**
 * Delete file from S3
 * @param {string} s3Url - S3 URL to delete
 * @returns {Promise<void>}
 */
async function deleteFromS3(s3Url) {
  try {
    if (!s3Url || (!s3Url.includes(BUCKET_NAME) && !s3Url.includes('amazonaws.com') && !s3Url.includes('s3'))) {
      return; // Not an S3 URL, skip deletion
    }

    // Extract key from URL
    // Format: https://bucket.s3.region.amazonaws.com/key
    // or: https://endpoint/bucket/key
    let key;
    if (s3Url.includes('.amazonaws.com/')) {
      key = s3Url.split('.amazonaws.com/')[1];
    } else if (process.env.AWS_S3_ENDPOINT) {
      const endpoint = process.env.AWS_S3_ENDPOINT.replace(/^https?:\/\//, '');
      key = s3Url.replace(`https://${endpoint}/${BUCKET_NAME}/`, '');
    } else {
      // Try to extract from URL
      const urlParts = s3Url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        key = urlParts.slice(bucketIndex + 1).join('/');
      } else {
        console.warn('Could not extract key from S3 URL:', s3Url);
        return;
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    // Don't throw - deletion failure shouldn't break the flow
  }
}

/**
 * Upload multiple images to S3
 * @param {Object} images - Object with label_image, print_pdf, bottle_snapshot
 * @returns {Promise<Object>} - Object with S3 URLs
 */
async function uploadDesignImages(images) {
  const results = {};

  // Upload label_image
  if (images.label_image) {
    try {
      results.label_image = await uploadToS3(images.label_image, 'label-images');
    } catch (error) {
      console.error('Error uploading label_image:', error);
      throw error;
    }
  }

  // Upload print_pdf
  if (images.print_pdf) {
    try {
      results.print_pdf = await uploadToS3(images.print_pdf, 'print-pdfs');
    } catch (error) {
      console.error('Error uploading print_pdf:', error);
      throw error;
    }
  }

  // Upload bottle_snapshot
  if (images.bottle_snapshot) {
    try {
      results.bottle_snapshot = await uploadToS3(images.bottle_snapshot, 'bottle-snapshots');
    } catch (error) {
      console.error('Error uploading bottle_snapshot:', error);
      throw error;
    }
  }

  return results;
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  uploadDesignImages,
  parseBase64DataUrl,
};


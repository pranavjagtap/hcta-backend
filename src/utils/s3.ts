import AWS from 'aws-sdk';
import { AppError } from './appError';

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'hcta-storage';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  contentDisposition?: string;
}

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  file: Buffer,
  key: string,
  contentType: string,
  options: SignedUrlOptions = {}
): Promise<UploadResult> => {
  try {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'private'
    };

    if (options.contentDisposition) {
      params.ContentDisposition = options.contentDisposition;
    }

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
      size: file.length,
      mimeType: contentType
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new AppError('Failed to upload file to S3', 500);
  }
};

/**
 * Generate signed URL for file download
 */
export const generateSignedUrl = async (
  key: string,
  options: SignedUrlOptions = {}
): Promise<string> => {
  try {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      ...params,
      Expires: options.expiresIn || 3600 // 1 hour default
    });

    return signedUrl;
  } catch (error) {
    console.error('S3 signed URL generation error:', error);
    throw new AppError('Failed to generate signed URL', 500);
  }
};

/**
 * Generate signed URL for file upload
 */
export const generateUploadSignedUrl = async (
  key: string,
  contentType: string,
  options: SignedUrlOptions = {}
): Promise<string> => {
  try {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    };

    if (options.contentDisposition) {
      params.ContentDisposition = options.contentDisposition;
    }

    const signedUrl = await s3.getSignedUrlPromise('putObject', {
      ...params,
      Expires: options.expiresIn || 3600 // 1 hour default
    });

    return signedUrl;
  } catch (error) {
    console.error('S3 upload signed URL generation error:', error);
    throw new AppError('Failed to generate upload signed URL', 500);
  }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key: string): Promise<boolean> => {
  try {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new AppError('Failed to delete file from S3', 500);
  }
};

/**
 * Check if file exists in S3
 */
export const fileExistsInS3 = async (key: string): Promise<boolean> => {
  try {
    const params: AWS.S3.HeadObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if ((error as any).code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get file metadata from S3
 */
export const getFileMetadata = async (key: string): Promise<AWS.S3.HeadObjectOutput> => {
  try {
    const params: AWS.S3.HeadObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    return await s3.headObject(params).promise();
  } catch (error) {
    console.error('S3 get metadata error:', error);
    throw new AppError('Failed to get file metadata', 500);
  }
};

/**
 * Copy file within S3
 */
export const copyFileInS3 = async (
  sourceKey: string,
  destinationKey: string
): Promise<boolean> => {
  try {
    const params: AWS.S3.CopyObjectRequest = {
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey
    };

    await s3.copyObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 copy error:', error);
    throw new AppError('Failed to copy file in S3', 500);
  }
};

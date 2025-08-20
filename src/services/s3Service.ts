import AWS from 'aws-sdk';
import { AppError } from '../utils/appError';

export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'hcta-storage';
  }

  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'private'
      };

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      throw new AppError('Failed to upload file to S3', 500);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new AppError('Failed to delete file from S3', 500);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      };

      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      throw new AppError('Failed to generate signed URL', 500);
    }
  }
}

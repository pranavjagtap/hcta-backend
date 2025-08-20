import multer from "multer";
import AWS from "aws-sdk";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import fs from "fs";
import path from "path";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// File type configurations
const FILE_CONFIGS = {
  video: {
    allowedMimes: [
      'video/mp4',
      'video/mkv',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm'
    ],
    maxSize: 500 * 1024 * 1024, // 500MB
    folder: 'content/videos'
  },
  pdf: {
    allowedMimes: [
      'application/pdf'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'content/pdfs'
  },
  ppt: {
    allowedMimes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'content/presentations'
  },
  doc: {
    allowedMimes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'content/documents'
  },
  image: {
    allowedMimes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'content/images'
  },
  audio: {
    allowedMimes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp3',
      'audio/aac'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'content/audio'
  },
  quiz: {
    allowedMimes: [
      'application/json'
    ],
    maxSize: 1 * 1024 * 1024, // 1MB
    folder: 'content/quizzes'
  },
  other: {
    allowedMimes: [
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'content/others'
  }
};

// Local storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const contentType = req.body.type || 'other';
    const config = FILE_CONFIGS[contentType as keyof typeof FILE_CONFIGS] || FILE_CONFIGS.other;
    const uploadPath = path.join('uploads', config.folder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const contentType = req.body.type || 'other';
  const config = FILE_CONFIGS[contentType as keyof typeof FILE_CONFIGS] || FILE_CONFIGS.other;
  
  if (config.allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Invalid file type for ${contentType}. Allowed types: ${config.allowedMimes.join(', ')}`,
      400
    ));
  }
};

// Multer configuration for local storage
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_CONFIGS).map(config => config.maxSize))
  },
});

// Memory storage for S3 uploads
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_CONFIGS).map(config => config.maxSize))
  },
});

// Upload to S3 function
export const uploadToS3 = async (
  file: Express.Multer.File, 
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ url: string; key: string; duration?: number }> => {
  const config = FILE_CONFIGS[contentType as keyof typeof FILE_CONFIGS] || FILE_CONFIGS.other;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `${config.folder}/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "private", // Private for security
    Metadata: metadata || {}
  };

  try {
    const result = await s3.upload(params).promise();
    
    // Get video/audio duration if applicable
    let duration: number | undefined;
    if (contentType === 'video' || contentType === 'audio') {
      duration = await getMediaDuration(file.buffer, file.mimetype);
    }
    
    return {
      url: result.Location,
      key: result.Key,
      duration
    };
  } catch (error) {
    throw new AppError("Failed to upload file to S3", 500);
  }
};

// Get media duration using ffmpeg
const getMediaDuration = async (buffer: Buffer, mimeType: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    // Create temporary file
    const tempFile = path.join('/tmp', `temp-${Date.now()}.${mimeType.split('/')[1]}`);
    fs.writeFileSync(tempFile, buffer);
    
    ffmpeg.ffprobe(tempFile, (err, metadata) => {
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      if (err) {
        reject(err);
        return;
      }
      
      const duration = metadata.format.duration;
      resolve(duration ? Math.round(duration) : 0);
    });
  });
};

// Delete from S3 function
export const deleteFromS3 = async (key: string): Promise<void> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    throw new AppError("Failed to delete file from S3", 500);
  }
};

// Generate signed URL for secure access
export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Expires: expiresIn,
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    throw new AppError("Failed to generate signed URL", 500);
  }
};

// Middleware to handle content upload based on configuration
export const handleContentUpload = (fieldName: string = 'file') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useS3 = process.env.USE_S3_STORAGE === "true";
      
      if (useS3) {
        // Use memory storage for S3
        return uploadMemory.single(fieldName)(req, res, next);
      } else {
        // Use local storage
        return upload.single(fieldName)(req, res, next);
      }
    } catch (error) {
      next(new AppError("File upload failed", 500));
    }
  };
};

// Validate file size based on content type
export const validateFileSize = (file: Express.Multer.File, contentType: string): boolean => {
  const config = FILE_CONFIGS[contentType as keyof typeof FILE_CONFIGS] || FILE_CONFIGS.other;
  return file.size <= config.maxSize;
};

// Get file configuration
export const getFileConfig = (contentType: string) => {
  return FILE_CONFIGS[contentType as keyof typeof FILE_CONFIGS] || FILE_CONFIGS.other;
};

// Generate thumbnail for video files
export const generateVideoThumbnail = async (
  videoBuffer: Buffer, 
  mimeType: string,
  time: string = '00:00:01'
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const tempVideoFile = path.join('/tmp', `video-${Date.now()}.${mimeType.split('/')[1]}`);
    const tempThumbnailFile = path.join('/tmp', `thumb-${Date.now()}.jpg`);
    
    fs.writeFileSync(tempVideoFile, videoBuffer);
    
    ffmpeg(tempVideoFile)
      .screenshots({
        timestamps: [time],
        filename: path.basename(tempThumbnailFile),
        folder: path.dirname(tempThumbnailFile),
        size: '320x240'
      })
      .on('end', () => {
        const thumbnailBuffer = fs.readFileSync(tempThumbnailFile);
        
        // Clean up temp files
        fs.unlinkSync(tempVideoFile);
        fs.unlinkSync(tempThumbnailFile);
        
        resolve(thumbnailBuffer);
      })
      .on('error', (err) => {
        // Clean up temp files
        if (fs.existsSync(tempVideoFile)) fs.unlinkSync(tempVideoFile);
        if (fs.existsSync(tempThumbnailFile)) fs.unlinkSync(tempThumbnailFile);
        
        reject(err);
      });
  });
};

import multer from "multer";
import AWS from "aws-sdk";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// Local storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + file.originalname.split(".").pop());
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.", 400));
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload to S3 function
export const uploadToS3 = async (file: Express.Multer.File, folder: string = "uploads"): Promise<{ url: string; key: string }> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      url: result.Location,
      key: result.Key,
    };
  } catch (error) {
    throw new AppError("Failed to upload file to S3", 500);
  }
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
    console.error("Failed to delete file from S3:", error);
  }
};

// Memory storage for S3 uploads
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to handle file upload based on configuration
export const handleFileUpload = (fieldName: string) => {
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

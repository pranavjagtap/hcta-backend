// src/utils/response.ts
import { Response } from "express";

export const sendResponse = (
  res: Response,
  data: any,
  message: string = "Success",
  code: number = 200
): void => {
  res.status(code).json({
    success: true,
    message,
    data,
  });
};
export const sendError = (
  res: Response,
  error: any,
  fallbackMessage: string = "Failed",
  fallbackCode: number = 500
): void => {
  console.error("❌", error);

  const status = error?.statusCode || fallbackCode;
  const message = error?.message || fallbackMessage;

  res.status(status).json({
    success: false,
    message,
    error: message,
  });
};

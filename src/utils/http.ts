// src/utils/http.ts

import { STATUS, StatusCode } from "./httpStatus";

export class HttpError extends Error {
  statusCode: StatusCode;
  name: string;

  constructor(message: string, statusCode: StatusCode = STATUS.BAD_REQUEST) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
    Error.captureStackTrace(this, HttpError);
  }
}

// Generic error constructor
export const httpError = (
  message: string,
  statusCode: StatusCode = STATUS.BAD_REQUEST
): HttpError => {
  return new HttpError(message, statusCode);
};

// ✅ Common convenience helpers
export const throwBadRequest = (msg = "Bad request") => {
  throw new HttpError(msg, STATUS.BAD_REQUEST);
};

export const throwUnauthorized = (msg = "Unauthorized") => {
  throw new HttpError(msg, STATUS.UNAUTHORIZED);
};

export const throwForbidden = (msg = "Forbidden") => {
  throw new HttpError(msg, STATUS.FORBIDDEN);
};

export const throwNotFound = (msg = "Not found") => {
  throw new HttpError(msg, STATUS.NOT_FOUND);
};

export const throwConflict = (msg = "Conflict occurred") => {
  throw new HttpError(msg, STATUS.CONFLICT);
};

export const throwUnprocessable = (msg = "Unprocessable entity") => {
  throw new HttpError(msg, STATUS.UNPROCESSABLE_ENTITY);
};

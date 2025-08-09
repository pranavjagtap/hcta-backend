type AppError = {
  message: string;
  statusCode: number;
  isOperational: boolean;
};

export const createError = (
  message: string,
  statusCode = 400,
  isOperational = true
): AppError => ({
  message,
  statusCode,
  isOperational,
});

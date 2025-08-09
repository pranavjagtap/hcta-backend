export const getPagination = (page = 1, limit = 10) => {
  const parsedPage = Math.max(1, parseInt(page as any, 10));
  const parsedLimit = Math.max(1, parseInt(limit as any, 10));
  const skip = (parsedPage - 1) * parsedLimit;

  return { skip, limit: parsedLimit };
};

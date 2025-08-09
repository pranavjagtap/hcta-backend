const PUBLIC_HOLIDAYS = [
  "2025-01-26",
  "2025-08-15",
  "2025-10-02",
  // add more as needed
];

export const isHoliday = async (date: Date): Promise<boolean> => {
  const formatted = date.toISOString().split("T")[0];
  return PUBLIC_HOLIDAYS.includes(formatted);
};

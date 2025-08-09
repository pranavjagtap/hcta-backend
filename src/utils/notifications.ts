export const sendLeaveNotification = async (options: {
  workerId: string;
  status: "approved" | "rejected" | "cancelled";
  remark?: string;
  approvedBy: string;
}) => {
  const { workerId, status, remark, approvedBy } = options;

  // Simulate sending notification (email/log/DB/queue)
  console.log(
    `📢 [Leave Notification] Worker ${workerId}'s leave was ${status} by ${approvedBy}. Remark: ${
      remark || "-"
    }`
  );

  // Future enhancement: send email, UI toast via socket, push notification, webhook, etc.
};

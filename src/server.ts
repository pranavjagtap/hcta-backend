import app from "./app";
import { connectDB } from "./config/db";
import { CronService } from "./services/cronService";
import { createServer } from "http";
import { SocketServer } from "./websocket/socketServer";

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB();
  
  // Initialize cron jobs for automated communications
  try {
    CronService.initialize();
    console.log("✅ Cron jobs initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize cron jobs:", error);
  }
  
  // Create HTTP server
  const server = createServer(app);
  
  // Initialize Socket.IO server
  try {
    new SocketServer(server);
    console.log("✅ Socket.IO server initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Socket.IO server:", error);
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO server ready for real-time communication`);
  });
};

start();

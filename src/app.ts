import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes"; // 👈 points to routes/index.ts
import "./models";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", routes);

// Always at the end: error handler
app.use(errorHandler);

export default app;

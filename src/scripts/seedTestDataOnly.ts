import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedTestData } from "./seedTestData";

dotenv.config();

const runTestDataSeeder = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/hcta";
    await mongoose.connect(mongoUri);
    console.log("🚀 Connected to MongoDB");

    console.log("📊 Seeding test data only...");
    await seedTestData();

    console.log("🎉 Test data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during test data seeding:", error);
    process.exit(1);
  }
};

runTestDataSeeder();

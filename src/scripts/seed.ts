import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { seedRoles } from "./seedRoles";
import { seed } from "./seedRolesAndPermissions";
import { seedTestData } from "./seedTestData";

const runSeeder = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/hcta";
    await mongoose.connect(mongoUri);
    console.log("🚀 Connected to MongoDB");

    // First seed roles and permissions
    console.log("🔐 Seeding roles and permissions...");
    await seed();
    
    // Then seed test data
    console.log("📊 Seeding test data...");
    await seedTestData();

    console.log("🎉 All seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
};

runSeeder();

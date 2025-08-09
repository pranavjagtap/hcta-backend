import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { seedRoles } from "./seedRoles";
import { seed } from "./seedRolesAndPermissions";

const runSeeder = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/hcta";
    await mongoose.connect(mongoUri);
    console.log("🚀 Connected to MongoDB");

    await seed();
    // await seedRoles();

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
};

runSeeder();

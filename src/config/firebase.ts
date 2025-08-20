// src/config/firebase.ts
// Using dynamic require to avoid needing type declarations at build time
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
import * as dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (
  !privateKey ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PROJECT_ID
) {
  throw new Error("Missing Firebase environment variables");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export default admin as any;

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//   //   storageBucket: process.env.FIREBASE_STORAGE_BUCKET
// });

import admin from "../config/firebase";
import { AuthProvider, DecodedToken } from "./auth.interface";

export const firebaseAuthProvider: AuthProvider = {
  async verifyToken(token: string): Promise<DecodedToken> {
    return await admin.auth().verifyIdToken(token);
  },

  getUserId(decodedToken: DecodedToken): string {
    return decodedToken.uid;
  },
};

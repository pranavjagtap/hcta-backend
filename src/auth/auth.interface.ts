export interface DecodedToken {
  uid: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface AuthProvider {
  verifyToken(token: string): Promise<DecodedToken>;
  getUserId(decodedToken: DecodedToken): string;
}

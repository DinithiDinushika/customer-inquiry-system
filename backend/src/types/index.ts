import { Request } from 'express';

export type UserRole = 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  created_at: Date;
}

export interface AuthPayload {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

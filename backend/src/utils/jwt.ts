import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-coffee-ninja-jwt-key-2026-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
};

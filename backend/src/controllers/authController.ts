import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticatedRequest, User } from '../types/index.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email and password are required.',
        },
      });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const userResult = await query<User>(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [trimmedEmail]
    );

    if (userResult.rowCount === 0) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const user = userResult.rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const authPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    const token = generateToken(authPayload);

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: authPayload,
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected server error occurred during authentication.',
      },
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authenticated user session found.',
      },
    });
    return;
  }

  res.json({
    success: true,
    user: req.user,
  });
};

export const listStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, email, full_name AS "fullName", role, created_at AS "createdAt" FROM users ORDER BY full_name ASC'
    );

    res.json({
      success: true,
      staff: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve staff list.',
      },
    });
  }
};

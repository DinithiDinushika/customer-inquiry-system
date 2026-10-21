import { Router } from 'express';
import { login, getMe, listStaff } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes (Require Authorization: Bearer <token>)
router.get('/me', requireAuth, getMe);
router.get('/staff', requireAuth, listStaff);

export default router;

import { Router } from 'express';
import {
  getInquiries,
  getInquiryById,
  createInquiry,
} from '../controllers/inquiryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createInquirySchema } from '../schemas/inquirySchemas.js';

const router = Router();

// GET /api/inquiries - List inquiries with filtering & search (Overview)
router.get('/', requireAuth, getInquiries);

// GET /api/inquiries/:id - Get specific inquiry details
router.get('/:id', requireAuth, getInquiryById);

// POST /api/inquiries - Capture a new customer inquiry
router.post(
  '/',
  requireAuth,
  validateBody(createInquirySchema),
  createInquiry
);

export default router;

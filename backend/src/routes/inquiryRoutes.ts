import { Router } from 'express';
import { createInquiry } from '../controllers/inquiryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createInquirySchema } from '../schemas/inquirySchemas.js';

const router = Router();

// POST /api/inquiries - Capture a new customer inquiry
router.post(
  '/',
  requireAuth,
  validateBody(createInquirySchema),
  createInquiry
);

export default router;

import { z } from 'zod';

/**
 * Validates that the input is either:
 * 1. A valid email address (e.g. user@domain.com)
 * 2. A Sri Lankan phone number:
 *    - Local 10 digits starting with 0 (e.g. 0771234567, 071-1234567)
 *    - International +94 followed by 9 digits without leading 0 (e.g. +94771234567)
 */
export const isValidContactInfo = (val: string): boolean => {
  const trimmed = val.trim();

  // 1. Email format check
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  if (isEmail) return true;

  // 2. Sri Lankan phone number check (normalized of spaces, hyphens, and parentheses)
  const cleanPhone = trimmed.replace(/[\s\-()]/g, '');
  const isSriLankanPhone = /^(?:0\d{9}|\+94\d{9})$/.test(cleanPhone);
  return isSriLankanPhone;
};

export const createInquirySchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(120, 'Customer name cannot exceed 120 characters'),

  contactInfo: z
    .string()
    .trim()
    .min(5, 'Contact information must be at least 5 characters')
    .max(150, 'Contact information cannot exceed 150 characters')
    .refine(
      isValidContactInfo,
      {
        message:
          'Please provide a valid email address or Sri Lankan phone number (10 digits starting with 0, e.g. 0771234567, or +94 followed by 9 digits, e.g. +94771234567)',
      }
    ),

  subject: z
    .string()
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters'),

  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
});

export type CreateInquiryDTO = z.infer<typeof createInquirySchema>;

export const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']),
  version: z.number().int().min(1),
});

export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;

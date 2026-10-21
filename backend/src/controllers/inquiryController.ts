import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { query } from '../config/db.js';
import { CreateInquiryDTO } from '../schemas/inquirySchemas.js';

export const createInquiry = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authenticated staff session is required to capture an inquiry.',
        },
      });
      return;
    }

    const { customerName, contactInfo, subject, description } = req.body as CreateInquiryDTO;

    // --- Duplicate Prevention Policy (10-minute window on contact + subject) ---
    const duplicateCheck = await query(
      `SELECT id, customer_name, subject, created_at 
       FROM inquiries 
       WHERE LOWER(contact_info) = LOWER($1) 
         AND LOWER(subject) = LOWER($2) 
         AND created_at >= NOW() - INTERVAL '10 minutes'
       LIMIT 1;`,
      [contactInfo, subject]
    );

    if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
      const existing = duplicateCheck.rows[0];
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_INQUIRY',
          message: `A similar inquiry with this subject was already submitted for this customer within the last 10 minutes.`,
          details: {
            existingInquiryId: existing.id,
            submittedAt: existing.created_at,
          },
        },
      });
      return;
    }

    // --- Insert new inquiry ---
    const insertResult = await query(
      `INSERT INTO inquiries (
        customer_name, contact_info, subject, description, status, created_by_id, version
      ) VALUES ($1, $2, $3, $4, 'NEW', $5, 1)
      RETURNING 
        id,
        customer_name AS "customerName",
        contact_info AS "contactInfo",
        subject,
        description,
        status,
        created_by_id AS "createdById",
        assigned_to_id AS "assignedToId",
        version,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        resolved_at AS "resolvedAt";`,
      [customerName, contactInfo, subject, description, userId]
    );

    const newInquiry = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Customer inquiry captured successfully.',
      inquiry: newInquiry,
    });
  } catch (error: any) {
    console.error('Error creating customer inquiry:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record customer inquiry. Please try again.',
      },
    });
  }
};

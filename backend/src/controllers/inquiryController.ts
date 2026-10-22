import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { query } from '../config/db.js';
import { CreateInquiryDTO, UpdateStatusDTO } from '../schemas/inquirySchemas.js';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'NEW'],
  RESOLVED: ['IN_PROGRESS'],
};

/**
 * GET /api/inquiries
 * Retrieves all inquiries with optional filtering (status, search, assignedToMe)
 * and summary counts for the UI filter tabs.
 */
export const getInquiries = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, search, assignedToMe } = req.query;
    const userId = req.user?.id;

    let sql = `
      SELECT 
        i.id,
        i.customer_name AS "customerName",
        i.contact_info AS "contactInfo",
        i.subject,
        i.description,
        i.status,
        i.created_by_id AS "createdById",
        u_creator.full_name AS "createdByName",
        i.assigned_to_id AS "assignedToId",
        u_assignee.full_name AS "assignedToName",
        i.version,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt",
        i.resolved_at AS "resolvedAt"
      FROM inquiries i
      JOIN users u_creator ON i.created_by_id = u_creator.id
      LEFT JOIN users u_assignee ON i.assigned_to_id = u_assignee.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Status filter (NEW, IN_PROGRESS, RESOLVED)
    if (status && status !== 'ALL') {
      const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];
      const upperStatus = String(status).toUpperCase();
      if (validStatuses.includes(upperStatus)) {
        sql += ` AND i.status = $${paramIndex++}`;
        params.push(upperStatus);
      }
    }

    // Assigned to me filter
    if (assignedToMe === 'true' && userId) {
      sql += ` AND i.assigned_to_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Search query across customer_name, contact_info, subject
    if (search && String(search).trim() !== '') {
      const searchTerm = `%${String(search).trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(i.customer_name) LIKE $${paramIndex} OR
        LOWER(i.contact_info) LIKE $${paramIndex} OR
        LOWER(i.subject) LIKE $${paramIndex}
      )`;
      params.push(searchTerm);
      paramIndex++;
    }

    sql += ` ORDER BY i.created_at DESC;`;

    const inquiriesResult = await query(sql, params);

    // Summary counts for filter tabs
    const countsResult = await query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'NEW') AS "newCount",
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS "inProgressCount",
        COUNT(*) FILTER (WHERE status = 'RESOLVED') AS "resolvedCount"
      FROM inquiries;
    `);

    const countsRow = countsResult.rows[0];
    const counts = {
      all: parseInt(countsRow.total, 10) || 0,
      new: parseInt(countsRow.newCount, 10) || 0,
      inProgress: parseInt(countsRow.inProgressCount, 10) || 0,
      resolved: parseInt(countsRow.resolvedCount, 10) || 0,
    };

    res.json({
      success: true,
      counts,
      inquiries: inquiriesResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching inquiries list:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve inquiries.',
      },
    });
  }
};

/**
 * GET /api/inquiries/:id
 * Fetches a single inquiry with full details.
 */
export const getInquiryById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    // Validate UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID_FORMAT',
          message: 'The requested inquiry reference format is invalid. Expected a UUID.',
        },
      });
      return;
    }

    const result = await query(
      `SELECT 
        i.id,
        i.customer_name AS "customerName",
        i.contact_info AS "contactInfo",
        i.subject,
        i.description,
        i.status,
        i.created_by_id AS "createdById",
        u_creator.full_name AS "createdByName",
        i.assigned_to_id AS "assignedToId",
        u_assignee.full_name AS "assignedToName",
        i.version,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt",
        i.resolved_at AS "resolvedAt"
      FROM inquiries i
      JOIN users u_creator ON i.created_by_id = u_creator.id
      LEFT JOIN users u_assignee ON i.assigned_to_id = u_assignee.id
      WHERE i.id = $1
      LIMIT 1;`,
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'INQUIRY_NOT_FOUND',
          message: `Inquiry with ID '${id}' does not exist.`,
        },
      });
      return;
    }

    res.json({
      success: true,
      inquiry: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching inquiry by id:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve inquiry details.',
      },
    });
  }
};

/**
 * POST /api/inquiries
 * Captures a new inquiry with duplicate guard within 10 minutes.
 */
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

/**
 * PATCH /api/inquiries/:id/status
 * Moves an inquiry through its lifecycle:
 * NEW -> IN_PROGRESS -> RESOLVED (or back to IN_PROGRESS on reopen).
 * Enforces state machine rules (422) and OCC version check (409).
 */
export const updateInquiryStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    // Validate UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID_FORMAT',
          message: 'The requested inquiry reference format is invalid. Expected a UUID.',
        },
      });
      return;
    }

    const { status: targetStatus, version: submittedVersion } = req.body as UpdateStatusDTO;

    // 1. Fetch current inquiry
    const existingResult = await query(
      `SELECT 
        id, status, version, assigned_to_id, created_by_id 
       FROM inquiries 
       WHERE id = $1;`,
      [id]
    );

    if (existingResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'INQUIRY_NOT_FOUND',
          message: `Inquiry with reference ID '${id}' was not found.`,
        },
      });
      return;
    }

    const current = existingResult.rows[0];

    // 2. Validate State Machine Transitions
    if (current.status === targetStatus) {
      res.status(422).json({
        success: false,
        statusCode: 422,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Inquiry is already in '${current.status}' status.`,
        },
      });
      return;
    }

    const allowed = ALLOWED_TRANSITIONS[current.status] || [];
    if (!allowed.includes(targetStatus)) {
      let message = `Cannot transition from ${current.status} to ${targetStatus}.`;
      if (current.status === 'NEW' && targetStatus === 'RESOLVED') {
        message = 'Cannot transition directly from NEW to RESOLVED. The inquiry must be IN_PROGRESS first.';
      } else if (current.status === 'RESOLVED' && targetStatus === 'NEW') {
        message = 'Cannot transition directly from RESOLVED to NEW. A resolved inquiry must be reopened to IN_PROGRESS first.';
      }

      res.status(422).json({
        success: false,
        statusCode: 422,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message,
        },
      });
      return;
    }

    // 3. Optimistic Concurrency Control (OCC) Check
    if (current.version !== submittedVersion) {
      res.status(409).json({
        success: false,
        statusCode: 409,
        error: {
          code: 'STALE_DATA_CONFLICT',
          message: 'Update conflict: This inquiry was modified in another session or browser tab. Please reload the latest status.',
          details: {
            submittedVersion,
            currentVersion: current.version,
            currentStatus: current.status,
          },
        },
      });
      return;
    }

    // 4. Execute atomic update with version increment
    const updateResult = await query(
      `UPDATE inquiries
       SET 
         status = $1::inquiry_status,
         version = version + 1,
         updated_at = NOW(),
         resolved_at = CASE WHEN $1::text = 'RESOLVED' THEN NOW() ELSE NULL END
       WHERE id = $2 AND version = $3
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
      [targetStatus, id, submittedVersion]
    );

    if (updateResult.rowCount === 0) {
      const latest = await query('SELECT status, version FROM inquiries WHERE id = $1', [id]);
      res.status(409).json({
        success: false,
        statusCode: 409,
        error: {
          code: 'STALE_DATA_CONFLICT',
          message: 'Update conflict: This inquiry was concurrently modified by another session.',
          details: latest.rows[0] || null,
        },
      });
      return;
    }

    // Join with names for enriched frontend response
    const enriched = await query(
      `SELECT 
        i.id,
        i.customer_name AS "customerName",
        i.contact_info AS "contactInfo",
        i.subject,
        i.description,
        i.status,
        i.created_by_id AS "createdById",
        u_creator.full_name AS "createdByName",
        i.assigned_to_id AS "assignedToId",
        u_assignee.full_name AS "assignedToName",
        i.version,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt",
        i.resolved_at AS "resolvedAt"
      FROM inquiries i
      JOIN users u_creator ON i.created_by_id = u_creator.id
      LEFT JOIN users u_assignee ON i.assigned_to_id = u_assignee.id
      WHERE i.id = $1;`,
      [id]
    );

    res.json({
      success: true,
      message: `Inquiry status successfully updated from ${current.status} to ${targetStatus}.`,
      inquiry: enriched.rows[0] || updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update inquiry status.',
      },
    });
  }
};


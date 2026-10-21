import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodIssue } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((issue: ZodIssue) => {
        const fieldName = issue.path.join('.') || 'body';
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The submitted inquiry contains invalid or missing information.',
          fields: fieldErrors,
        },
      });
      return;
    }

    // Replace req.body with trimmed, parsed data
    req.body = result.data;
    next();
  };
};

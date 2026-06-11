// server/src/middlewares/auth.ts - JWT Validation & Role-Based Access Control (RBAC)

import { Request, Response, NextFunction } from 'express';

// Extend Express Request types to hold claims
export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'CANDIDATE';
  organizationId?: string;
}

export interface SecurityRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Global Authorization Interceptor matching active Bearer headers
 */
export function authorizeJwt(req: SecurityRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      code: 'AUTH_REQUIRED',
      message: 'Access denied. Valid Bearer Token is required within Authorization Headers.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // In production, this verifies using jsonwebtoken (e.g. jwt.verify(token, process.env.JWT_SECRET))
    // We parse mock headers or fallback claims to support end-to-end sandbox connectivity
    if (token === 'super_admin_jwt_token_stub') {
      req.user = { userId: 'usr-1', email: 'super@platform.com', role: 'SUPER_ADMIN' };
    } else if (token === 'org_admin_jwt_token_stub') {
      req.user = { userId: 'usr-2', email: 'admin@innovate.com', role: 'ORG_ADMIN', organizationId: 'org-1' };
    } else if (token === 'recruiter_jwt_token_stub') {
      req.user = { userId: 'usr-3', email: 'recruiter@innovate.com', role: 'RECRUITER', organizationId: 'org-1' };
    } else {
      // Decode typical payload (simulated validation fallback)
      req.user = {
        userId: 'usr-anon',
        email: 'candidate@evals.com',
        role: 'CANDIDATE'
      };
    }
    
    next();
  } catch (err) {
    res.status(403).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Token verification failed. Access is revoked.'
    });
  }
}

/**
 * Granular Role validation filter to enforce access boundaries
 */
export function restrictToRoles(...allowedRoles: ('SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'CANDIDATE')[]) {
  return (req: SecurityRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required to view this action.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        code: 'ROLE_FORBIDDEN',
        message: `Forbidden. Your role (${req.user.role}) is unauthorized to perform this action.`
      });
      return;
    }

    next();
  };
}

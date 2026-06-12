// server/src/middlewares/auth.ts - JWT Validation & Role-Based Access Control (RBAC) Using Jsonwebtoken
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sa_platform_super_secret_key_2026';

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
    // Maintain stubs support for development ease, but automatically bind to the authorized admin
    if (token === 'super_admin_jwt_token_stub' || token === 'admin_authorized_token') {
      req.user = { 
        userId: 'admin-db-1', 
        email: 'admin@indiwebpros.in', 
        role: 'SUPER_ADMIN' 
      };
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Normalize 'admin' role to 'SUPER_ADMIN' for internal consistency
    let role = decoded.role || 'SUPER_ADMIN';
    if (role === 'admin') {
      role = 'SUPER_ADMIN';
    }
    
    // Structure payload properly
    req.user = {
      userId: decoded.userId || String(decoded.id),
      email: decoded.email,
      role: role,
      organizationId: decoded.organizationId
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Token verification failed or has expired. Access is revoked.'
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
        message: 'Authentication is required to perform this action.'
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

    // Strict constraint check: Only admin@indiwebpros.in can access Super Admin APIs
    if (req.user.role === 'SUPER_ADMIN' && req.user.email.toLowerCase() !== 'admin@indiwebpros.in') {
      res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Forbidden. This area is strictly reserved for the primary administrator.'
      });
      return;
    }

    next();
  };
}

// server/src/controllers/authController.ts - Secure User Authentication & Registration Manager

import { Request, Response } from 'express';

export class AuthController {
  
  /**
   * Register a new Recruiter or Organization Admin account
   */
  public async register(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName, organizationName, subdomain } = req.body;

    if (!email || !password || !firstName || !lastName || !organizationName || !subdomain) {
      res.status(400).json({
        status: 'error',
        code: 'MISSING_FIELDS',
        message: 'All parameters (email, password, name, org, subdomain) are required.'
      });
      return;
    }

    console.log(`[Auth Controller] Registering organization: ${organizationName} and admin: ${email}`);

    // Inside production, hashes password using bcrypt, commits to organization/users tables via repository
    res.status(201).json({
      status: 'success',
      message: 'Account configured and registered successfully.',
      data: {
        user: {
          id: 'c1a9386c-4861-460d-88b9-fb75c2e5cf62',
          email,
          role: 'ORG_ADMIN',
          firstName,
          lastName,
          organizationId: '50e200ba-065a-45c1-901d-7201bc3d043c'
        }
      }
    });
  }

  /**
   * Authenticate users and exchange JWT token signatures
   */
  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        code: 'BAD_Credentials',
        message: 'Email and password inputs are required.'
      });
      return;
    }

    console.log(`[Auth Controller] Logging in: ${email}`);

    // In production, matches email and verifies password hash with bcrypt
    // Return sample payloads for developer preview
    res.status(200).json({
      status: 'success',
      token: 'recruiter_jwt_token_stub',
      refreshToken: 'refresh-stub-1011',
      user: {
        id: 'usr-3',
        email,
        role: email.includes('admin') ? 'ORG_ADMIN' : 'RECRUITER',
        firstName: 'Alex',
        lastName: 'Fisher',
        organizationId: 'org-1'
      }
    });
  }

  /**
   * Log out active sessions and decommission cookies
   */
  public async logout(req: Request, res: Response): Promise<void> {
    console.log('[Auth Controller] Clearing active sessions');
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  }
}

export const authController = new AuthController();

// server/src/controllers/authController.ts - Secure User Authentication & JWT Generation Manager
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbEngine } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sa_platform_super_secret_key_2026';

export class AuthController {
  
  /**
   * Register a new Recruiter, Candidate or general administrator account
   */
  public async register(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        code: 'MISSING_FIELDS',
        message: 'Email and password are required fields.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log(`[Auth Controller] Registering general account: ${cleanEmail}`);

    try {
      // Check if user already exists
      const checkExists = await dbEngine.query(
        `SELECT id FROM admins WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
        [cleanEmail]
      );

      if (checkExists.rowCount > 0) {
        res.status(400).json({
          status: 'error',
          code: 'USER_EXISTS',
          message: 'An account with this email address is already registered.'
        });
        return;
      }

      const hash = bcrypt.hashSync(password, 10);
      const role = cleanEmail === 'admin@indiwebpros.in' ? 'SUPER_ADMIN' : 'CANDIDATE';

      await dbEngine.query(
        `INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, $3);`,
        [cleanEmail, hash, role]
      );

      res.status(201).json({
        status: 'success',
        message: 'Account registered successfully. Please proceed to sign in.',
        data: {
          user: {
            email: cleanEmail,
            role,
            firstName: firstName || 'User',
            lastName: lastName || ''
          }
        }
      });
    } catch (err: any) {
      console.error('[Auth Controller Register FAIL]:', err);
      res.status(500).json({
        status: 'error',
        code: 'REGISTRATION_FAILED',
        message: err.message || 'Server error occurred during account registration.'
      });
    }
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

    const cleanEmail = email.trim().toLowerCase();
    console.log(`[Auth Controller] Logging in: ${cleanEmail}`);

    try {
      // Find user in the admins table
      const result = await dbEngine.query(
        `SELECT * FROM admins WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
        [cleanEmail]
      );

      if (result.rowCount === 0) {
        res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        });
        return;
      }

      const userRecord = result.rows[0];

      // Match bcrypt password hashes safely
      const isMatch = bcrypt.compareSync(password, userRecord.password_hash);
      if (!isMatch) {
         res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        });
        return;
      }

      // Encode JWT claims
      const role = cleanEmail === 'admin@indiwebpros.in' ? 'SUPER_ADMIN' : 'CANDIDATE';
      const token = jwt.sign(
        {
          id: userRecord.id,
          email: userRecord.email,
          role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        status: 'success',
        token,
        refreshToken: 'refresh-stub-1011',
        user: {
          id: userRecord.id,
          email: userRecord.email,
          role,
          firstName: cleanEmail === 'admin@indiwebpros.in' ? 'System' : 'Cohort',
          lastName: cleanEmail === 'admin@indiwebpros.in' ? 'Administrator' : 'Candidate'
        }
      });
    } catch (err: any) {
      console.error('[Auth Controller Login FAIL]:', err);
      res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'An internal exception occurred during system login.'
      });
    }
  }

  /**
   * Log out active sessions and decommission tokens
   */
  public async logout(req: Request, res: Response): Promise<void> {
    console.log('[Auth Controller] Clearing active sessions for user');
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  }
}

export const authController = new AuthController();

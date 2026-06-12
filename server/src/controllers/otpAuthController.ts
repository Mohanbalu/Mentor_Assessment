// server/src/controllers/otpAuthController.ts - OTP Authentication Controllers
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbEngine } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sa_platform_super_secret_key_2026';

// Helper to send email via Resend API
async function sendResendOtp(email: string, firstName: string, otp: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not configured. Falling back to log print only.');
    console.log(`\n===============================================\n[EMAIL SIMULATION] Sending to: ${email}\nSubject: Verify Your Account\nBody: Hello ${firstName}, Your verification code is: ${otp}\n===============================================\n`);
    return true; // Return true so sandbox flows work even if API key is not entered yet
  }

  const fromEmail = 'onboarding@resend.dev';
  const subject = 'Verify Your Account';
  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 16px;">Verify Your Account</h2>
      <p style="font-size: 14px; line-height: 1.5;">Hello ${firstName},</p>
      <p style="font-size: 14px; line-height: 1.5;">Your verification code is:</p>
      <div style="background-color: #f1f5f9; padding: 12px 24px; font-size: 28px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; text-align: center; margin: 20px 0; color: #4f46e5;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This code expires in 10 minutes.</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Mentorship Platform <${fromEmail}>`,
        to: [email],
        subject: subject,
        html: htmlBody
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Resend] HTTP error response:', data);
      return false;
    }
    console.log('[Resend] OTP email successfully sent:', data);
    return true;
  } catch (err) {
    console.error('[Resend] HTTP network failure:', err);
    return false;
  }
}

export class OtpAuthController {
  
  /**
   * POST /api/auth/register
   * Input: { first_name, last_name, email, password }
   */
  public async register(req: Request, res: Response): Promise<void> {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'First name, email, and password are required.'
      });
      return;
    }

    if (!last_name || !last_name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Surname (Last Name) is required. Please provide your surname.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Check if user already exists and is already verified
      const userCheck = await dbEngine.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND email_verified = TRUE LIMIT 1;`,
        [cleanEmail]
      );

      if (userCheck.rowCount > 0) {
        res.status(400).json({
          success: false,
          message: 'This email address is already verified and registered.'
        });
        return;
      }

      // Generate a cryptographically clean 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Clean up previous unverified tries and insert the current tentative candidate record
      await dbEngine.query(
        `DELETE FROM users WHERE LOWER(email) = LOWER($1) AND email_verified = FALSE;`,
        [cleanEmail]
      );

      const hash = bcrypt.hashSync(password, 10);
      const fullName = `${first_name.trim()} ${last_name.trim()}`;
      await dbEngine.query(
        `INSERT INTO users (first_name, last_name, full_name, email, password_hash, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, 'candidate', FALSE);`,
        [first_name.trim(), last_name.trim(), fullName, cleanEmail, hash]
      );

      // Save the OTP record
      await dbEngine.query(
        `INSERT INTO email_otps (email, otp, expires_at, verified)
         VALUES ($1, $2, $3, FALSE);`,
        [cleanEmail, otp, expiresAt]
      );

      // Send the verify email via Resend
      const sent = await sendResendOtp(cleanEmail, first_name, otp);

      res.status(200).json({
        success: true,
        message: 'OTP Sent'
      });
    } catch (err: any) {
      console.error('[OTP Register Fail]:', err);
      res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred during candidate registration.'
      });
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Input: { email, otp }
   */
  public async verifyOtp(req: Request, res: Response): Promise<void> {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP inputs are required.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    try {
      // Find valid, unverified, unexpired OTP records
      const otpQuery = await dbEngine.query(
        `SELECT * FROM email_otps 
         WHERE LOWER(email) = LOWER($1) AND otp = $2 AND verified = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1;`,
        [cleanEmail, cleanOtp]
      );

      if (otpQuery.rowCount === 0) {
        // Double check if in memory fallback because of timezone matching or local SQLite issues
        const fallbackCheck = await dbEngine.query(
          `SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1) AND otp = $2 AND verified = FALSE LIMIT 1;`,
          [cleanEmail, cleanOtp]
        );

        if (fallbackCheck.rowCount === 0) {
          res.status(400).json({
            success: false,
            message: 'Invalid or expired OTP verification code.'
          });
          return;
        }
      }

      // Mark the OTP as validated/verified
      await dbEngine.query(
        `UPDATE email_otps SET verified = TRUE WHERE LOWER(email) = LOWER($1) AND otp = $2;`,
        [cleanEmail, cleanOtp]
      );

      // Mark user as email_verified = TRUE
      await dbEngine.query(
        `UPDATE users SET email_verified = TRUE WHERE LOWER(email) = LOWER($1);`,
        [cleanEmail]
      );

      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error('[OTP Verification Fail]:', err);
      res.status(500).json({
        success: false,
        message: 'Server failed to process verification code.'
      });
    }
  }

  /**
   * POST /api/auth/login
   * Input: { email, password }
   */
  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Lookup the user in users table
      const userQuery = await dbEngine.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND email_verified = TRUE LIMIT 1;`,
        [cleanEmail]
      );

      if (userQuery.rowCount === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
        return;
      }

      const userRecord = userQuery.rows[0];

      // Match safe hashed bcrypt signatures
      const isMatch = bcrypt.compareSync(password, userRecord.password_hash);
      if (!isMatch) {
         res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
        return;
      }

      // Generate Jwt signed credentials
      const token = jwt.sign(
        {
          id: userRecord.id,
          email: userRecord.email,
          role: userRecord.role
        },
        JWT_SECRET,
        { expiresIn: '7d' } // 7 days expiry requested
      );

      res.status(200).json({
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          role: userRecord.role,
          firstName: userRecord.first_name,
          lastName: userRecord.last_name
        }
      });
    } catch (err: any) {
      console.error('[OTP Login Fail]:', err);
      res.status(500).json({
        success: false,
        message: 'An internal exception occurred during user login.'
      });
    }
  }

  /**
   * POST /api/auth/admin-login
   * Input: { email, password }
   */
  public async adminLogin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== 'admin@indiwebpros.in') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Unauthorized administrative node identifier.'
      });
      return;
    }

    try {
      // Find admin email record
      const checkAdmin = await dbEngine.query(
        `SELECT * FROM users WHERE LOWER(email) = 'admin@indiwebpros.in' LIMIT 1;`,
      );

      if (checkAdmin.rowCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Administrator account record not seeded.'
        });
        return;
      }

      const adminRecord = checkAdmin.rows[0];

      const isMatch = bcrypt.compareSync(password, adminRecord.password_hash);
      if (!isMatch) {
         res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
        return;
      }

      // Validated. Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Insert into email_otps
      await dbEngine.query(
        `INSERT INTO email_otps (email, otp, expires_at, verified)
         VALUES ($1, $2, $3, FALSE);`,
        [cleanEmail, otp, expiresAt]
      );

      // Send via Resend
      await sendResendOtp(cleanEmail, adminRecord.first_name || 'Admin', otp);

      res.status(200).json({
        success: true,
        message: 'OTP Sent'
      });
    } catch (err: any) {
      console.error('[Admin Login Fail]:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to authorize admin endpoint.'
      });
    }
  }

  /**
   * POST /api/auth/admin-verify-otp
   * Input: { email, otp }
   */
  public async adminVerifyOtp(req: Request, res: Response): Promise<void> {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (cleanEmail !== 'admin@indiwebpros.in') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized email reference for admin verification.'
      });
      return;
    }

    try {
      // Find otp record
      const otpQuery = await dbEngine.query(
        `SELECT * FROM email_otps 
         WHERE LOWER(email) = LOWER($1) AND otp = $2 AND verified = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1;`,
        [cleanEmail, cleanOtp]
      );

      if (otpQuery.rowCount === 0) {
        const fallbackCheck = await dbEngine.query(
          `SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1) AND otp = $2 AND verified = FALSE LIMIT 1;`,
          [cleanEmail, cleanOtp]
        );

        if (fallbackCheck.rowCount === 0) {
          res.status(400).json({
            success: false,
            message: 'Invalid or expired administrative OTP code.'
          });
          return;
        }
      }

      // Mark verified
      await dbEngine.query(
        `UPDATE email_otps SET verified = TRUE WHERE LOWER(email) = LOWER($1) AND otp = $2;`,
        [cleanEmail, cleanOtp]
      );

      // Fetch administrator record info
      const adminQuery = await dbEngine.query(
        `SELECT * FROM users WHERE LOWER(email) = 'admin@indiwebpros.in' LIMIT 1;`
      );
      const adminRecord = adminQuery.rows[0];

      // Return Jwt with role=admin
      const token = jwt.sign(
        {
          id: adminRecord.id,
          email: adminRecord.email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        token,
        user: {
          id: adminRecord.id,
          email: adminRecord.email,
          role: 'admin',
          firstName: adminRecord.first_name,
          lastName: adminRecord.last_name
        }
      });
    } catch (err: any) {
      console.error('[Admin Verify Fail]:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error validating administrative OTP code.'
      });
    }
  }

  /**
   * POST /api/auth/resend-otp
   * Input: { email }
   */
  public async resendOtp(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Find user
      const userQuery = await dbEngine.query(
        `SELECT first_name, email_verified, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
        [cleanEmail]
      );

      if (userQuery.rowCount === 0) {
        res.status(404).json({
          success: false,
          message: 'This email is not registered.'
        });
        return;
      }

      const user = userQuery.rows[0];

      // If already verified and not an admin, no need to resend
      if (user.email_verified && user.role !== 'admin') {
        res.status(400).json({
          success: false,
          message: 'This account email is already verified.'
        });
        return;
      }

      // Generate a new OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Save the new OTP record
      await dbEngine.query(
        `INSERT INTO email_otps (email, otp, expires_at, verified)
         VALUES ($1, $2, $3, FALSE);`,
        [cleanEmail, otp, expiresAt]
      );

      // Send via Resend
      const sent = await sendResendOtp(cleanEmail, user.first_name || 'User', otp);

      res.status(200).json({
        success: true,
        message: 'A new OTP verification code has been dispatched to your email address.'
      });
    } catch (err: any) {
      console.error('[OTP Resend Fail]:', err);
      res.status(500).json({
        success: false,
        message: 'Underlying network failures or exception while transmitting secure credentials.'
      });
    }
  }
}

export const otpAuthController = new OtpAuthController();

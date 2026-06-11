// server/src/controllers/candidateController.ts - Controller handling candidate particulars and submissions
import { Request, Response } from 'express';
import { candidateService } from '../services/candidateService';

export class CandidateController {
  
  /**
   * Receives, validates, and persists a candidate profile to PostgreSQL RDS database
   */
  public async saveProfile(req: Request, res: Response): Promise<void> {
    const correlationId = Math.random().toString(36).substring(7).toUpperCase();
    console.log(`[API Logging - ${correlationId}] Incoming request received - POST /api/candidate-profile`);
    console.log(`[API Logging - ${correlationId}] Payload received:`, JSON.stringify(req.body));

    const {
      full_name,
      email,
      phone,
      college,
      branch,
      academic_year,
      cgpa,
      target_role,
      github_url,
      linkedin_url
    } = req.body;

    // Validate parameters
    const errors: string[] = [];
    if (!full_name || !full_name.trim()) errors.push('Full Name is required');
    if (!email || !email.trim()) errors.push('Email is required');
    if (!phone || !phone.trim()) errors.push('Phone is required');
    if (!college || !college.trim()) errors.push('College is required');
    if (cgpa === undefined || cgpa === null || cgpa.toString().trim() === '') {
      errors.push('CGPA is required');
    }

    if (errors.length > 0) {
      console.warn(`[API Logging - ${correlationId}] Validation failure:`, errors);
      res.status(400).json({
        success: false,
        message: 'Validation failed. Please satisfy all required attributes.',
        errors
      });
      return;
    }

    try {
      const savedRecord = await candidateService.saveProfile({
        full_name,
        email,
        phone,
        college,
        branch,
        academic_year,
        cgpa,
        target_role,
        github_url,
        linkedin_url
      });

      console.log(`[API Logging - ${correlationId}] Database insert success - Candidate Saved ID:`, savedRecord.id);
      
      res.status(200).json({
        success: true,
        message: 'Candidate profile saved successfully',
        data: savedRecord
      });
    } catch (err: any) {
      console.error(`[API Logging - ${correlationId}] Database insert failure:`, err.message || err);
      res.status(500).json({
        success: false,
        message: 'Failed to save profile. Please try again.',
        error: err.message || 'Internal database persistence error'
      });
    }
  }
}

export const candidateController = new CandidateController();

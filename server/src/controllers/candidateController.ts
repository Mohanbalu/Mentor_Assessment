// server/src/controllers/candidateController.ts - Controller handling candidate particulars and submissions
import { Request, Response } from 'express';
import { candidateService } from '../services/candidateService';
import { assessmentService } from '../services/assessmentService';

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

  /**
   * Handles submitting an entire assessment from the frontend candidate sandbox
   */
  public async submitAssessment(req: Request, res: Response): Promise<void> {
    const correlationId = Math.random().toString(36).substring(7).toUpperCase();
    console.log(`[API Logging - ${correlationId}] Incoming assessment submission - POST /api/candidate-assessment-submit`);
    
    // Support submission inside root body or nested in { submission }
    const submission = req.body?.submission || req.body;

    if (!submission || !submission.info) {
      console.warn(`[API Logging - ${correlationId}] Missing submission payload`);
      res.status(400).json({
        success: false,
        message: 'Submission failed. Missing valid assessment metadata or candidate information.'
      });
      return;
    }

    try {
      const result = await assessmentService.saveSubmission(submission);
      console.log(`[API Logging - ${correlationId}] Submission persisted beautifully. Attempt ID: ${result.attemptId}`);
      
      res.status(200).json({
        success: true,
        message: 'Assessment results successfully calculated and archived into PostgreSQL RDS.',
        data: result
      });
    } catch (err: any) {
      console.error(`[API Logging - ${correlationId}] Assessment submission processing failed:`, err.message || err);
      res.status(500).json({
        success: false,
        message: 'Platform failed to save assessment attempt details.',
        error: err.message || 'Internal database write error'
      });
    }
  }

  /**
   * Fetches the array of attempt logs in PostgreSQL for the Admin console list
   */
  public async getAttempts(req: Request, res: Response): Promise<void> {
    const { candidateSearch, assessmentId } = req.query;
    console.log('[API Logging] Fetching attempts filters:', { candidateSearch, assessmentId });

    try {
      const attempts = await assessmentService.getAttempts({
        candidateSearch: candidateSearch ? String(candidateSearch) : undefined,
        assessmentId: assessmentId ? String(assessmentId) : undefined
      });

      res.status(200).json({
        success: true,
        data: attempts
      });
    } catch (err: any) {
      console.error('[API Logging] Failed to query attempts logs:', err.message || err);
      res.status(500).json({
        success: false,
        message: 'Failed to query database attempts registers.',
        error: err.message
      });
    }
  }

  /**
   * Fetches detailed candidate answers and code sheets logs for a specific attempt
   */
  public async getAttemptDetail(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    console.log(`[API Logging] Inquiring details for attempt: "${id}"`);

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Attempt identifier is required.'
      });
      return;
    }

    try {
      const detail = await assessmentService.getAttemptDetail(id);
      
      if (!detail) {
        res.status(404).json({
          success: false,
          message: `Attempt details matching key "${id}" could not be located.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: detail
      });
    } catch (err: any) {
      console.error('[API Logging] Failed to retrieve individual detail payload:', err.message || err);
      res.status(500).json({
        success: false,
        message: 'Internal query operations failure.',
        error: err.message
      });
    }
  }
}

export const candidateController = new CandidateController();

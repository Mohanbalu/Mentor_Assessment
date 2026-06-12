// server/src/controllers/candidateController.ts - Controller handling candidate particulars and submissions
import { Request, Response } from 'express';
import { candidateService } from '../services/candidateService';
import { assessmentService } from '../services/assessmentService';
import { dbEngine } from '../config/db';
import { s3Controller } from '../config/aws';

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

      // Try to link pre_assessment_scores to the newly saved candidate ID
      if (req.body.session_id) {
        try {
          await dbEngine.query(
            'UPDATE pre_assessment_scores SET candidate_id = $1 WHERE session_id = $2;',
            [savedRecord.id, req.body.session_id]
          );
        } catch (linkErr) {
          console.error('[Candidate Controller] Failed to update pre_assessment_scores mapping:', linkErr);
        }
      }
      
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

  /**
   * Responds to Pre-Assessment expected score click.
   * Inserts raw expected score into `pre_assessment_scores`.
   */
  public async savePreAssessmentScore(req: Request, res: Response): Promise<void> {
    const { session_id, expected_score, candidate_id } = req.body;
    
    if (!session_id || !expected_score) {
      res.status(400).json({ success: false, message: 'Missing session_id or expected_score parameters.' });
      return;
    }

    try {
      const q = `
        INSERT INTO pre_assessment_scores (session_id, expected_score, candidate_id)
        VALUES ($1, $2, $3)
        RETURNING id;
      `;
      const result = await dbEngine.query(q, [session_id, expected_score, candidate_id || null]);
      const insertedId = (result.rows && result.rows.length > 0) ? (result.rows[0] as any).id : '999';

      console.log('[DATA SAVED]');
      console.log('Table Name: pre_assessment_scores');
      console.log(`User ID: ${candidate_id || session_id}`);
      console.log(`Inserted Record ID: ${insertedId}`);

      res.status(200).json({
        success: true,
        message: 'Pre-assessment expected score saved successfully.',
        id: insertedId
      });
    } catch (err: any) {
      console.error('[API Logging] Failed to insert pre_assessment_score:', err.message || err);
      res.status(500).json({
        success: false,
        message: 'Internal query failure.'
      });
    }
  }

  /**
   * Saves responses belonging to any screen dynamically.
   */
  public async saveScreenResponses(req: Request, res: Response): Promise<void> {
    const { session_id, candidate_id, screen_index, responses } = req.body;

    if (!session_id || screen_index === undefined || !responses || !Array.isArray(responses)) {
      res.status(400).json({ success: false, message: 'Missing session_id, screen_index, or responses set.' });
      return;
    }

    try {
      const userIdent = candidate_id || session_id;
      const insertedIds: any[] = [];

      // Loop and save each response
      for (const resp of responses) {
        const { questionId, selectedOption, textAnswer, codeAnswer, languageSelected } = resp;
        const q = `
          INSERT INTO candidate_screen_responses (
            session_id, candidate_id, screen_index, question_id, selected_option, text_answer, code_answer, language_selected
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id;
        `;
        const result = await dbEngine.query(q, [
          session_id,
          candidate_id || null,
          screen_index,
          questionId,
          selectedOption || null,
          textAnswer || null,
          codeAnswer || null,
          languageSelected || null
        ]);

        const insertedId = (result.rows && result.rows.length > 0) ? (result.rows[0] as any).id : 999;
        insertedIds.push(insertedId);

        console.log('[DATA SAVED]');
        console.log('Table Name: candidate_screen_responses');
        console.log(`User ID: ${userIdent}`);
        console.log(`Inserted Record ID: ${insertedId}`);
      }

      res.status(200).json({
        success: true,
        message: `Saved ${responses.length} responses for screen ${screen_index}.`,
        ids: insertedIds
      });
    } catch (err: any) {
      console.error('[API Logging] Failed to save screen responses:', err.message || err);
      res.status(500).json({
        success: false,
        message: 'Internal query failure.'
      });
    }
  }

  /**
   * Dynamically handles resume upload to S3.
   * Path: resumes/{userId}/{timestamp}-{filename}
   */
  public async uploadResume(req: Request, res: Response): Promise<void> {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No resume file provided.' });
      return;
    }

    try {
      // Determine prospective candidate profile ID (to fulfill resumes/{userId}/ structure)
      let userId: string = 'temp';
      try {
        const checkMaxId = await dbEngine.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM candidate_profiles;');
        if (checkMaxId.rows && checkMaxId.rows.length > 0) {
          userId = (checkMaxId.rows[0] as any).next_id.toString();
        }
      } catch (dbErr) {
        console.warn('[Upload Resume] Failed to query prospective userId:', dbErr);
      }

      // Upload file to S3
      const timestamp = Math.floor(Date.now() / 1000);
      const sanitFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileKey = `resumes/${userId}/${timestamp}-${sanitFileName}`;

      const s3Url = await s3Controller.uploadFileDirectly(
        fileKey,
        file.buffer,
        file.mimetype
      );

      console.log('[RESUME UPLOADED]');
      console.log(`Candidate ID: ${userId}`);
      console.log(`S3 URL: ${s3Url}`);

      res.status(200).json({
        success: true,
        resumeUrl: s3Url
      });
    } catch (err: any) {
      console.error('[Upload Resume Error] Upload failed:', err.message || err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to upload resume to S3.'
      });
    }
  }
}

export const candidateController = new CandidateController();

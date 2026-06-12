// server/src/services/candidateService.ts - Candidate Profile persistence operations
import { dbEngine } from '../config/db';

export interface CandidateProfilePayload {
  full_name: string;
  email: string;
  phone: string;
  college: string;
  branch?: string;
  academic_year?: string;
  cgpa: string | number;
  target_role?: string;
  github_url?: string;
  linkedin_url?: string;
  resume_url?: string;
  resume_filename?: string;
}

export class CandidateService {
  private static instance: CandidateService;

  private constructor() {}

  public static getInstance(): CandidateService {
    if (!CandidateService.instance) {
      CandidateService.instance = new CandidateService();
    }
    return CandidateService.instance;
  }

  /**
   * Persists a validated candidate profile to the RDS database using parameterized query
   */
  public async saveProfile(payload: CandidateProfilePayload) {
    const queryStr = `
      INSERT INTO candidate_profiles (
        full_name,
        email,
        phone,
        college,
        branch,
        academic_year,
        cgpa,
        target_role,
        github_url,
        linkedin_url,
        resume_url,
        resume_filename
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    // Parse cgpa dynamically (can be string or numeric)
    const cgpaVal = payload.cgpa !== undefined && payload.cgpa !== '' ? parseFloat(payload.cgpa.toString()) : null;

    const params = [
      payload.full_name || null,
      payload.email || null,
      payload.phone || null,
      payload.college || null,
      payload.branch || null,
      payload.academic_year || null,
      cgpaVal,
      payload.target_role || null,
      payload.github_url || null,
      payload.linkedin_url || null,
      payload.resume_url || null,
      payload.resume_filename || null
    ];

    console.log('[Candidate Service] Injecting profile dataset to postgreSQL:', params);
    
    try {
      const result = await dbEngine.query(queryStr, params);
      if (result.rowCount && result.rowCount > 0) {
        const savedCand = result.rows[0] as any;
        console.log('[Candidate Service] Database insert success:', savedCand);
        
        console.log('[DATA SAVED]');
        console.log('Table Name: candidate_profiles');
        console.log(`User ID: ${savedCand.id}`);
        console.log(`Inserted Record ID: ${savedCand.id}`);

        console.log('[PROFILE SAVED]');
        console.log(`Candidate ID: ${savedCand.id}`);
        console.log(`Email: ${savedCand.email}`);

        if (savedCand.resume_url) {
          console.log('[RESUME UPLOADED]');
          console.log(`Candidate ID: ${savedCand.id}`);
          console.log(`S3 URL: ${savedCand.resume_url}`);
        }

        return savedCand;
      }
      throw new Error('No rows returned from query execution insert.');
    } catch (error) {
      console.error('[Candidate Service] Database insert failure:', error);
      throw error;
    }
  }
}

export const candidateService = CandidateService.getInstance();

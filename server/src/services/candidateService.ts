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
        linkedin_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      payload.linkedin_url || null
    ];

    console.log('[Candidate Service] Injecting profile dataset to postgreSQL:', params);
    
    try {
      const result = await dbEngine.query(queryStr, params);
      if (result.rowCount && result.rowCount > 0) {
        console.log('[Candidate Service] Database insert success:', result.rows[0]);
        return result.rows[0];
      }
      throw new Error('No rows returned from query execution insert.');
    } catch (error) {
      console.error('[Candidate Service] Database insert failure:', error);
      throw error;
    }
  }
}

export const candidateService = CandidateService.getInstance();

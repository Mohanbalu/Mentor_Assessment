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
      linkedin_url,
      resume_filename,
      resume_url
    } = payload;

    // Logging as requested
    console.log("resume_filename:", resume_filename);
    console.log("resume_url:", resume_url);

    // Logging expected query structures verbatim as requested
    console.log("EXPECTED INSERT QUERY:");
    console.log(`
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
 resume_filename,
 resume_url
)
VALUES (
 $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
);
    `.trim());

    console.log("EXPECTED UPDATE QUERY:");
    console.log(`
UPDATE candidate_profiles
SET
 resume_filename = $11,
 resume_url = $12
WHERE id = $1;
    `.trim());

    const emailKey = (email || '').trim().toLowerCase();

    // Check if candidate profile already exists with this email address
    let existingCandidateId: number | null = null;
    if (emailKey) {
      try {
        const checkResult = await dbEngine.query(
          'SELECT id FROM candidate_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1;',
          [emailKey]
        );
        if (checkResult.rowCount && checkResult.rowCount > 0) {
          existingCandidateId = (checkResult.rows[0] as any).id;
        }
      } catch (checkErr) {
        console.warn('[Candidate Service] Email profile lookup error:', checkErr);
      }
    }

    const cgpaVal = cgpa !== undefined && cgpa !== '' ? parseFloat(cgpa.toString()) : null;

    let queryStr = '';
    let params: any[] = [];

    if (existingCandidateId !== null) {
      console.log(`[Candidate Service] Existing profile with ID ${existingCandidateId} found. Preparing SQL UPDATE operation.`);
      
      queryStr = `
        UPDATE candidate_profiles
        SET
          full_name = $2,
          phone = $3,
          college = $4,
          branch = $5,
          academic_year = $6,
          cgpa = $7,
          target_role = $8,
          github_url = $9,
          linkedin_url = $10,
          resume_filename = $11,
          resume_url = $12
        WHERE id = $1
        RETURNING *;
      `;

      params = [
        existingCandidateId,
        full_name || null,
        phone || null,
        college || null,
        branch || null,
        academic_year || null,
        cgpaVal,
        target_role || null,
        github_url || null,
        linkedin_url || null,
        resume_filename || null,
        resume_url || null
      ];
    } else {
      console.log('[Candidate Service] No existing profile detected. Preparing SQL INSERT operation.');
      
      queryStr = `
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
          resume_filename,
          resume_url
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        RETURNING *;
      `;

      params = [
        full_name || null,
        email || null,
        phone || null,
        college || null,
        branch || null,
        academic_year || null,
        cgpaVal,
        target_role || null,
        github_url || null,
        linkedin_url || null,
        resume_filename || null,
        resume_url || null
      ];
    }

    console.log('[Candidate Service] Actual executed SQL statement:');
    console.log(queryStr);
    console.log('[Candidate Service] Bound Parameters:', params);

    try {
      const result = await dbEngine.query(queryStr, params);
      if (result.rowCount && result.rowCount > 0) {
        const savedCand = result.rows[0] as any;
        console.log('[Candidate Service] Database persistence successful:', savedCand);
        
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
      throw new Error('No rows returned from query execution.');
    } catch (error) {
      console.error('[Candidate Service] Database execution failure:', error);
      throw error;
    }
  }

  /**
   * Retrieves a candidate profile by email
   */
  public async getProfileByEmail(email: string) {
    const q = 'SELECT * FROM candidate_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1;';
    const result = await dbEngine.query(q, [email.trim().toLowerCase()]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  }
}

export const candidateService = CandidateService.getInstance();

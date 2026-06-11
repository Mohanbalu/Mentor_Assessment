// api/candidate-profile.ts - Vercel Serverless Function Proxy for database registry
import type { Request, Response } from 'express';
import { candidateService } from '../server/src/services/candidateService';

export default async function handler(req: Request, res: Response) {
  // Add permissive CORS headers to allow Vercel frontends or external requests safely
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight OPTIONS checks cleanly
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

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

    res.status(200).json({
      success: true,
      message: 'Candidate profile saved successfully via Vercel Edge Serverless',
      data: savedRecord
    });
  } catch (err: any) {
    console.error('[Vercel Serverless] Error saving profile:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save profile. Please check your DB credentials in Vercel.',
      error: err.message || 'Internal database persistence error'
    });
  }
}

// server/src/routes/api.ts - Consolidated API Router Mapping Endpoints

import { Router } from 'express';
import { authController } from '../controllers/authController';
import { assessmentController } from '../controllers/assessmentController';
import { authorizeJwt, restrictToRoles } from '../middlewares/auth';

const router = Router();

// ============================================
// PUBLIC AUTHENTICATION PORTS
// ============================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

// ============================================
// ASSESSMENT & CAMPAIGN MANAGEMENT ROUTINGS (Guarded URL)
// ============================================
router.get('/assessments', authorizeJwt, restrictToRoles('SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'), assessmentController.getAssessments);
router.post('/assessments', authorizeJwt, restrictToRoles('SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'), assessmentController.createAssessment);

// ============================================
// COMPILER SANDBOX OPERATIONS
// ============================================
router.post('/sandbox/compile', assessmentController.compileCodeSubmission);

// ============================================
// AI FEEDBACK GENERATORS & METRICS OUTLINES
// ============================================
router.post('/ai/feedback', authorizeJwt, restrictToRoles('SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'), assessmentController.generateAiFeedback);

export default router;

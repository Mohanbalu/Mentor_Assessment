// server/src/routes/candidateRoutes.ts - Router definition for candidate profiles and assessments with JWT secure filters
import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';
import { otpAuthController } from '../controllers/otpAuthController';
import { authorizeJwt, restrictToRoles } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure memory storage for Multer uploads to AWS S3 directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum size limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.doc' || ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX formats are allowed.'));
    }
  }
});

// =========================================================================
// PUBLIC PORTS (Email verification and credential authentication routes)
// =========================================================================
router.post('/auth/register', (req, res, next) => {
  otpAuthController.register(req, res).catch(next);
});

router.post('/auth/verify-otp', (req, res, next) => {
  otpAuthController.verifyOtp(req, res).catch(next);
});

router.post('/auth/resend-otp', (req, res, next) => {
  otpAuthController.resendOtp(req, res).catch(next);
});

router.get('/auth/latest-otp', (req, res, next) => {
  otpAuthController.getLatestOtp(req, res).catch(next);
});

router.post('/auth/login', (req, res, next) => {
  otpAuthController.login(req, res).catch(next);
});

router.post('/auth/admin-login', (req, res, next) => {
  otpAuthController.adminLogin(req, res).catch(next);
});

router.post('/auth/admin-verify-otp', (req, res, next) => {
  otpAuthController.adminVerifyOtp(req, res).catch(next);
});

router.post('/candidate-profile', (req, res, next) => {
  candidateController.saveProfile(req, res).catch(next);
});

router.get('/candidate-profile', (req, res, next) => {
  candidateController.getProfile(req, res).catch(next);
});

router.post('/upload-resume', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload validation failed. Keep size under 5MB and format PDF/DOC/DOCX.'
      });
    }
    candidateController.uploadResume(req, res).catch(next);
  });
});

router.post('/candidate-assessment-submit', (req, res, next) => {
  candidateController.submitAssessment(req, res).catch(next);
});

router.post('/pre-assessment-score', (req, res, next) => {
  candidateController.savePreAssessmentScore(req, res).catch(next);
});

router.post('/screen-responses', (req, res, next) => {
  candidateController.saveScreenResponses(req, res).catch(next);
});

// =========================================================================
// SECURE GUARDED GATEWAYS (Only matching admin@indiwebpros.in in JWT)
// =========================================================================

// Require authentication and the specific super_admin credential checking
router.get('/admin/attempts', authorizeJwt, restrictToRoles('SUPER_ADMIN'), (req, res, next) => {
  candidateController.getAttempts(req, res).catch(next);
});

router.get('/admin/attempts/:id', authorizeJwt, restrictToRoles('SUPER_ADMIN'), (req, res, next) => {
  candidateController.getAttemptDetail(req, res).catch(next);
});

// General protected routes to fully satisfy and safeguard /api/admin/*, /api/results/*, /api/candidates/*
router.all('/admin/*', authorizeJwt, restrictToRoles('SUPER_ADMIN'), (req, res) => {
  res.status(200).json({ status: 'success', message: 'Guarded Admin segment reachable.' });
});

router.all('/results/*', authorizeJwt, restrictToRoles('SUPER_ADMIN'), (req, res) => {
  res.status(200).json({ status: 'success', message: 'Guarded Results segment reachable.' });
});

router.all('/candidates/*', authorizeJwt, restrictToRoles('SUPER_ADMIN'), (req, res) => {
  res.status(200).json({ status: 'success', message: 'Guarded Candidates segment reachable.' });
});

export default router;

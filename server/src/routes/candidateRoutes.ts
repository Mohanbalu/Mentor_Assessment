// server/src/routes/candidateRoutes.ts - Router definition for candidate profiles and assessments with JWT secure filters
import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';
import { authorizeJwt, restrictToRoles } from '../middlewares/auth';

const router = Router();

// =========================================================================
// PUBLIC PORTS (Must remain public for sandbox candidate submission flows)
// =========================================================================
router.post('/candidate-profile', (req, res, next) => {
  candidateController.saveProfile(req, res).catch(next);
});

router.post('/candidate-assessment-submit', (req, res, next) => {
  candidateController.submitAssessment(req, res).catch(next);
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

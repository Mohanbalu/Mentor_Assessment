// server/src/routes/candidateRoutes.ts - Router definition for candidate profiles and assessments
import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';

const router = Router();

// Endpoint handling candidate profile registration POST /api/candidate-profile
router.post('/candidate-profile', (req, res, next) => {
  candidateController.saveProfile(req, res).catch(next);
});

// Endpoint handling candidate assessment session submissions POST /api/candidate-assessment-submit
router.post('/candidate-assessment-submit', (req, res, next) => {
  candidateController.submitAssessment(req, res).catch(next);
});

// Endpoint handling Admin dashboard list GET /api/admin/attempts
router.get('/admin/attempts', (req, res, next) => {
  candidateController.getAttempts(req, res).catch(next);
});

// Endpoint handling Admin dynamic card metrics details GET /api/admin/attempts/:id
router.get('/admin/attempts/:id', (req, res, next) => {
  candidateController.getAttemptDetail(req, res).catch(next);
});

export default router;

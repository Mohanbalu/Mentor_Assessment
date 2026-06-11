// server/src/routes/candidateRoutes.ts - Router definition for candidate profiles
import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';

const router = Router();

// Endpoint handling candidate profile registration POST /api/candidate-profile
router.post('/candidate-profile', (req, res, next) => {
  candidateController.saveProfile(req, res).catch(next);
});

export default router;

import { Router } from 'express';
import AppController from '../controllers/AppController';

const router = Router();

// GET status endpoint
router.get('/status', AppController.getStatus);

// GET stats endpoint
router.get('/stats', AppController.getStats);

export default router;

import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = Router();

// GET status endpoint
router.get('/status', AppController.getStatus);

// GET stats endpoint
router.get('/stats', AppController.getStats);

// POST users to /users
router.post('/users', UsersController.postNew);

export default router;

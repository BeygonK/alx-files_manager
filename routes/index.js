import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();

// GET status endpoint
router.get('/status', AppController.getStatus);

// GET stats endpoint
router.get('/stats', AppController.getStats);

// POST users to /users
router.post('/users', UsersController.postNew);

// GET /connect
router.get('/connect', AuthController.getConnect);

// GET /disconnect
router.get('/disconnect', AuthController.getDisconnect);

// GET /users/me
router.get('/users/me', UsersController.getMe);

// POST /files
router.post('/files', FilesController.postUpload);

// GET file by id:
router.get('/files/:id', FilesController.getShow);

// GET index
router.get('/files', FilesController.getIndex);

// PUT publish
router.put('/files/:id/publish', FilesController.putPublish);

// PUT unpublish
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;

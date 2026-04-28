import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Gắn middleware authenticateJWT và isAdmin để chặn truy cập trái phép
router.post('/', authenticateJWT, isAdmin, UserController.createUser);
router.put('/:id', authenticateJWT, isAdmin, UserController.updateUser);
router.get('/:id', authenticateJWT, isAdmin, UserController.getUserById);
router.get('/', authenticateJWT, isAdmin, UserController.getUserAll);
router.delete('/:id', authenticateJWT, isAdmin, UserController.deleteUser);

export default router;
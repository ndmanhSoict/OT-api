import { Router } from 'express';
import { StakeholderController } from '../controllers/StakeholderController';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', StakeholderController.search);
router.get('/', StakeholderController.getAll);
router.get('/:id', StakeholderController.getById);
router.post('/', authenticateJWT, isAdminOrStaff, StakeholderController.create);
router.put('/:id', authenticateJWT, isAdminOrStaff, StakeholderController.update);
router.delete('/:id', authenticateJWT, isAdminOrStaff, StakeholderController.delete);

export default router;

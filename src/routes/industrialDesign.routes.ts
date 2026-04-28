import { Router } from 'express';
import { IndustrialDesignController } from '../controllers/IndustrialDesignController';
import { upload } from '../middlewares/upload.middleware';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', IndustrialDesignController.search);
router.get('/search-all', authenticateJWT, isAdminOrStaff, IndustrialDesignController.searchAll);
router.get('/', IndustrialDesignController.getAll);
router.get('/:id', IndustrialDesignController.getById);
router.post('/', authenticateJWT, isAdminOrStaff, upload.array('images', 5), IndustrialDesignController.create);
router.put('/:id', authenticateJWT, isAdminOrStaff, upload.array('images', 5), IndustrialDesignController.update);
router.delete('/:id', authenticateJWT, isAdminOrStaff, IndustrialDesignController.delete);

export default router;

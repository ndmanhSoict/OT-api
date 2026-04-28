import { Router } from 'express';
import { CraftVillageController } from '../controllers/CraftVillageController';
import { upload } from '../middlewares/upload.middleware';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', CraftVillageController.search);
router.get('/search-all', authenticateJWT, isAdminOrStaff, CraftVillageController.searchAll);
router.get('/', CraftVillageController.getAll);
router.get('/:id', CraftVillageController.getById);
router.post('/', authenticateJWT, isAdminOrStaff, upload.array('images', 5), CraftVillageController.create);
router.put('/:id', authenticateJWT, isAdminOrStaff, upload.array('images', 5), CraftVillageController.update);
router.delete('/:id', authenticateJWT, isAdminOrStaff, CraftVillageController.delete);

export default router;

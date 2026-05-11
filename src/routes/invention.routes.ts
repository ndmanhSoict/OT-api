import { Router } from 'express';
import { InventionController } from '../controllers/InventionController';
import { upload } from '../middlewares/upload.middleware';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', InventionController.search);
router.get('/search-all', authenticateJWT, isAdminOrStaff, InventionController.searchAll);
router.get('/export', authenticateJWT, isAdminOrStaff, InventionController.exportRows);
router.post('/import', authenticateJWT, isAdminOrStaff, InventionController.importRows);
router.get('/', InventionController.getAll);
router.get('/:id', InventionController.getById);
router.post('/', authenticateJWT, isAdminOrStaff, upload.array('images', 5), InventionController.create);
router.put('/:id', authenticateJWT, isAdminOrStaff, upload.array('images', 5), InventionController.update);
router.delete('/:id', authenticateJWT, isAdminOrStaff, InventionController.delete);

export default router;

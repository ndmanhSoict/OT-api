import { Router } from 'express';
import { GeographicalIndicationController } from '../controllers/GeographicalIndicationController';
import { upload } from '../middlewares/upload.middleware';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', GeographicalIndicationController.search);
router.get('/search-all', authenticateJWT, isAdminOrStaff, GeographicalIndicationController.searchAll);
router.get('/', GeographicalIndicationController.getAll);
router.get('/:id', GeographicalIndicationController.getById);
router.post('/', authenticateJWT, isAdminOrStaff, upload.array('images', 5), GeographicalIndicationController.create);
router.put('/:id', authenticateJWT, isAdminOrStaff, upload.array('images', 5), GeographicalIndicationController.update);
router.delete('/:id', authenticateJWT, isAdminOrStaff, GeographicalIndicationController.delete);

export default router;

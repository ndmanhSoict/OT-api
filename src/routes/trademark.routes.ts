import { Router } from 'express';
import { TrademarkController } from '../controllers/TrademarkController';
import { upload } from '../middlewares/upload.middleware';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', TrademarkController.search);
router.get('/search-all', authenticateJWT, isAdminOrStaff, TrademarkController.searchAll);
router.get('/', TrademarkController.getAll);
router.get('/:id', TrademarkController.getById);
router.post('/', authenticateJWT, isAdminOrStaff, upload.array('images', 5), TrademarkController.create);
router.put('/:id', authenticateJWT, isAdminOrStaff, upload.array('images', 5), TrademarkController.update);
router.delete('/:id', authenticateJWT, isAdminOrStaff, TrademarkController.delete);

export default router;

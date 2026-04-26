import { Router } from 'express';
import { CopyrightController } from '../controllers/CopyrightController';
import { upload } from '../middlewares/upload.middleware';
import { authenticateJWT, isAdminOrStaff } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', CopyrightController.getCopyright);

// Cho phép upload tối đa 5 ảnh với key là 'images'
router.post('/', authenticateJWT, isAdminOrStaff, upload.array('images', 5), CopyrightController.createCopyright);
router.put('/:id', authenticateJWT, isAdminOrStaff, upload.array('images', 5), CopyrightController.updateCopyright);
router.delete('/:id', authenticateJWT, isAdminOrStaff, CopyrightController.deleteCopyright);

export default router;
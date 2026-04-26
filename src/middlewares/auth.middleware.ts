import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mở rộng interface Request của Express để chứa thông tin user sau khi giải mã token
export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// 1. Middleware kiểm tra Token hợp lệ không
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]; // Lấy token sau chữ 'Bearer '

    jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, decoded) => {
      if (err) {
        res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
        return;
      }
      // Gắn thông tin user vào request để các hàm sau sử dụng
      req.user = decoded as { userId: number; role: string };
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Không tìm thấy Token xác thực (Authorization Header)' });
  }
};

// 2. Middleware kiểm tra quyền Admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next(); // Hợp lệ, cho phép đi tiếp
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Truy cập bị từ chối. Chỉ Admin mới có quyền thực hiện thao tác này!' 
    });
  }
};
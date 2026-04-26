import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export class AuthController {
  
  // [POST] /api/auth/login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp username và password' });
        return;
      }

      // 1. Tìm user trong database
      const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      const user = rows[0];

      if (!user) {
        res.status(401).json({ success: false, message: 'username hoặc mật khẩu không đúng' });
        return;
      }

      // 2. Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'username hoặc mật khẩu không đúng' });
        return;
      }

      // 3. Tạo Access Token (Ngắn hạn)
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as string) || '15m' } as any
      );

      // 4. Tạo Refresh Token (Dài hạn)
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as string) || '7d' } as any
      );

      // (Tùy chọn nâng cao: Bạn có thể lưu refreshToken này vào database để quản lý việc thu hồi)

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: { id: user.id, username: user.username, role: user.role },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
  }

  // [POST] /api/auth/refresh-token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({ success: false, message: 'Không tìm thấy Refresh Token' });
        return;
      }

      // 1. Xác thực Refresh Token
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
        if (err) {
          res.status(403).json({ success: false, message: 'Refresh Token không hợp lệ hoặc đã hết hạn' });
          return;
        }

        const userId = decoded.userId;

        // 2. Kiểm tra user có còn tồn tại trong DB không
        const [rows]: any = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        if (!user) {
          res.status(403).json({ success: false, message: 'Người dùng không còn tồn tại' });
          return;
        }

        // 3. Cấp phát Access Token mới
        const newAccessToken = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_ACCESS_SECRET as string,
          { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as string) || '15m' } as any
        );

        res.status(200).json({
          success: true,
          data: {
            accessToken: newAccessToken
          }
        });
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
  }
}
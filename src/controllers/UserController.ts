import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export class UserController {
  
  // [POST] /api/users - Tạo tài khoản mới với ID thời gian thực
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, fullName, password, role } = req.body;

      if (!username || !fullName || !password || !role) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin' });
        return;
      }

      // Kiểm tra username tồn tại
      const [existingUsers]: any = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsers.length > 0) {
        res.status(409).json({ success: false, message: 'Username này đã tồn tại' });
        return;
      }

      // TẠO ID THEO THỜI GIAN THỰC (Timestamp)
      const realTimeId = Date.now();

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Chèn trực tiếp ID đã tạo vào câu lệnh INSERT
      await pool.query(
        'INSERT INTO users (id, username, fullName, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
        [realTimeId, username, fullName, passwordHash, role]
      );

      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        data: {
          id: realTimeId,
          username,
          fullName,
          role
        }
      });
    } catch (error: any) {
      console.error('Lỗi khi tạo user:', error);
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  // [PUT] /api/users/:id - Cập nhật tài khoản (Yêu cầu ID chính xác)
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // Lấy ID từ params (hoặc body tùy bạn thiết kế, ở đây dùng params cho chuẩn REST)
      const userId = req.params.id; 
      const { fullName, role, password } = req.body;

      // 1. Kiểm tra ID có được cung cấp hay không
      if (!userId) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID tài khoản cần sửa' });
        return;
      }

      // 2. Kiểm tra tài khoản có tồn tại theo ID không
      const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        res.status(404).json({ success: false, message: `Không tìm thấy tài khoản với ID: ${userId}` });
        return;
      }

      let query = 'UPDATE users SET fullName = ?, role = ? WHERE id = ?';
      let params: any[] = [fullName || users[0].fullName, role || users[0].role, userId];

      if (password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        query = 'UPDATE users SET fullName = ?, role = ?, passwordHash = ? WHERE id = ?';
        params = [fullName || users[0].fullName, role || users[0].role, passwordHash, userId];
      }

      await pool.query(query, params);

      res.status(200).json({
        success: true,
        message: 'Cập nhật tài khoản thành công',
        data: {
          id: userId,
          fullName: params[0],
          role: params[1]
        }
      });
    } catch (error: any) {
      console.error('Lỗi khi cập nhật user:', error);
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  // Thêm vào trong class UserController

// [GET] /api/users/:id - Xem chi tiết tài khoản
static async getUserById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;

    const [users]: any = await pool.query(
      'SELECT id, username, fullName, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return;
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
}

// [DELETE] /api/users/:id - Xóa tài khoản
static async deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;

    // Kiểm tra tồn tại trước khi xóa
    const [users]: any = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
      return;
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.status(200).json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
}

  
}
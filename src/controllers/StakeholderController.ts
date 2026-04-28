import { Request, Response } from 'express';
import pool from '../config/database';

export class StakeholderController {

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const q = `%${req.query.q ?? ''}%`;
      const [rows]: any = await pool.query(
        'SELECT * FROM stakeholders WHERE name LIKE ? OR address LIKE ?',
        [q, q]
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM stakeholders ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query('SELECT * FROM stakeholders WHERE id = ?', [id]);
      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chủ thể' });
        return;
      }
      res.status(200).json({ success: true, data: rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, address } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Tên chủ thể là bắt buộc' });
        return;
      }
      const id = Date.now();
      await pool.query('INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)', [id, name, address]);
      res.status(201).json({ success: true, message: 'Tạo chủ thể thành công', id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tạo chủ thể', error: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, address } = req.body;
      const [result]: any = await pool.query(
        'UPDATE stakeholders SET name = ?, address = ? WHERE id = ?',
        [name, address, id]
      );
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chủ thể' });
        return;
      }
      res.status(200).json({ success: true, message: 'Cập nhật chủ thể thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [result]: any = await pool.query('DELETE FROM stakeholders WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chủ thể để xóa' });
        return;
      }
      res.status(200).json({ success: true, message: 'Đã xóa chủ thể thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
    }
  }
}

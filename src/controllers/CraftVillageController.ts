import { Request, Response } from 'express';
import pool from '../config/database';

export class CraftVillageController {

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const allowedFields: Record<string, string> = {
        name: 'name',
        product: 'product',
        address: 'address',
        certificateNumber: 'certificateNumber',
        recognitionDate: 'CAST(recognitionDate AS CHAR)',
      };

      const conditions: string[] = [];
      const values: string[] = [];

      for (const [key, col] of Object.entries(allowedFields)) {
        const val = ((req.query[key] as string) ?? '').trim();
        if (val) {
          conditions.push(`${col} LIKE ?`);
          values.push(`%${val}%`);
        }
      }

      if (conditions.length === 0) {
        res.status(400).json({ success: false, message: `Cần truyền ít nhất một trường tìm kiếm. Các trường hợp lệ: ${Object.keys(allowedFields).join(', ')}` });
        return;
      }

      const [rows]: any = await pool.query(
        `SELECT * FROM craftVillages WHERE ${conditions.join(' AND ')}`,
        values
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
    }
  }

  static async searchAll(req: Request, res: Response): Promise<void> {
    try {
      const rawQ = ((req.query.q as string) ?? '').trim();
      if (!rawQ) {
        res.status(400).json({ success: false, message: 'Cần truyền tham số q' });
        return;
      }
      const q = `%${rawQ}%`;
      const [rows]: any = await pool.query(
        `SELECT * FROM craftVillages
         WHERE name LIKE ? OR product LIKE ? OR address LIKE ? OR certificateNumber LIKE ?
            OR CAST(recognitionDate AS CHAR) LIKE ?`,
        Array(5).fill(q)
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM craftVillages ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query('SELECT * FROM craftVillages WHERE id = ?', [id]);
      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy làng nghề' });
        return;
      }
      res.status(200).json({ success: true, data: rows[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, product, address, certificateNumber, recognitionDate } = req.body;
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(f => `/uploads/${f.filename}`) : [];

      const id = Date.now();
      await pool.query(
        'INSERT INTO craftVillages (id, name, product, address, certificateNumber, recognitionDate, imageUrls) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, product, address, certificateNumber, recognitionDate, JSON.stringify(imageUrls)]
      );
      res.status(201).json({ success: true, message: 'Tạo làng nghề thành công', id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tạo làng nghề', error: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, product, address, certificateNumber, recognitionDate } = req.body;

      const [existing]: any = await pool.query('SELECT imageUrls FROM craftVillages WHERE id = ?', [id]);
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy làng nghề' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const finalImageUrls = files && files.length > 0
        ? JSON.stringify(files.map(f => `/uploads/${f.filename}`))
        : existing[0].imageUrls;

      await pool.query(
        'UPDATE craftVillages SET name=?, product=?, address=?, certificateNumber=?, recognitionDate=?, imageUrls=? WHERE id=?',
        [name, product, address, certificateNumber, recognitionDate, finalImageUrls, id]
      );
      res.status(200).json({ success: true, message: 'Cập nhật làng nghề thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [result]: any = await pool.query('DELETE FROM craftVillages WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy làng nghề để xóa' });
        return;
      }
      res.status(200).json({ success: true, message: 'Đã xóa làng nghề thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
    }
  }
}

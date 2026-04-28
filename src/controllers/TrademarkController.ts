import { Request, Response } from 'express';
import pool from '../config/database';

export class TrademarkController {

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const allowedFields: Record<string, string> = {
        trademarkSample: 'trademarkSample',
        name: 'name',
        type: 'type',
        applicationNumber: 'applicationNumber',
        publicationNumber: 'publicationNumber',
        certificateNumber: 'certificateNumber',
        productServiceGroup: 'productServiceGroup',
        classification: 'classification',
        status: 'status',
        applicationDate: 'CAST(applicationDate AS CHAR)',
        publicationDate: 'CAST(publicationDate AS CHAR)',
        grantDate: 'CAST(grantDate AS CHAR)',
        expirationDate: 'CAST(expirationDate AS CHAR)',
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
        `SELECT * FROM trademarks WHERE ${conditions.join(' AND ')}`,
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
        `SELECT * FROM trademarks
         WHERE trademarkSample LIKE ? OR name LIKE ? OR type LIKE ?
            OR applicationNumber LIKE ? OR publicationNumber LIKE ? OR certificateNumber LIKE ?
            OR productServiceGroup LIKE ? OR classification LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(publicationDate AS CHAR) LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ? OR CAST(expirationDate AS CHAR) LIKE ?`,
        Array(13).fill(q)
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM trademarks ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query(`
        SELECT t.*, s.name AS ownerName, s.address AS ownerAddress
        FROM trademarks t
        LEFT JOIN stakeholders s ON t.ownerId = s.id
        WHERE t.id = ?`, [id]);

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nhãn hiệu' });
        return;
      }

      const row = rows[0];
      const result = {
        ...row,
        owner: row.ownerId ? { id: row.ownerId, name: row.ownerName, address: row.ownerAddress } : null,
      };
      delete result.ownerName;
      delete result.ownerAddress;

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        trademarkSample, name, type, applicationNumber, applicationDate,
        publicationNumber, publicationDate, certificateNumber, grantDate,
        expirationDate, productServiceGroup, classification, status,
      } = req.body;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(f => `/uploads/${f.filename}`) : [];

      const id = Date.now();
      let ownerId = null;

      if (owner) {
        const [existing]: any = await connection.query(
          'SELECT id FROM stakeholders WHERE name = ? AND address = ?',
          [owner.name, owner.address]
        );
        if (existing.length > 0) {
          ownerId = existing[0].id;
        } else {
          ownerId = Date.now() + 1;
          await connection.query(
            'INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)',
            [ownerId, owner.name, owner.address]
          );
        }
      }

      await connection.query(
        `INSERT INTO trademarks
          (id, trademarkSample, name, type, applicationNumber, applicationDate,
           publicationNumber, publicationDate, certificateNumber, grantDate,
           expirationDate, productServiceGroup, classification, ownerId, status, imageUrls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, trademarkSample, name, type, applicationNumber, applicationDate,
         publicationNumber, publicationDate, certificateNumber, grantDate,
         expirationDate, productServiceGroup, classification, ownerId, status, JSON.stringify(imageUrls)]
      );

      await connection.commit();
      res.status(201).json({ success: true, message: 'Tạo nhãn hiệu thành công', id });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi tạo nhãn hiệu', error: error.message });
    } finally {
      connection.release();
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const {
        trademarkSample, name, type, applicationNumber, applicationDate,
        publicationNumber, publicationDate, certificateNumber, grantDate,
        expirationDate, productServiceGroup, classification, status,
      } = req.body;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;

      const [existing]: any = await connection.query('SELECT imageUrls FROM trademarks WHERE id = ?', [id]);
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nhãn hiệu' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const finalImageUrls = files && files.length > 0
        ? JSON.stringify(files.map(f => `/uploads/${f.filename}`))
        : existing[0].imageUrls;

      let ownerId = null;
      if (owner) {
        const [sExist]: any = await connection.query(
          'SELECT id FROM stakeholders WHERE name = ? AND address = ?',
          [owner.name, owner.address]
        );
        if (sExist.length > 0) {
          ownerId = sExist[0].id;
        } else {
          ownerId = Date.now() + 1;
          await connection.query(
            'INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)',
            [ownerId, owner.name, owner.address]
          );
        }
      }

      await connection.query(
        `UPDATE trademarks SET
          trademarkSample=?, name=?, type=?, applicationNumber=?, applicationDate=?,
          publicationNumber=?, publicationDate=?, certificateNumber=?, grantDate=?,
          expirationDate=?, productServiceGroup=?, classification=?, ownerId=?, status=?, imageUrls=?
         WHERE id=?`,
        [trademarkSample, name, type, applicationNumber, applicationDate,
         publicationNumber, publicationDate, certificateNumber, grantDate,
         expirationDate, productServiceGroup, classification, ownerId, status, finalImageUrls, id]
      );

      await connection.commit();
      res.status(200).json({ success: true, message: 'Cập nhật nhãn hiệu thành công' });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
    } finally {
      connection.release();
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [result]: any = await pool.query('DELETE FROM trademarks WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nhãn hiệu để xóa' });
        return;
      }
      res.status(200).json({ success: true, message: 'Đã xóa nhãn hiệu thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
    }
  }
}

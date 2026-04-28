import { Request, Response } from 'express';
import pool from '../config/database';

export class GeographicalIndicationController {

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const allowedFields: Record<string, string> = {
        name: 'name',
        product: 'product',
        applicationNumber: 'applicationNumber',
        certificateNumber: 'certificateNumber',
        geographicalArea: 'geographicalArea',
        description: 'description',
        status: 'status',
        applicationDate: 'CAST(applicationDate AS CHAR)',
        grantDate: 'CAST(grantDate AS CHAR)',
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
        `SELECT * FROM geographicalIndications WHERE ${conditions.join(' AND ')}`,
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
        `SELECT * FROM geographicalIndications
         WHERE name LIKE ? OR product LIKE ? OR applicationNumber LIKE ? OR certificateNumber LIKE ?
            OR geographicalArea LIKE ? OR description LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(grantDate AS CHAR) LIKE ?`,
        Array(9).fill(q)
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM geographicalIndications ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query(`
        SELECT gi.*,
          owner.name AS ownerName, owner.address AS ownerAddress,
          mgmt.name AS managementOrgName, mgmt.address AS managementOrgAddress
        FROM geographicalIndications gi
        LEFT JOIN stakeholders owner ON gi.ownerId = owner.id
        LEFT JOIN stakeholders mgmt ON gi.managementOrgId = mgmt.id
        WHERE gi.id = ?`, [id]);

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chỉ dẫn địa lý' });
        return;
      }

      const row = rows[0];
      const result = {
        ...row,
        owner: row.ownerId ? { id: row.ownerId, name: row.ownerName, address: row.ownerAddress } : null,
        managementOrg: row.managementOrgId
          ? { id: row.managementOrgId, name: row.managementOrgName, address: row.managementOrgAddress }
          : null,
      };
      delete result.ownerName;
      delete result.ownerAddress;
      delete result.managementOrgName;
      delete result.managementOrgAddress;

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
        name, product, applicationNumber, applicationDate, certificateNumber,
        grantDate, geographicalArea, description, status,
      } = req.body;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;
      const managementOrg = req.body.managementOrg ? JSON.parse(req.body.managementOrg) : null;
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(f => `/uploads/${f.filename}`) : [];

      const id = Date.now();
      let idCounter = 1;

      const findOrCreate = async (item: any): Promise<number> => {
        const [existing]: any = await connection.query(
          'SELECT id FROM stakeholders WHERE name = ? AND address = ?',
          [item.name, item.address]
        );
        if (existing.length > 0) return existing[0].id;
        const sId = Date.now() + (idCounter++);
        await connection.query(
          'INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)',
          [sId, item.name, item.address]
        );
        return sId;
      };

      const ownerId = owner ? await findOrCreate(owner) : null;
      const managementOrgId = managementOrg ? await findOrCreate(managementOrg) : null;

      await connection.query(
        `INSERT INTO geographicalIndications
          (id, name, product, applicationNumber, applicationDate, certificateNumber,
           grantDate, ownerId, managementOrgId, geographicalArea, description, status, imageUrls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, product, applicationNumber, applicationDate, certificateNumber,
         grantDate, ownerId, managementOrgId, geographicalArea, description, status, JSON.stringify(imageUrls)]
      );

      await connection.commit();
      res.status(201).json({ success: true, message: 'Tạo chỉ dẫn địa lý thành công', id });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi tạo chỉ dẫn địa lý', error: error.message });
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
        name, product, applicationNumber, applicationDate, certificateNumber,
        grantDate, geographicalArea, description, status,
      } = req.body;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;
      const managementOrg = req.body.managementOrg ? JSON.parse(req.body.managementOrg) : null;

      const [existing]: any = await connection.query(
        'SELECT imageUrls FROM geographicalIndications WHERE id = ?', [id]
      );
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chỉ dẫn địa lý' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const finalImageUrls = files && files.length > 0
        ? JSON.stringify(files.map(f => `/uploads/${f.filename}`))
        : existing[0].imageUrls;

      let idCounter = 1;
      const findOrCreate = async (item: any): Promise<number> => {
        const [ex]: any = await connection.query(
          'SELECT id FROM stakeholders WHERE name = ? AND address = ?',
          [item.name, item.address]
        );
        if (ex.length > 0) return ex[0].id;
        const sId = Date.now() + (idCounter++);
        await connection.query(
          'INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)',
          [sId, item.name, item.address]
        );
        return sId;
      };

      const ownerId = owner ? await findOrCreate(owner) : null;
      const managementOrgId = managementOrg ? await findOrCreate(managementOrg) : null;

      await connection.query(
        `UPDATE geographicalIndications SET
          name=?, product=?, applicationNumber=?, applicationDate=?, certificateNumber=?,
          grantDate=?, ownerId=?, managementOrgId=?, geographicalArea=?, description=?, status=?, imageUrls=?
         WHERE id=?`,
        [name, product, applicationNumber, applicationDate, certificateNumber,
         grantDate, ownerId, managementOrgId, geographicalArea, description, status, finalImageUrls, id]
      );

      await connection.commit();
      res.status(200).json({ success: true, message: 'Cập nhật chỉ dẫn địa lý thành công' });
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
      const [result]: any = await pool.query('DELETE FROM geographicalIndications WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chỉ dẫn địa lý để xóa' });
        return;
      }
      res.status(200).json({ success: true, message: 'Đã xóa chỉ dẫn địa lý thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
    }
  }
}

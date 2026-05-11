import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import pool from '../config/database';
import { asDate, asText, findOrCreateStakeholder, getCell, getRows, getStakeholders, hasAnyValue } from '../utils/importRows';

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
        const [rows]: any = await pool.query('SELECT * FROM geographicalIndications ORDER BY id DESC');
        res.status(200).json({ success: true, data: rows });
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

  static async exportRows(req: Request, res: Response): Promise<void> {
    try {
      const rawQ = ((req.query.q as string) ?? '').trim();
      const baseSql = `
        SELECT name, product, geographicalArea, status, grantDate
        FROM geographicalIndications
      `;

      if (!rawQ) {
        const [rows]: any = await pool.query(`${baseSql} ORDER BY id DESC`);
        res.status(200).json({ success: true, data: rows });
        return;
      }

      const q = `%${rawQ}%`;
      const [rows]: any = await pool.query(
        `${baseSql}
         WHERE name LIKE ? OR product LIKE ? OR applicationNumber LIKE ? OR certificateNumber LIKE ?
            OR geographicalArea LIKE ? OR description LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(grantDate AS CHAR) LIKE ?
         ORDER BY id DESC`,
        Array(9).fill(q)
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xuất dữ liệu chỉ dẫn địa lý', error: error.message });
    }
  }

  static async importRows(req: Request, res: Response): Promise<void> {
    const rows = getRows(req.body).filter(hasAnyValue);
    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'File Excel không có dữ liệu hợp lệ' });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      let imported = 0;
      let skipped = 0;
      const baseId = Date.now();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = asText(getCell(row, ['Tên', 'Tên chỉ dẫn địa lý', 'name']));
        if (!name) {
          skipped++;
          continue;
        }

        const owner = getStakeholders(
          getCell(row, ['Chủ đơn', 'owner']),
          getCell(row, ['Địa chỉ chủ đơn', 'ownerAddress'])
        )[0];
        const managementOrg = getStakeholders(
          getCell(row, ['Tổ chức quản lý CDĐL', 'Tổ chức quản lý CĐL', 'Tổ chức quản lý', 'managementOrg']),
          getCell(row, ['Địa chỉ tổ chức quản lý CDĐL', 'Địa chỉ tổ chức quản lý CĐL', 'Địa chỉ tổ chức quản lý', 'managementOrgAddress'])
        )[0];
        const ownerId = owner ? await findOrCreateStakeholder(connection, owner, baseId + 100000 + i) : null;
        const managementOrgId = managementOrg ? await findOrCreateStakeholder(connection, managementOrg, baseId + 200000 + i) : null;

        await connection.query(
          `INSERT INTO geographicalIndications
            (id, name, product, applicationNumber, applicationDate, certificateNumber, grantDate,
             ownerId, managementOrgId, geographicalArea, description, status, imageUrls)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            baseId + i,
            name,
            asText(getCell(row, ['Sản phẩm', 'product'])),
            asText(getCell(row, ['Số đơn', 'applicationNumber'])),
            asDate(getCell(row, ['Ngày nộp', 'Ngày nộp đơn', 'applicationDate'])),
            asText(getCell(row, ['Số giấy chứng nhận', 'Số chứng nhận', 'Số văn bằng', 'certificateNumber'])),
            asDate(getCell(row, ['Ngày cấp', 'grantDate'])),
            ownerId,
            managementOrgId,
            asText(getCell(row, ['Khu vực địa lý', 'Vùng địa lý', 'geographicalArea'])),
            asText(getCell(row, ['Bản mô tả', 'Mô tả', 'description'])),
            asText(getCell(row, ['Trạng thái', 'status'])),
            JSON.stringify([]),
          ]
        );
        imported++;
      }

      await connection.commit();
      res.status(201).json({ success: true, message: `Đã import ${imported} dòng`, imported, skipped });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi import chỉ dẫn địa lý', error: error.message });
    } finally {
      connection.release();
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

      const oldUrls: string[] = JSON.parse(existing[0].imageUrls || '[]');
      const keepUrls: string[] = req.body.existingImages !== undefined
        ? JSON.parse(req.body.existingImages || '[]')
        : oldUrls;

      for (const url of oldUrls) {
        if (!keepUrls.includes(url)) {
          const filePath = path.join(process.cwd(), 'uploads', path.basename(url));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }

      const files = req.files as Express.Multer.File[];
      const newUrls = files ? files.map(f => `/uploads/${f.filename}`) : [];
      const finalImageUrls = JSON.stringify([...keepUrls, ...newUrls]);

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

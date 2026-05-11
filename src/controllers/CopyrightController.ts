import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import pool from '../config/database';
import { asDate, asText, findOrCreateStakeholder, getCell, getRows, getStakeholders, hasAnyValue } from '../utils/importRows';

export class CopyrightController {

  // [GET] /api/copyrights/search?q=... - TÌM KIẾM
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const allowedFields: Record<string, string> = {
        certificateNumber: 'certificateNumber',
        title: 'title',
        type: 'type',
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
        const [rows]: any = await pool.query('SELECT * FROM copyrights ORDER BY id DESC');
        res.status(200).json({ success: true, data: rows });
        return;
      }

      const [rows]: any = await pool.query(
        `SELECT * FROM copyrights WHERE ${conditions.join(' AND ')}`,
        values
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi tìm kiếm', error: error.message });
    }
  }

  // [GET] /api/copyrights/search-all?q=... - TÌM KIẾM TOÀN BỘ (Admin/Staff)
  static async searchAll(req: Request, res: Response): Promise<void> {
    try {
      const rawQ = ((req.query.q as string) ?? '').trim();
      if (!rawQ) {
        res.status(400).json({ success: false, message: 'Cần truyền tham số q' });
        return;
      }
      const q = `%${rawQ}%`;
      const [rows]: any = await pool.query(
        `SELECT * FROM copyrights
         WHERE certificateNumber LIKE ? OR title LIKE ? OR type LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ?`,
        [q, q, q, q]
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
        SELECT title, certificateNumber, type, grantDate
        FROM copyrights
      `;

      if (!rawQ) {
        const [rows]: any = await pool.query(`${baseSql} ORDER BY id DESC`);
        res.status(200).json({ success: true, data: rows });
        return;
      }

      const q = `%${rawQ}%`;
      const [rows]: any = await pool.query(
        `${baseSql}
         WHERE certificateNumber LIKE ? OR title LIKE ? OR type LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ?
         ORDER BY id DESC`,
        [q, q, q, q]
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xuất dữ liệu bản quyền', error: error.message });
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
        const title = asText(getCell(row, ['Tên tác phẩm', 'title']));
        if (!title) {
          skipped++;
          continue;
        }
        const copyrightId = baseId + i;

        await connection.query(
          `INSERT INTO copyrights (id, title, certificateNumber, type, grantDate, imageUrls)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            copyrightId,
            title,
            asText(getCell(row, ['Số giấy chứng nhận', 'Số chứng nhận', 'certificateNumber'])),
            asText(getCell(row, ['Loại hình', 'Loại', 'type'])),
            asDate(getCell(row, ['Ngày cấp', 'grantDate'])),
            JSON.stringify([]),
          ]
        );

        const authors = getStakeholders(
          getCell(row, ['Tác giả', 'authors']),
          getCell(row, ['Địa chỉ tác giả', 'authorAddress'])
        );
        const owners = getStakeholders(
          getCell(row, ['Tên chủ sở hữu', 'Chủ sở hữu', 'owners']),
          getCell(row, ['Địa chỉ chủ sở hữu', 'ownerAddress'])
        );

        for (let authorIndex = 0; authorIndex < authors.length; authorIndex++) {
          const stakeholderId = await findOrCreateStakeholder(connection, authors[authorIndex], baseId + 100000 + i * 20 + authorIndex);
          await connection.query(
            'INSERT IGNORE INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES (?, ?, ?)',
            [copyrightId, stakeholderId, 'author']
          );
        }

        for (let ownerIndex = 0; ownerIndex < owners.length; ownerIndex++) {
          const stakeholderId = await findOrCreateStakeholder(connection, owners[ownerIndex], baseId + 200000 + i * 20 + ownerIndex);
          await connection.query(
            'INSERT IGNORE INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES (?, ?, ?)',
            [copyrightId, stakeholderId, 'owner']
          );
        }
        imported++;
      }

      await connection.commit();
      res.status(201).json({ success: true, message: `Đã import ${imported} dòng`, imported, skipped });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi import bản quyền', error: error.message });
    } finally {
      connection.release();
    }
  }

  // [GET] /api/copyrights - DANH SÁCH
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM copyrights ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  // 1. [POST] /api/copyrights - TẠO MỚI
  static async createCopyright(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { certificateNumber, grantDate, title, type } = req.body;
      const authors = JSON.parse(req.body.authors || '[]');
      const owners = JSON.parse(req.body.owners || '[]');

      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];

      const copyrightId = Date.now();

      // Lưu vào bảng chính (Đã có id)
      await connection.query(
        'INSERT INTO copyrights (id, certificateNumber, grantDate, title, type, imageUrls) VALUES (?, ?, ?, ?, ?, ?)',
        [copyrightId, certificateNumber, grantDate, title, type, JSON.stringify(imageUrls)]
      );

      // Hàm xử lý Stakeholders (SỬA LỖI TẠI ĐÂY: Thêm ID cho Stakeholder)
      const handleStakeholders = async (list: any[], role: 'author' | 'owner') => {
        let counter = 0;
        for (const item of list) {
          const [existing]: any = await connection.query(
            'SELECT id FROM stakeholders WHERE name = ? AND address = ?',
            [item.name, item.address]
          );

          let stakeholderId;
          if (existing.length > 0) {
            stakeholderId = existing[0].id;
          } else {
            // TẠO ID MỚI CHO STAKEHOLDER (Tránh trùng bằng cách + counter)
            stakeholderId = Date.now() + (counter++); 
            await connection.query(
              'INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)',
              [stakeholderId, item.name, item.address]
            );
          }

          await connection.query(
            'INSERT INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES (?, ?, ?)',
            [copyrightId, stakeholderId, role]
          );
        }
      };

      await handleStakeholders(authors, 'author');
      await handleStakeholders(owners, 'owner');

      await connection.commit();
      res.status(201).json({ success: true, message: 'Tạo bản quyền thành công', id: copyrightId });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi khi tạo bản quyền', error: error.message });
    } finally {
      connection.release();
    }
  }
  // 2. [GET] /api/copyrights/:id - XEM CHI TIẾT (Mọi vai trò)
  static async getCopyright(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Lấy thông tin bản quyền
      const [copyrights]: any = await pool.query('SELECT * FROM copyrights WHERE id = ?', [id]);
      
      if (copyrights.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bản quyền' });
        return;
      }

      // Lấy danh sách stakeholders liên quan (cả tác giả và chủ sở hữu)
      const [stakeholders]: any = await pool.query(`
        SELECT s.name, s.address, ca.role 
        FROM stakeholders s
        JOIN copyrightAuthors ca ON s.id = ca.stakeholderId
        WHERE ca.copyrightId = ?`, 
        [id]
      );

      const result = {
        ...copyrights[0],
        authors: stakeholders.filter((s: any) => s.role === 'author'),
        owners: stakeholders.filter((s: any) => s.role === 'owner')
      };

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  // 2. [PUT] /api/copyrights/:id - CẬP NHẬT
  static async updateCopyright(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;
      const { certificateNumber, grantDate, title, type } = req.body;
      const authors = JSON.parse(req.body.authors || '[]');
      const owners = JSON.parse(req.body.owners || '[]');

      const [existing]: any = await connection.query('SELECT imageUrls FROM copyrights WHERE id = ?', [id]);
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy' });
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
      const newUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
      const finalImageUrls = JSON.stringify([...keepUrls, ...newUrls]);

      await connection.query(
        'UPDATE copyrights SET certificateNumber = ?, grantDate = ?, title = ?, type = ?, imageUrls = ? WHERE id = ?',
        [certificateNumber, grantDate, title, type, finalImageUrls, id]
      );

      await connection.query('DELETE FROM copyrightAuthors WHERE copyrightId = ?', [id]);

      const handleStakeholders = async (list: any[], role: 'author' | 'owner') => {
        let counter = 0;
        for (const item of list) {
          const [sExist]: any = await connection.query('SELECT id FROM stakeholders WHERE name = ? AND address = ?', [item.name, item.address]);
          
          let sId;
          if (sExist.length > 0) {
            sId = sExist[0].id;
          } else {
            // SỬA LỖI TẠI ĐÂY: Thêm ID khi tạo Stakeholder mới trong lúc Update
            sId = Date.now() + (counter++);
            await connection.query('INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)', [sId, item.name, item.address]);
          }
          await connection.query('INSERT INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES (?, ?, ?)', [id, sId, role]);
        }
      };

      await handleStakeholders(authors, 'author');
      await handleStakeholders(owners, 'owner');

      await connection.commit();
      res.status(200).json({ success: true, message: 'Cập nhật thành công' });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
    } finally {
      connection.release();
    }
  }

  // 4. [DELETE] /api/copyrights/:id - XÓA (Admin/Staff)
  static async deleteCopyright(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Nhờ ràng buộc FOREIGN KEY ... ON DELETE CASCADE trong DB, 
      // khi xóa ở copyrights, dữ liệu ở copyrightAuthors sẽ tự động bị xóa theo.
      const [result]: any = await pool.query('DELETE FROM copyrights WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bản quyền để xóa' });
        return;
      }

      res.status(200).json({ success: true, message: 'Đã xóa bản quyền thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi xóa', error: error.message });
    }
  }
}

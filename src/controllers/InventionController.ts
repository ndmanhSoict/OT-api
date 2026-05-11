import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import pool from '../config/database';
import { asDate, asText, findOrCreateStakeholder, getCell, getRows, getStakeholders, hasAnyValue } from '../utils/importRows';

export class InventionController {

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const allowedFields: Record<string, string> = {
        name: 'name',
        applicationNumber: 'applicationNumber',
        publicationNumber: 'publicationNumber',
        certificateNumber: 'certificateNumber',
        ipcClassification: 'ipcClassification',
        status: 'status',
        applicationDate: 'CAST(applicationDate AS CHAR)',
        publicationDate: 'CAST(publicationDate AS CHAR)',
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
        const [rows]: any = await pool.query('SELECT * FROM inventions ORDER BY id DESC');
        res.status(200).json({ success: true, data: rows });
        return;
      }

      const [rows]: any = await pool.query(
        `SELECT * FROM inventions WHERE ${conditions.join(' AND ')}`,
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
        `SELECT * FROM inventions
         WHERE name LIKE ? OR applicationNumber LIKE ? OR publicationNumber LIKE ?
            OR certificateNumber LIKE ? OR ipcClassification LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(publicationDate AS CHAR) LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ?`,
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
        SELECT name, applicationNumber, ipcClassification, status, grantDate
        FROM inventions
      `;

      if (!rawQ) {
        const [rows]: any = await pool.query(`${baseSql} ORDER BY id DESC`);
        res.status(200).json({ success: true, data: rows });
        return;
      }

      const q = `%${rawQ}%`;
      const [rows]: any = await pool.query(
        `${baseSql}
         WHERE name LIKE ? OR applicationNumber LIKE ? OR publicationNumber LIKE ?
            OR certificateNumber LIKE ? OR ipcClassification LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(publicationDate AS CHAR) LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ?
         ORDER BY id DESC`,
        Array(9).fill(q)
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xuất dữ liệu sáng chế', error: error.message });
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
        const name = asText(getCell(row, ['Tên sáng chế', 'name']));
        if (!name) {
          skipped++;
          continue;
        }

        const inventionId = baseId + i;
        const applicant = getStakeholders(
          getCell(row, ['Chủ đơn', 'applicant']),
          getCell(row, ['Địa chỉ chủ đơn', 'applicantAddress'])
        )[0];
        const owner = getStakeholders(
          getCell(row, ['Chủ bằng/Chủ sở hữu', 'Chủ bằng', 'Chủ sở hữu', 'owner']),
          getCell(row, ['Địa chỉ chủ bằng/chủ sở hữu', 'Địa chỉ chủ bằng', 'Địa chỉ chủ sở hữu', 'ownerAddress'])
        )[0];
        const applicantId = applicant ? await findOrCreateStakeholder(connection, applicant, baseId + 100000 + i) : null;
        const ownerId = owner ? await findOrCreateStakeholder(connection, owner, baseId + 200000 + i) : null;

        await connection.query(
          `INSERT INTO inventions
            (id, name, applicationNumber, applicationDate, publicationNumber, publicationDate,
             certificateNumber, grantDate, ipcClassification, applicantId, ownerId, status, imageUrls)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inventionId,
            name,
            asText(getCell(row, ['Số đơn', 'Số đăng ký', 'applicationNumber'])),
            asDate(getCell(row, ['Ngày nộp', 'Ngày nộp đơn', 'applicationDate'])),
            asText(getCell(row, ['Số công bố', 'publicationNumber'])),
            asDate(getCell(row, ['Ngày công bố', 'publicationDate'])),
            asText(getCell(row, ['Số bằng', 'Số văn bằng', 'certificateNumber'])),
            asDate(getCell(row, ['Ngày cấp', 'grantDate'])),
            asText(getCell(row, ['Phân loại IPC', 'ipcClassification'])),
            applicantId,
            ownerId,
            asText(getCell(row, ['Trạng thái', 'status'])),
            JSON.stringify([]),
          ]
        );

        const authors = getStakeholders(
          getCell(row, ['Tác giả', 'authors']),
          getCell(row, ['Địa chỉ tác giả', 'authorAddress'])
        );
        for (let authorIndex = 0; authorIndex < authors.length; authorIndex++) {
          const stakeholderId = await findOrCreateStakeholder(connection, authors[authorIndex], baseId + 300000 + i * 20 + authorIndex);
          await connection.query(
            'INSERT IGNORE INTO inventionAuthors (inventionId, stakeholderId) VALUES (?, ?)',
            [inventionId, stakeholderId]
          );
        }
        imported++;
      }

      await connection.commit();
      res.status(201).json({ success: true, message: `Đã import ${imported} dòng`, imported, skipped });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi import sáng chế', error: error.message });
    } finally {
      connection.release();
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM inventions ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query(`
        SELECT i.*,
               applicant.name AS applicantName, applicant.address AS applicantAddress,
               owner.name AS ownerName, owner.address AS ownerAddress
        FROM inventions i
        LEFT JOIN stakeholders applicant ON i.applicantId = applicant.id
        LEFT JOIN stakeholders owner ON i.ownerId = owner.id
        WHERE i.id = ?`, [id]);

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sáng chế' });
        return;
      }

      const [authors]: any = await pool.query(`
        SELECT s.id, s.name, s.address
        FROM stakeholders s
        JOIN inventionAuthors ia ON s.id = ia.stakeholderId
        WHERE ia.inventionId = ?`, [id]);

      const row = rows[0];
      const result = {
        ...row,
        applicant: row.applicantId ? { id: row.applicantId, name: row.applicantName, address: row.applicantAddress } : null,
        owner: row.ownerId ? { id: row.ownerId, name: row.ownerName, address: row.ownerAddress } : null,
        authors,
      };
      delete result.applicantName;
      delete result.applicantAddress;
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
        name, applicationNumber, applicationDate, publicationNumber,
        publicationDate, certificateNumber, grantDate, ipcClassification, status,
      } = req.body;
      const nullable = (value: any) => value === undefined || value === '' ? null : value;
      const applicant = req.body.applicant ? JSON.parse(req.body.applicant) : null;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;
      const authors: any[] = JSON.parse(req.body.authors || '[]');
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

      const applicantId = applicant ? await findOrCreate(applicant) : null;
      const ownerId = owner ? await findOrCreate(owner) : null;

      await connection.query(
        `INSERT INTO inventions
          (id, name, applicationNumber, applicationDate, publicationNumber,
           publicationDate, certificateNumber, grantDate, ipcClassification, applicantId, ownerId, status, imageUrls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, applicationNumber, nullable(applicationDate), nullable(publicationNumber),
         nullable(publicationDate), nullable(certificateNumber), nullable(grantDate), nullable(ipcClassification), applicantId, ownerId, status, JSON.stringify(imageUrls)]
      );

      for (const author of authors) {
        const authorId = await findOrCreate(author);
        await connection.query(
          'INSERT INTO inventionAuthors (inventionId, stakeholderId) VALUES (?, ?)',
          [id, authorId]
        );
      }

      await connection.commit();
      res.status(201).json({ success: true, message: 'Tạo sáng chế thành công', id });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi tạo sáng chế', error: error.message });
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
        name, applicationNumber, applicationDate, publicationNumber,
        publicationDate, certificateNumber, grantDate, ipcClassification, status,
      } = req.body;
      const nullable = (value: any) => value === undefined || value === '' ? null : value;
      const applicant = req.body.applicant ? JSON.parse(req.body.applicant) : null;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;
      const authors: any[] = JSON.parse(req.body.authors || '[]');

      const [existing]: any = await connection.query('SELECT imageUrls FROM inventions WHERE id = ?', [id]);
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sáng chế' });
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

      const applicantId = applicant ? await findOrCreate(applicant) : null;
      const ownerId = owner ? await findOrCreate(owner) : null;

      await connection.query(
        `UPDATE inventions SET
          name=?, applicationNumber=?, applicationDate=?, publicationNumber=?, publicationDate=?,
          certificateNumber=?, grantDate=?, ipcClassification=?, applicantId=?, ownerId=?, status=?, imageUrls=?
         WHERE id=?`,
        [name, applicationNumber, nullable(applicationDate), nullable(publicationNumber), nullable(publicationDate),
         nullable(certificateNumber), nullable(grantDate), nullable(ipcClassification), applicantId, ownerId, status, finalImageUrls, id]
      );

      await connection.query('DELETE FROM inventionAuthors WHERE inventionId = ?', [id]);
      for (const author of authors) {
        const authorId = await findOrCreate(author);
        await connection.query(
          'INSERT INTO inventionAuthors (inventionId, stakeholderId) VALUES (?, ?)',
          [id, authorId]
        );
      }

      await connection.commit();
      res.status(200).json({ success: true, message: 'Cập nhật sáng chế thành công' });
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
      const [result]: any = await pool.query('DELETE FROM inventions WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sáng chế để xóa' });
        return;
      }
      res.status(200).json({ success: true, message: 'Đã xóa sáng chế thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
    }
  }
}

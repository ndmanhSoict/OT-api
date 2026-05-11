import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import pool from '../config/database';
import { asDate, asText, findOrCreateStakeholder, getCell, getRows, getStakeholders, hasAnyValue } from '../utils/importRows';

export class IndustrialDesignController {

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const allowedFields: Record<string, string> = {
        name: 'name',
        applicationNumber: 'applicationNumber',
        publicationNumber: 'publicationNumber',
        certificateNumber: 'certificateNumber',
        locarnoClassification: 'locarnoClassification',
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
        const [rows]: any = await pool.query('SELECT * FROM industrialDesigns ORDER BY id DESC');
        res.status(200).json({ success: true, data: rows });
        return;
      }

      const [rows]: any = await pool.query(
        `SELECT * FROM industrialDesigns WHERE ${conditions.join(' AND ')}`,
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
        `SELECT * FROM industrialDesigns
         WHERE name LIKE ? OR applicationNumber LIKE ? OR publicationNumber LIKE ?
            OR certificateNumber LIKE ? OR locarnoClassification LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(publicationDate AS CHAR) LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ? OR CAST(expirationDate AS CHAR) LIKE ?`,
        Array(10).fill(q)
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
        SELECT name, applicationNumber, locarnoClassification, status, expirationDate
        FROM industrialDesigns
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
            OR certificateNumber LIKE ? OR locarnoClassification LIKE ? OR status LIKE ?
            OR CAST(applicationDate AS CHAR) LIKE ? OR CAST(publicationDate AS CHAR) LIKE ?
            OR CAST(grantDate AS CHAR) LIKE ? OR CAST(expirationDate AS CHAR) LIKE ?
         ORDER BY id DESC`,
        Array(10).fill(q)
      );
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xuất dữ liệu kiểu dáng công nghiệp', error: error.message });
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
        const name = asText(getCell(row, ['Tên kiểu dáng', 'name']));
        if (!name) {
          skipped++;
          continue;
        }

        const industrialDesignId = baseId + i;
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
          `INSERT INTO industrialDesigns
            (id, name, applicationNumber, applicationDate, publicationNumber, publicationDate,
             certificateNumber, grantDate, expirationDate, locarnoClassification, applicantId, ownerId, status, imageUrls)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            industrialDesignId,
            name,
            asText(getCell(row, ['Số đơn', 'Số đăng ký', 'applicationNumber'])),
            asDate(getCell(row, ['Ngày nộp', 'Ngày nộp đơn', 'applicationDate'])),
            asText(getCell(row, ['Số công bố', 'publicationNumber'])),
            asDate(getCell(row, ['Ngày công bố', 'publicationDate'])),
            asText(getCell(row, ['Số bằng', 'Số văn bằng', 'certificateNumber'])),
            asDate(getCell(row, ['Ngày cấp', 'grantDate'])),
            asDate(getCell(row, ['Ngày hết hạn', 'Hết hạn', 'expirationDate'])),
            asText(getCell(row, ['Phân loại Locarno', 'locarnoClassification'])),
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
            'INSERT IGNORE INTO industrialDesignAuthors (industrialDesignId, stakeholderId) VALUES (?, ?)',
            [industrialDesignId, stakeholderId]
          );
        }
        imported++;
      }

      await connection.commit();
      res.status(201).json({ success: true, message: `Đã import ${imported} dòng`, imported, skipped });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi import kiểu dáng công nghiệp', error: error.message });
    } finally {
      connection.release();
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await pool.query('SELECT * FROM industrialDesigns ORDER BY id DESC');
      res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query(`
        SELECT d.*,
               applicant.name AS applicantName, applicant.address AS applicantAddress,
               owner.name AS ownerName, owner.address AS ownerAddress
        FROM industrialDesigns d
        LEFT JOIN stakeholders applicant ON d.applicantId = applicant.id
        LEFT JOIN stakeholders owner ON d.ownerId = owner.id
        WHERE d.id = ?`, [id]);

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy kiểu dáng công nghiệp' });
        return;
      }

      const [authors]: any = await pool.query(`
        SELECT s.id, s.name, s.address
        FROM stakeholders s
        JOIN industrialDesignAuthors ida ON s.id = ida.stakeholderId
        WHERE ida.industrialDesignId = ?`, [id]);

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
        publicationDate, certificateNumber, grantDate, expirationDate,
        locarnoClassification, status,
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
        `INSERT INTO industrialDesigns
          (id, name, applicationNumber, applicationDate, publicationNumber, publicationDate,
           certificateNumber, grantDate, expirationDate, locarnoClassification, applicantId, ownerId, status, imageUrls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, applicationNumber, nullable(applicationDate), nullable(publicationNumber), nullable(publicationDate),
         nullable(certificateNumber), nullable(grantDate), nullable(expirationDate), nullable(locarnoClassification), applicantId, ownerId, status, JSON.stringify(imageUrls)]
      );

      for (const author of authors) {
        const authorId = await findOrCreate(author);
        await connection.query(
          'INSERT INTO industrialDesignAuthors (industrialDesignId, stakeholderId) VALUES (?, ?)',
          [id, authorId]
        );
      }

      await connection.commit();
      res.status(201).json({ success: true, message: 'Tạo kiểu dáng công nghiệp thành công', id });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi tạo kiểu dáng công nghiệp', error: error.message });
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
        publicationDate, certificateNumber, grantDate, expirationDate,
        locarnoClassification, status,
      } = req.body;
      const nullable = (value: any) => value === undefined || value === '' ? null : value;
      const applicant = req.body.applicant ? JSON.parse(req.body.applicant) : null;
      const owner = req.body.owner ? JSON.parse(req.body.owner) : null;
      const authors: any[] = JSON.parse(req.body.authors || '[]');

      const [existing]: any = await connection.query('SELECT imageUrls FROM industrialDesigns WHERE id = ?', [id]);
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy kiểu dáng công nghiệp' });
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
        `UPDATE industrialDesigns SET
          name=?, applicationNumber=?, applicationDate=?, publicationNumber=?, publicationDate=?,
          certificateNumber=?, grantDate=?, expirationDate=?, locarnoClassification=?, applicantId=?, ownerId=?, status=?, imageUrls=?
         WHERE id=?`,
        [name, applicationNumber, nullable(applicationDate), nullable(publicationNumber), nullable(publicationDate),
         nullable(certificateNumber), nullable(grantDate), nullable(expirationDate), nullable(locarnoClassification), applicantId, ownerId, status, finalImageUrls, id]
      );

      await connection.query('DELETE FROM industrialDesignAuthors WHERE industrialDesignId = ?', [id]);
      for (const author of authors) {
        const authorId = await findOrCreate(author);
        await connection.query(
          'INSERT INTO industrialDesignAuthors (industrialDesignId, stakeholderId) VALUES (?, ?)',
          [id, authorId]
        );
      }

      await connection.commit();
      res.status(200).json({ success: true, message: 'Cập nhật kiểu dáng công nghiệp thành công' });
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
      const [result]: any = await pool.query('DELETE FROM industrialDesigns WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy kiểu dáng công nghiệp để xóa' });
        return;
      }
      res.status(200).json({ success: true, message: 'Đã xóa kiểu dáng công nghiệp thành công' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
    }
  }
}

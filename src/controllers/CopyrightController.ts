import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader } from 'mysql2';

export class CopyrightController {
  
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

      const files = req.files as Express.Multer.File[];
      let finalImageUrls = existing[0].imageUrls;
      if (files && files.length > 0) {
        finalImageUrls = JSON.stringify(files.map(file => `/uploads/${file.filename}`));
      }

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
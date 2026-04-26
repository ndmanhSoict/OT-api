import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader } from 'mysql2';

export class CopyrightController {
  
  // 1. [POST] /api/copyrights - TẠO MỚI (Admin/Staff)
  static async createCopyright(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { certificateNumber, grantDate, title, type } = req.body;
      const authors = JSON.parse(req.body.authors || '[]');
      const owners = JSON.parse(req.body.owners || '[]');

      // Xử lý ảnh từ multer
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];

      const copyrightId = Date.now();

      // Lưu vào bảng chính
      await connection.query(
        'INSERT INTO copyrights (id, certificateNumber, grantDate, title, type, imageUrls) VALUES (?, ?, ?, ?, ?, ?)',
        [copyrightId, certificateNumber, grantDate, title, type, JSON.stringify(imageUrls)]
      );

      // Hàm xử lý Stakeholders và liên kết
      const handleStakeholders = async (list: any[], role: 'author' | 'owner') => {
        for (const item of list) {
          // Tìm xem stakeholder đã tồn tại chưa (theo tên + địa chỉ)
          const [existing]: any = await connection.query(
            'SELECT id FROM stakeholders WHERE name = ? AND address = ?',
            [item.name, item.address]
          );

          let stakeholderId;
          if (existing.length > 0) {
            stakeholderId = existing[0].id;
          } else {
            const [insertRes]: any = await connection.query(
              'INSERT INTO stakeholders (name, address) VALUES (?, ?)',
              [item.name, item.address]
            );
            stakeholderId = insertRes.insertId;
          }

          // Tạo liên kết vào bảng copyrightAuthors
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

  // 3. [PUT] /api/copyrights/:id - CẬP NHẬT (Admin/Staff)
  static async updateCopyright(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;
      const { certificateNumber, grantDate, title, type } = req.body;
      const authors = JSON.parse(req.body.authors || '[]');
      const owners = JSON.parse(req.body.owners || '[]');

      // Kiểm tra xem bản quyền có tồn tại không
      const [existing]: any = await connection.query('SELECT imageUrls FROM copyrights WHERE id = ?', [id]);
      if (existing.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bản quyền' });
        return;
      }

      // Xử lý ảnh (Nếu có upload mới thì thay thế, nếu không thì giữ nguyên cũ)
      const files = req.files as Express.Multer.File[];
      let finalImageUrls = existing[0].imageUrls;
      if (files && files.length > 0) {
        const newImages = files.map(file => `/uploads/${file.filename}`);
        finalImageUrls = JSON.stringify(newImages);
      }

      // Cập nhật bảng chính
      await connection.query(
        'UPDATE copyrights SET certificateNumber = ?, grantDate = ?, title = ?, type = ?, imageUrls = ? WHERE id = ?',
        [certificateNumber, grantDate, title, type, finalImageUrls, id]
      );

      // Xử lý lại Stakeholders: Cách an toàn nhất là xóa liên kết cũ và tạo lại
      await connection.query('DELETE FROM copyrightAuthors WHERE copyrightId = ?', [id]);

      const handleStakeholders = async (list: any[], role: 'author' | 'owner') => {
        for (const item of list) {
          const [sExist]: any = await connection.query('SELECT id FROM stakeholders WHERE name = ? AND address = ?', [item.name, item.address]);
          let sId = sExist.length > 0 ? sExist[0].id : (await connection.query('INSERT INTO stakeholders (name, address) VALUES (?, ?)', [item.name, item.address]) as any)[0].insertId;
          await connection.query('INSERT INTO copyrightAuthors (copyrightId, stakeholderId, role) VALUES (?, ?, ?)', [id, sId, role]);
        }
      };

      await handleStakeholders(authors, 'author');
      await handleStakeholders(owners, 'owner');

      await connection.commit();
      res.status(200).json({ success: true, message: 'Cập nhật bản quyền thành công' });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật', error: error.message });
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
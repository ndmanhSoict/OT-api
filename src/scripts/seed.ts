import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load biến môi trường từ file .env ở thư mục gốc
dotenv.config();

async function seedDatabase() {
  const dbName = process.env.DB_NAME || 'SHTT_db';

  // 1. Kết nối thẳng vào Server MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mat_khau_cua_ban',
    multipleStatements: true, 
  });

  console.log('✅ Đã kết nối tới Server MySQL!');

  try {
    // 2. TỰ ĐỘNG TẠO DATABASE NẾU CHƯA CÓ
    console.log(`📦 Đang kiểm tra và tạo database '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    
    // 3. CHỌN DATABASE ĐỂ THAO TÁC
    await connection.query(`USE \`${dbName}\`;`);

    // 4. XÓA BẢNG CŨ (Reset Database)
    console.log('🗑️ Đang dọn dẹp các bảng cũ (nếu có)...');
    await connection.query(`
      SET FOREIGN_KEY_CHECKS = 0;
      DROP TABLE IF EXISTS copyrightAuthors, inventionAuthors, industrialDesignAuthors;
      DROP TABLE IF EXISTS copyrights, geographicalIndications, trademarks, inventions, industrialDesigns, craftVillages;
      DROP TABLE IF EXISTS stakeholders, users;
      SET FOREIGN_KEY_CHECKS = 1;
    `);

    // 5. TẠO CẤU TRÚC BẢNG TỪ db.sql
    console.log('📝 Đang khởi tạo cấu trúc bảng từ db.sql...');
    const sqlFilePath = path.join(__dirname, '../../db.sql');
    const sqlSchema = fs.readFileSync(sqlFilePath, 'utf-8');
    await connection.query(sqlSchema);

    // 6. BƠM DỮ LIỆU MẪU (MOCK DATA)
    console.log('🌱 Đang bơm dữ liệu mẫu (Mock Data)...');

    // -> 6.1. Thêm Users (Sử dụng ID theo thời gian thực)
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'Test@123';
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(defaultPassword, bcryptRounds);

    // Tạo 2 ID timestamp khác nhau một chút
    const adminId = Date.now();
    const staffId = Date.now() + 1;

    console.log(`🔐 Tạo tài khoản Admin (ID: ${adminId}) và Staff (ID: ${staffId})`);

    await connection.query(`
      INSERT INTO users (id, username, fullName, passwordHash, role) VALUES 
      (?, 'admin@bacninh.gov.vn', 'Admin Name', ?, 'admin'),
      (?, 'staff@bacninh.gov.vn', 'Staff Name', ?, 'staff')
    `, [adminId, hashedPassword, staffId, hashedPassword]);

    // -> 6.2. Thêm Chủ thể (Stakeholders)
    // Stakeholders vẫn có thể dùng AUTO_INCREMENT hoặc bạn có thể sửa db.sql để dùng BIGINT tương tự
    await connection.query(`
      INSERT INTO stakeholders (name, address) VALUES 
      ('Nguyễn Văn A', 'Thành phố Bắc Ninh, Tỉnh Bắc Ninh'),
      ('Công ty TNHH Gốm Sứ Phù Lãng', 'Thị xã Quế Võ, Tỉnh Bắc Ninh'),
      ('Trần Thị B', 'Huyện Yên Phong, Tỉnh Bắc Ninh')
    `);

    // -> 6.3. Thêm Làng Nghề
    await connection.query(`
      INSERT INTO craftVillages (name, product, address, certificateNumber, recognitionDate, imageUrls) VALUES 
      ('Làng nghề Gốm Phù Lãng', 'Gốm sứ trang trí, gia dụng', 'Xã Phù Lãng, Thị xã Quế Võ, Tỉnh Bắc Ninh', 'LN-001', '2000-01-01', '["https://example.com/gom1.jpg"]')
    `);

    // -> 6.4. Thêm Nhãn Hiệu
    await connection.query(`
      INSERT INTO trademarks (trademarkSample, name, type, applicationNumber, applicationDate, publicationNumber, publicationDate, certificateNumber, grantDate, expirationDate, productServiceGroup, classification, ownerId, status, imageUrls) VALUES 
      ('https://example.com/logo-phuthe.png', 'Bánh Phu Thê Đình Bảng', 'Nhãn hiệu tập thể', 'NH-2023-001', '2023-01-10', 'CB-001', '2023-02-10', 'GC-001', '2023-10-10', '2033-10-10', 'Nhóm 30: Bánh kẹo', 'Hình + Chữ', 2, 'Đã cấp bằng', '[]')
    `);

    // -> 6.5. Thêm Sáng Chế
    const [inventionResult]: any = await connection.query(`
      INSERT INTO inventions (name, applicationNumber, applicationDate, publicationNumber, publicationDate, certificateNumber, grantDate, ipcClassification, ownerId, status, imageUrls) VALUES 
      ('Quy trình nung gốm tiết kiệm năng lượng', 'SC-2022-100', '2022-06-20', 'SC-CB-100', '2022-08-20', 'SC-GC-100', '2024-01-15', 'C02F 1/00', 2, 'Đã cấp bằng', '[]')
    `);

    const newInventionId = inventionResult.insertId;
    await connection.query(`
      INSERT INTO inventionAuthors (inventionId, stakeholderId) VALUES 
      (?, 1), 
      (?, 3)
    `, [newInventionId, newInventionId]);

    console.log('🎉 Khởi tạo và Seed dữ liệu THÀNH CÔNG!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thao tác database:', error);
  } finally {
    await connection.end();
  }
}

seedDatabase();
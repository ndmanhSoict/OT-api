import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const dbName = process.env.DB_NAME || 'SHTT_db';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mat_khau_cua_ban',
    multipleStatements: true, 
  });

  try {
    console.log('📦 Đang thiết lập lại Database...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    // 1. XÓA SẠCH BẢNG CŨ (Để loại bỏ hoàn toàn kiểu INT cũ)
    console.log('🗑️  Đang xóa các bảng cũ (nếu có)...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query(`
      DROP TABLE IF EXISTS copyrightAuthors, inventionAuthors, industrialDesignAuthors;
      DROP TABLE IF EXISTS copyrights, geographicalIndications, trademarks, inventions, industrialDesigns, craftVillages;
      DROP TABLE IF EXISTS stakeholders, users;
    `);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. CHẠY FILE db.sql ĐỂ TẠO CẤU TRÚC MỚI (BIGINT)
    console.log('📝 Đang tạo lại cấu trúc bảng từ file db.sql...');
    const sqlFilePath = path.join(__dirname, '../../db.sql');
    const sqlSchema = fs.readFileSync(sqlFilePath, 'utf-8');
    await connection.query(sqlSchema);

    // 3. TẠO ID MỚI (Cách nhau khoảng cách an toàn để không bị trùng)
    const baseTime = Date.now();
    const ids = {
      admin: baseTime + 10,
      staff: baseTime + 20,
      stakeholder1: baseTime + 30,
      stakeholder2: baseTime + 40,
      copyright1: baseTime + 50
    };

    console.log('🌱 Đang bơm dữ liệu mẫu...');

    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    // Seed Users
    await connection.query(`
      INSERT INTO users (id, username, fullName, passwordHash, role) VALUES 
      (?, 'admin@bacninh.gov.vn', 'Admin', ?, 'admin'),
      (?, 'staff@bacninh.gov.vn', 'Staff', ?, 'staff')
    `, [ids.admin, hashedPassword, ids.staff, hashedPassword]);

    // Seed Stakeholders
    await connection.query(`
      INSERT INTO stakeholders (id, name, address) VALUES 
      (?, 'Công ty Công nghệ ABC', 'Thành phố Bắc Ninh'),
      (?, 'Nguyễn Văn A', 'Huyện Tiên Du, Bắc Ninh')
    `, [ids.stakeholder1, ids.stakeholder2]);

    // Seed Copyrights
    await connection.query(`
      INSERT INTO copyrights (id, certificateNumber, grantDate, title, type, ownerId, imageUrls) 
      VALUES (?, '123/2024/QTG', '2024-01-20', 'Phần mềm A', 'Phần mềm', ?, ?)
    `, [ids.copyright1, ids.stakeholder1, JSON.stringify([])]);

    // Seed Bảng trung gian
    await connection.query(`
      INSERT INTO copyrightAuthors (copyrightId, stakeholderId, role) 
      VALUES (?, ?, 'Tác giả')
    `, [ids.copyright1, ids.stakeholder2]);

    console.log('🎉 Seed dữ liệu THÀNH CÔNG!');
  } catch (error) {
    console.error('❌ Lỗi Seed:', error);
  } finally {
    await connection.end();
  }
}

seedDatabase();
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'mat_khau_cua_ban',
    database: process.env.DB_NAME || 'SHTT_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  try {
    console.log('📄 Đọc file schema.sql...');
    const sqlPath = path.join(__dirname, '../../schema.sql');
    let sql = fs.readFileSync(sqlPath, 'utf-8');

    // Bỏ qua CREATE DATABASE và USE vì đã kết nối thẳng vào database
    sql = sql
      .replace(/CREATE DATABASE[^;]+;/gi, '')
      .replace(/USE\s+\S+;/gi, '');

    console.log('🚀 Chạy migration...');
    await connection.query(sql);
    console.log('✅ Migration hoàn thành!');
  } catch (error) {
    console.error('❌ Migration thất bại:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();

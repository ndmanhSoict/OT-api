import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Tạo và export Connection Pool thực sự để các Controller sử dụng
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3308,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mat_khau_cua_ban',
  database: process.env.DB_NAME || 'SHTT_db', // Đổi tên DB cho khớp với file seed
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
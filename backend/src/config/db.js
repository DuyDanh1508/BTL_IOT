const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci'
});

// Test kết nối khi khởi động
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Đã kết nối MySQL:', process.env.DB_NAME);
        conn.release();
    } catch (err) {
        console.error('❌ Lỗi kết nối MySQL:', err.message);
    }
})();

module.exports = pool;
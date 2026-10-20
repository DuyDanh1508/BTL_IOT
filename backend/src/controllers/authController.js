const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// ============================================================
// ĐĂNG KÝ
// POST /api/auth/register
// Body: { full_name, password }
// ============================================================
exports.register = async (req, res) => {
    const { full_name, password } = req.body;

    if (!full_name || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập đầy đủ thông tin'
        });
    }

    if (full_name.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Họ tên phải có ít nhất 3 ký tự'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
    }

    try {
        // Kiểm tra trùng
        const [exist] = await db.query(
            'SELECT id FROM users WHERE full_name = ?',
            [full_name]
        );

        if (exist.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Họ tên này đã được đăng ký'
            });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Insert
        const [result] = await db.query(
            'INSERT INTO users (full_name, password) VALUES (?, ?)',
            [full_name, hashed]
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            user: { id: result.insertId, full_name }
        });
    } catch (err) {
        console.error('❌ Register error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// ĐĂNG NHẬP
// POST /api/auth/login
// Body: { full_name, password }
// ============================================================
exports.login = async (req, res) => {
    const { full_name, password } = req.body;

    if (!full_name || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập đầy đủ thông tin'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE full_name = ?',
            [full_name]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Họ tên hoặc mật khẩu không đúng'
            });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Họ tên hoặc mật khẩu không đúng'
            });
        }

        // Tạo JWT
        const token = jwt.sign(
            { id: user.id, full_name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: { id: user.id, full_name: user.full_name }
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// LẤY THÔNG TIN USER HIỆN TẠI
// GET /api/auth/me
// ============================================================
exports.me = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, full_name, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }

        res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('❌ Me error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
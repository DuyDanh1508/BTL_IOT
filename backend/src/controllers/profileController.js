const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// ============================================================
// LẤY PROFILE CỦA USER ĐANG ĐĂNG NHẬP
// GET /api/profile
// ============================================================
exports.getProfile = async (req, res) => {
    try {
        
        const userId = req.user.id; 

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        const [rows] = await db.query(
            `SELECT id, full_name, msv, class_name,
                    github, figma, postman, pdf, avatar
             FROM users WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ getProfile error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// CẬP NHẬT PROFILE
// PUT /api/profile
// Body: { msv, class_name, github, figma, postman, pdf }
// ============================================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.user_id;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        const { msv, class_name, github, figma, postman, pdf } = req.body;

        await db.query(
            `UPDATE users
             SET msv = ?, class_name = ?, github = ?, figma = ?, postman = ?, pdf = ?
             WHERE id = ?`,
            [msv || null, class_name || null, github || null, figma || null, postman || null, pdf || null, userId]
        );

        res.json({ success: true, message: 'Cập nhật profile thành công' });
    } catch (err) {
        console.error('❌ updateProfile error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// UPLOAD AVATAR
// POST /api/profile/avatar
// Form-data: avatar (file), user_id (nếu không có token)
// ============================================================
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Chưa chọn file' });
        }

        const userId = req.user?.id || req.body.user_id;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // Xóa avatar cũ nếu có
        const [rows] = await db.query('SELECT avatar FROM users WHERE id = ?', [userId]);
        if (rows.length > 0 && rows[0].avatar) {
            const oldPath = path.join(__dirname, '../../', rows[0].avatar);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
                console.log('🗑️ Đã xóa avatar cũ:', oldPath);
            }
        }

        await db.query(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [avatarUrl, userId]
        );

        res.json({
            success: true,
            message: 'Upload avatar thành công',
            avatar: avatarUrl
        });
    } catch (err) {
        console.error('❌ uploadAvatar error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
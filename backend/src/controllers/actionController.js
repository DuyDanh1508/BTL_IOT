const db = require('../config/db');

// ============================================================
// LẤY LỊCH SỬ HÀNH ĐỘNG (CÓ LỌC + PHÂN TRANG)
// GET /api/actions?device_id=1&action=ON&status=SUCCESS&from=...&to=...&page=1&limit=10
// ============================================================
exports.getHistory = async (req, res) => {
    const {
        device_id,
        user_id,
        action,
        status,
        from,
        to,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (device_id) { conditions.push('a.device_id = ?'); params.push(parseInt(device_id)); }
    if (user_id)   { conditions.push('a.user_id = ?');   params.push(parseInt(user_id)); }
    if (action)    { conditions.push('a.action = ?');    params.push(action); }
    if (status)    { conditions.push('a.status = ?');    params.push(status); }
    if (from)      { conditions.push('a.created_at >= ?'); params.push(from); }
    if (to)        { conditions.push('a.created_at <= ?'); params.push(to); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    try {
        const [rows] = await db.query(
            `SELECT a.id, a.user_id, u.full_name AS user_name,
                    a.device_id, d.name AS device_name,
                    a.action, a.status, a.created_at
             FROM actions a
             JOIN users   u ON u.id = a.user_id
             JOIN devices d ON d.id = a.device_id
             ${where}
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) AS total FROM actions a ${where}`,
            params
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('❌ getActions error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// LẤY STATUS CỦA MỘT ACTION CỤ THỂ
// GET /api/actions/:id
// ============================================================
exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, d.name AS device_name
             FROM actions a
             JOIN devices d ON d.id = a.device_id
             WHERE a.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy action' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ getActionById error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
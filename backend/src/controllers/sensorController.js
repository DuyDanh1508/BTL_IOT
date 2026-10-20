const db = require('../config/db');

// ============================================================
// LẤY GIÁ TRỊ CẢM BIẾN MỚI NHẤT
// GET /api/sensors/latest
// ============================================================
exports.getLatest = async (req, res) => {
    try {
        // Lấy giá trị mới nhất của mỗi sensor
        const [temp] = await db.query(
            `SELECT value, created_at FROM sensor_values
             WHERE sensor_id = 1 ORDER BY created_at DESC LIMIT 1`
        );
        const [humid] = await db.query(
            `SELECT value, created_at FROM sensor_values
             WHERE sensor_id = 2 ORDER BY created_at DESC LIMIT 1`
        );
        const [light] = await db.query(
            `SELECT value, created_at FROM sensor_values
             WHERE sensor_id = 3 ORDER BY created_at DESC LIMIT 1`
        );

        res.json({
            success: true,
            data: {
                temperature: temp[0]  ? { value: temp[0].value,  time: temp[0].created_at }  : null,
                humidity:    humid[0] ? { value: humid[0].value, time: humid[0].created_at } : null,
                light:       light[0] ? { value: light[0].value, time: light[0].created_at } : null
            }
        });
    } catch (err) {
        console.error('❌ getLatest error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// LẤY LỊCH SỬ CẢM BIẾN (CÓ LỌC + PHÂN TRANG)
// GET /api/sensors/history?sensor_id=1&from=2026-01-01&to=2026-12-31&page=1&limit=20
// ============================================================
exports.getHistory = async (req, res) => {
    const {
        sensor_id,
        from,
        to,
        page = 1,
        limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (sensor_id) {
        conditions.push('sv.sensor_id = ?');
        params.push(parseInt(sensor_id));
    }
    if (from) {
        conditions.push('sv.created_at >= ?');
        params.push(from);
    }
    if (to) {
        conditions.push('sv.created_at <= ?');
        params.push(to);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    try {
        const [rows] = await db.query(
            `SELECT sv.id, sv.sensor_id, s.name AS sensor_name,
                    sv.value, sv.created_at
             FROM sensor_values sv
             JOIN sensors s ON s.id = sv.sensor_id
             ${where}
             ORDER BY sv.created_at DESC, sv.sensor_id ASC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const [countResult] = await db.query(
            `SELECT COUNT(*) AS total FROM sensor_values sv ${where}`,
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
        console.error('❌ getHistory error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// LẤY DỮ LIỆU BIỂU ĐỒ (12 điểm gần nhất)
// GET /api/sensors/chart?range=12h
// ============================================================
exports.getChart = async (req, res) => {
    try {
        // Lấy 20 giá trị mới nhất của mỗi sensor
        const LIMIT = 20;

        const [temps]  = await db.query(
            `SELECT value, created_at FROM sensor_values
             WHERE sensor_id = 1 ORDER BY created_at DESC LIMIT ?`,
            [LIMIT]
        );
        const [humids] = await db.query(
            `SELECT value, created_at FROM sensor_values
             WHERE sensor_id = 2 ORDER BY created_at DESC LIMIT ?`,
            [LIMIT]
        );
        const [lights] = await db.query(
            `SELECT value, created_at FROM sensor_values
             WHERE sensor_id = 3 ORDER BY created_at DESC LIMIT ?`,
            [LIMIT]
        );

        // ✅ Format thời gian thành HH:MM:SS
        const formatTime = (d) => {
            const dt = new Date(d);
            const h = String(dt.getHours()).padStart(2, '0');
            const m = String(dt.getMinutes()).padStart(2, '0');
            const s = String(dt.getSeconds()).padStart(2, '0');
            return `${h}:${m}:${s}`;
        };

        // ✅ Đảo ngược để cũ → mới (bên trái → bên phải)
        const tempArr = temps.map(r => ({
            value: parseFloat(r.value),
            time: formatTime(r.created_at)
        })).reverse();

        const humidArr = humids.map(r => ({
            value: parseFloat(r.value),
            time: formatTime(r.created_at)
        })).reverse();

        const lightArr = lights.map(r => ({
            value: parseFloat(r.value),
            time: formatTime(r.created_at)
        })).reverse();

        // ✅ Trả về đúng cấu trúc frontend cần
        res.json({
            success: true,
            data: {
                labels:      tempArr.map(r => r.time),
                temperature: tempArr.map(r => r.value),
                humidity:    humidArr.map(r => r.value),
                light:       lightArr.map(r => r.value)
            }
        });
    } catch (err) {
        console.error('❌ getChart error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
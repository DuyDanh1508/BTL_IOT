const db = require('../config/db');
const { sendCommand, registerPendingAction } = require('../services/mqttService');
const { broadcast } = require('../services/wsService');

// ============================================================
// LẤY DANH SÁCH THIẾT BỊ
// GET /api/devices
// ============================================================
exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM devices ORDER BY id');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('❌ getDevices error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================================
// ĐIỀU KHIỂN THIẾT BỊ
// POST /api/devices/:id/control
// Body: { action: "ON" | "OFF" }
// ============================================================
exports.control = async (req, res) => {
    const deviceId = parseInt(req.params.id);
    const { action } = req.body;
    const userId = req.user.id;

    if (!['ON', 'OFF'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Action phải là ON hoặc OFF'
        });
    }

    try {
        const [devices] = await db.query('SELECT * FROM devices WHERE id = ?', [deviceId]);
        if (devices.length === 0) {
            return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
        }

        // ✅ Dòng 1: INSERT với status = LOADING
        const [result] = await db.query(
            `INSERT INTO actions (user_id, device_id, action, status)
             VALUES (?, ?, ?, 'LOADING')`,
            [userId, deviceId, action]
        );

        const actionId = result.insertId;

        // ✅ Truyền thêm userId + deviceId để khi ESP32 phản hồi có thể INSERT dòng mới
        registerPendingAction(deviceId, action, actionId, userId, deviceId);

        // Gửi lệnh MQTT
        sendCommand(deviceId, action);

        res.status(202).json({
            success: true,
            message: 'Đã gửi lệnh điều khiển',
            action_id: actionId,
            device_id: deviceId,
            action
        });

        // Broadcast cho các client khác
        broadcast('action_pending', {
            action_id: actionId,
            device_id: deviceId,
            action,
            status: 'LOADING'
        });
    } catch (err) {
        console.error('❌ control error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
// ============================================================
// LẤY TRẠNG THÁI HIỆN TẠI CỦA TẤT CẢ THIẾT BỊ
// GET /api/devices/status
// ============================================================
// Cách làm: Với mỗi device, lấy action MỚI NHẤT có status = SUCCESS
// → đó là trạng thái hiện tại.
// ============================================================
exports.getStatus = async (req, res) => {
    try {
        const [devices] = await db.query('SELECT id, name FROM devices ORDER BY id');
        const statuses = [];

        for (const device of devices) {
            // ✅ Lấy action MỚI NHẤT (bất kể status) — để biết ý định cuối cùng
            // Nếu status = SUCCESS → dùng action đó
            // Nếu status = LOADING/FAILED → vẫn dùng action đó (vì user vừa bấm)
            const [rows] = await db.query(
                `SELECT action, status, created_at
                 FROM actions
                 WHERE device_id = ?
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [device.id]
            );

            let currentAction = 'OFF';   // Mặc định

            if (rows.length > 0) {
                const latest = rows[0];
                // Nếu action mới nhất thành công → dùng luôn
                if (latest.status === 'SUCCESS') {
                    currentAction = latest.action;
                } else {
                    // Nếu đang LOADING hoặc FAILED → thử tìm action SUCCESS gần nhất trước đó
                    const [prev] = await db.query(
                        `SELECT action FROM actions
                         WHERE device_id = ? AND status = 'SUCCESS'
                         ORDER BY created_at DESC
                         LIMIT 1`,
                        [device.id]
                    );
                    currentAction = prev.length > 0 ? prev[0].action : 'OFF';
                }
            }

            statuses.push({
                device_id: device.id,
                device_name: device.name,
                action: currentAction,
                last_update: rows.length > 0 ? rows[0].created_at : null
            });
        }

        res.json({ success: true, data: statuses });
    } catch (err) {
        console.error('❌ getStatus error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
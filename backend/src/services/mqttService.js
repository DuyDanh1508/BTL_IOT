const mqttClient = require('../config/mqtt');
const db = require('../config/db');
const { broadcast } = require('./wsService');
const { MQTT_TOPICS, SENSOR_IDS, ACTION_STATUS } = require('../config/constants');

// Lưu thông tin action đang chờ kết quả
// Key: `${led_id}:${action}` → Value: { actionId, userId, deviceId }
const pendingActions = new Map();

// ============================================================
// KHỞI TẠO
// ============================================================
function initMQTTService() {
    mqttClient.on('connect', () => {
        mqttClient.subscribe(MQTT_TOPICS.SENSOR_DATA,  { qos: 1 });
        mqttClient.subscribe(MQTT_TOPICS.DEVICE_STATUS, { qos: 1 });
        console.log('📡 Đã subscribe:', MQTT_TOPICS.SENSOR_DATA, '&', MQTT_TOPICS.DEVICE_STATUS);
    });

    mqttClient.on('message', handleMessage);
}

// ============================================================
// XỬ LÝ MESSAGE
// ============================================================
async function handleMessage(topic, messageBuffer) {
    const message = messageBuffer.toString();
    console.log(`📨 MQTT [${topic}]:`, message);

    try {
        const payload = JSON.parse(message);

        if (topic === MQTT_TOPICS.SENSOR_DATA) {
            await handleSensorData(payload);
        } else if (topic === MQTT_TOPICS.DEVICE_STATUS) {
            await handleDeviceStatus(payload);
        }
    } catch (err) {
        console.error('❌ Lỗi parse MQTT:', err.message);
    }
}

// ============================================================
// 1. XỬ LÝ DỮ LIỆU CẢM BIẾN
// ============================================================
async function handleSensorData(payload) {
    const { temperature, humidity, light } = payload;
    const now = new Date();

    const values = [
        { sensor_id: SENSOR_IDS.TEMPERATURE, value: temperature },
        { sensor_id: SENSOR_IDS.HUMIDITY,    value: humidity },
        { sensor_id: SENSOR_IDS.LIGHT,       value: light }
    ];

    try {
        for (const v of values) {
            await db.query(
                'INSERT INTO sensor_values (sensor_id, value, created_at) VALUES (?, ?, ?)',
                [v.sensor_id, v.value, now]
            );
        }

        broadcast('sensor_update', {
            temperature,
            humidity,
            light,
            timestamp: now.toISOString()
        });
    } catch (err) {
        console.error('❌ Lỗi ghi sensor_values:', err.message);
    }
}

// ============================================================
// 2. XỬ LÝ STATUS TỪ ESP32 — ✅ INSERT DÒNG MỚI (KHÔNG UPDATE)
// ============================================================
async function handleDeviceStatus(payload) {
    const { led_id, action, status } = payload;

    const key = `${led_id}:${action}`;
    const pending = pendingActions.get(key);

    if (!pending) {
        console.warn('⚠️ Không tìm thấy action đang chờ:', key);
        return;
    }

    try {
        // ✅ INSERT một DÒNG MỚI với status cuối cùng (SUCCESS/FAILED)
        // Không UPDATE dòng LOADING cũ
        const [result] = await db.query(
            `INSERT INTO actions (user_id, device_id, action, status, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [pending.userId, pending.deviceId, action, status]
        );

        console.log(`✅ Đã tạo action mới: ${result.insertId} — ${status}`);

        pendingActions.delete(key);

        // Đẩy WebSocket cho frontend
        broadcast('device_status', {
            action_id: result.insertId,
            led_id,
            action,
            status
        });
    } catch (err) {
        console.error('❌ Lỗi insert actions:', err.message);
    }
}

// ============================================================
// 3. GỬI LỆNH ĐIỀU KHIỂN
// ============================================================
function sendCommand(ledId, action) {
    const command = `${ledId}:${action}`;
    mqttClient.publish(MQTT_TOPICS.DEVICE_COMMAND, command, { qos: 1 });
    console.log('📤 Đã gửi lệnh:', command);
    return command;
}

// ============================================================
// 4. ĐĂNG KÝ ACTION ĐANG CHỜ — ✅ LƯU userId + deviceId
// ============================================================
function registerPendingAction(ledId, action, actionId, userId, deviceId) {
    const key = `${ledId}:${action}`;

    pendingActions.set(key, {
        actionId,     // ID của dòng LOADING
        userId,
        deviceId
    });

    // Timeout 10 giây → INSERT dòng FAILED (không UPDATE)
    setTimeout(async () => {
        if (pendingActions.has(key)) {
            const p = pendingActions.get(key);
            pendingActions.delete(key);

            try {
                // ✅ INSERT dòng mới với status = FAILED
                const [result] = await db.query(
                    `INSERT INTO actions (user_id, device_id, action, status, created_at)
                     VALUES (?, ?, ?, 'FAILED', NOW())`,
                    [p.userId, p.deviceId, action]
                );

                console.log(`⏰ Timeout → đã tạo action FAILED: ${result.insertId}`);

                broadcast('device_status', {
                    action_id: result.insertId,
                    led_id: ledId,
                    action,
                    status: 'FAILED'
                });
            } catch (err) {
                console.error('❌ Lỗi insert FAILED timeout:', err.message);
            }
        }
    }, 10000);
}

module.exports = {
    initMQTTService,
    sendCommand,
    registerPendingAction
};
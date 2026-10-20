// ========== WEBSOCKET CLIENT ==========
let socket = null;

function connectWS() {
    socket = new WebSocket('ws://localhost:3000/ws');

    socket.onopen = () => {
        console.log('🔌 WebSocket đã kết nối');
    };

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('📨 WS nhận:', msg);

        switch (msg.type) {
            case 'sensor_update':
                handleSensorUpdate(msg.data);
                break;
            case 'device_status':
                handleDeviceStatus(msg.data);
                break;
            case 'action_pending':
                handleActionPending(msg.data);
                break;
        }
    };

    socket.onclose = () => {
        console.log('🔌 WebSocket ngắt kết nối. Thử lại sau 3s...');
        setTimeout(connectWS, 3000);
    };

    socket.onerror = (err) => {
        console.error('❌ WS error:', err);
    };
}

// ============ HANDLERS ============
function handleSensorUpdate(data) {
    console.log('📊 Cập nhật realtime:', data);

    // 1. Cập nhật 3 ô cảm biến ở Dashboard
    const elTemp  = document.getElementById('val-temp');
    const elHumid = document.getElementById('val-humid');
    const elLight = document.getElementById('val-light');

    if (elTemp)  elTemp.textContent  = parseFloat(data.temperature).toFixed(1) + ' °C';
    if (elHumid) elHumid.textContent = parseFloat(data.humidity).toFixed(0)    + ' %';
    if (elLight) elLight.textContent = parseFloat(data.light).toFixed(0)        + ' LUX';

    // 2. ✅ Đẩy điểm mới vào biểu đồ realtime
    if (typeof window.pushRealtimePoint === 'function') {
        window.pushRealtimePoint(data);
    }

    // 3. Cập nhật bảng Data Sensor nếu đang ở trang đó
    if (typeof window.onRealtimeSensor === 'function') {
        window.onRealtimeSensor(data);
    }
}

function handleDeviceStatus(data) {
    console.log('🎛️ Trạng thái thiết bị:', data);

    // Cập nhật UI ở Dashboard
    if (data.led_id) {
        const ledId = data.led_id;
        const isOn = data.action === 'ON';

        const statusEl = document.getElementById('led' + ledId + '-status');
        const iconEl = document.getElementById('led' + ledId + '-icon');
        const inputEl = document.getElementById('led' + ledId);

        if (statusEl) statusEl.textContent = data.action;

        // ✅ Cập nhật toggle checkbox
        if (inputEl) inputEl.checked = isOn;

        // ✅ Cập nhật icon
        if (iconEl) {
            const iTag = iconEl.querySelector('i');
            if (isOn) {
                iTag.className = 'fa-solid fa-lightbulb';
                iconEl.classList.add('on');
            } else {
                iTag.className = 'fa-regular fa-lightbulb';
                iconEl.classList.remove('on');
            }
        }

        // ✅ Cập nhật row class
        const row = inputEl ? inputEl.closest('.switch-row') : null;
        if (row) row.classList.toggle('led-on', isOn);
    }

    // Refresh bảng Lịch sử nếu đang xem
    if (typeof window.refreshHistoryIfVisible === 'function') {
        window.refreshHistoryIfVisible();
    }
}

function handleActionPending(data) {
    console.log('⏳ Action đang xử lý:', data);

    if (typeof window.refreshHistoryIfVisible === 'function') {
        window.refreshHistoryIfVisible();
    }
}

// Tự kết nối khi load trang
document.addEventListener('DOMContentLoaded', connectWS);
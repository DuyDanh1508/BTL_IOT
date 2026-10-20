// ============================================================
// VẼ BIỂU ĐỒ VỚI GIÁ TRỊ THẬT (KHÔNG CHUẨN HÓA)
// ============================================================
// - Trục TRÁI (0-100): nhiệt độ (°C) và độ ẩm (%)
// - Trục PHẢI (0-3000): ánh sáng (Lux)
// ============================================================
const MAX_POINTS = 20;
// Định nghĩa max của từng trục
const AXIS_CONFIG = {
    left:  {
        temperature: 100,    // °C max
        humidity:    100    // % max
    },
    right: {
        light: 3000         // Lux max
    }
};

function renderChart() {
    const SVG_WIDTH  = 1100;
    const SVG_HEIGHT = 400;
    const PADDING    = 10;

    if (!chartData.labels || chartData.labels.length === 0) return;

    const points = chartData.labels.length;

    // ⚠️ Nếu chỉ có 1 điểm → không chia được
    if (points < 2) {
        console.warn('Chưa đủ 2 điểm để vẽ biểu đồ');
        return;
    }

    const stepX = (SVG_WIDTH - PADDING * 2) / (points - 1);

    function toPointsLeft(arr, type) {
        return arr.map((v, i) => {
            const x = PADDING + i * stepX;
            const ratio = v / AXIS_CONFIG.left[type];
            const y = SVG_HEIGHT - ratio * SVG_HEIGHT;
            return `${x},${y}`;
        }).join(' ');
    }

    function toPointsRight(arr) {
        return arr.map((v, i) => {
            const x = PADDING + i * stepX;
            const ratio = v / AXIS_CONFIG.right.light;
            const y = SVG_HEIGHT - ratio * SVG_HEIGHT;
            return `${x},${y}`;
        }).join(' ');
    }

    const lineTemp  = document.getElementById('line-temp');
    const lineHumid = document.getElementById('line-humid');
    const lineLight = document.getElementById('line-light');

    if (lineTemp)  lineTemp.setAttribute('points',  toPointsLeft(chartData.temperature, 'temperature'));
    if (lineHumid) lineHumid.setAttribute('points', toPointsLeft(chartData.humidity, 'humidity'));
    if (lineLight) lineLight.setAttribute('points', toPointsRight(chartData.light));

    // ✅ Cập nhật trục X
    updateXAxis();
}
// ✅ Hàm lấy giờ:phút:giây hiện tại
function getCurrentTimeLabel() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// ✅ Hàm đẩy điểm mới vào biểu đồ (gọi từ WebSocket)
window.pushRealtimePoint = function(data) {
    if (!chartData.labels) chartData.labels = [];
    if (!chartData.temperature) chartData.temperature = [];
    if (!chartData.humidity) chartData.humidity = [];
    if (!chartData.light) chartData.light = [];

    // Thêm điểm mới
    chartData.labels.push(getCurrentTimeLabel());
    chartData.temperature.push(parseFloat(data.temperature));
    chartData.humidity.push(parseFloat(data.humidity));
    chartData.light.push(parseFloat(data.light));

    // Nếu vượt quá MAX_POINTS → xóa điểm cũ nhất (bên trái)
    if (chartData.labels.length > MAX_POINTS) {
        chartData.labels.shift();
        chartData.temperature.shift();
        chartData.humidity.shift();
        chartData.light.shift();
    }

    // Vẽ lại biểu đồ
    renderChart();

    // Cập nhật trục X (giờ thực)
    updateXAxis();
};

// ✅ Cập nhật trục X với các mốc thời gian thực
function updateXAxis() {
    const xAxis = document.querySelector('.x-axis');
    if (!xAxis) return;

    // Lấy tối đa 6 mốc để hiển thị (tránh chữ đè lên nhau)
    const labels = chartData.labels || [];
    const step = Math.max(1, Math.floor(labels.length / 6));

    const displayLabels = [];
    for (let i = 0; i < labels.length; i += step) {
        displayLabels.push(labels[i]);
    }
    // Đảm bảo mốc cuối cùng luôn được hiển thị
    if (displayLabels[displayLabels.length - 1] !== labels[labels.length - 1]) {
        displayLabels.push(labels[labels.length - 1]);
    }

    // Render lại HTML trục X
    xAxis.innerHTML = displayLabels.map(l => `<span>${l}</span>`).join('');
}
// ========== LỌC BIỂU ĐỒ ==========
function setupChartFilter() {
    const sensorFilter = document.getElementById('sensor-filter');
    if (!sensorFilter) return;

    const lines = document.querySelectorAll('.chart-svg polyline');

    sensorFilter.addEventListener('change', (e) => {
        const selected = e.target.value;
        lines.forEach(line => {
            if (selected === 'all') {
                line.style.display = 'block';
            } else {
                line.style.display = (line.dataset.sensor === selected) ? 'block' : 'none';
            }
        });
    });
}

// ========== BẬT/TẮT ĐÈN ==========
function setupLedControls() {
    const leds = [
        { id: 1, checkbox: 'led1', status: 'led1-status', icon: 'led1-icon' },
        { id: 2, checkbox: 'led2', status: 'led2-status', icon: 'led2-icon' },
        { id: 3, checkbox: 'led3', status: 'led3-status', icon: 'led3-icon' }
    ];

    leds.forEach(({ id, checkbox, status, icon }) => {
        const input = document.getElementById(checkbox);
        const statusEl = document.getElementById(status);
        const iconEl = document.getElementById(icon);

        if (!input || !statusEl || !iconEl) return;

        input.addEventListener('change', async (e) => {
            const action = e.target.checked ? 'ON' : 'OFF';
            const row = input.closest('.switch-row');

            // ✅ HIỆN LOADING — Có class + màu vàng
            statusEl.textContent = 'LOADING';
            statusEl.classList.remove('status-success', 'status-failed');
            statusEl.classList.add('status-loading');

            iconEl.classList.add('loading');
            // Disable toggle trong lúc chờ
            input.disabled = true;

            // Đổi icon ngay lập tức
            const iTag = iconEl.querySelector('i');
            if (e.target.checked) {
                iTag.className = 'fa-solid fa-lightbulb';
                iconEl.classList.add('on');
            } else {
                iTag.className = 'fa-regular fa-lightbulb';
                iconEl.classList.remove('on');
            }

            // Gọi API điều khiển đèn
            try {
                const res = await DeviceAPI.control(id, action);
                if (res.success) {
                    statusEl.textContent = action;
                    statusEl.classList.remove('status-loading');
                    statusEl.classList.add('status-success');
                    iconEl.classList.remove('loading');
                    if (row) row.classList.toggle('led-on', e.target.checked);
                    console.log('✅ Đã gửi lệnh:', res);
                }
            } catch (err) {
                console.error('❌ Lỗi điều khiển đèn:', err);
                statusEl.textContent = 'FAILED';
                statusEl.classList.remove('status-loading');
                statusEl.classList.add('status-failed');
                iconEl.classList.remove('loading');
                e.target.checked = !e.target.checked;

                // Rollback icon
                if (e.target.checked) {
                    iTag.className = 'fa-solid fa-lightbulb';
                    iconEl.classList.add('on');
                } else {
                    iTag.className = 'fa-regular fa-lightbulb';
                    iconEl.classList.remove('on');
                }
            } finally {
                // ✅ Enable lại toggle
                input.disabled = false;
            }
        });
    });
}

// ========== ĐĂNG XUẤT ==========
function setupLogout() {
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;

    userInfo.addEventListener('click', function (e) {
        e.stopPropagation();
        let dropdown = this.querySelector('.user-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.innerHTML = `
                <a href="profile.html"><i class="fa-solid fa-user"></i> Profile</a>
                <a href="#" class="logout" id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</a>
            `;
            this.appendChild(dropdown);

            dropdown.querySelector('#logout-btn').addEventListener('click', (ev) => {
                ev.preventDefault();
                localStorage.removeItem('iot_token');
                localStorage.removeItem('iot_user');
                window.location.href = 'login.html';
            });
        }
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.user-dropdown').forEach(d => d.classList.remove('show'));
    });
}
// ============================================================
// ✅ ĐỒNG BỘ TRẠNG THÁI ĐÈN TỪ BACKEND
// ============================================================
// Gọi khi load Dashboard → cập nhật toggle đúng trạng thái thực
// ============================================================
async function syncLedStates() {
    try {
        const res = await DeviceAPI.getStatus();
        if (!res.success || !res.data) return;

        console.log('🔍 Trạng thái đèn từ backend:', res.data);

        res.data.forEach(device => {
            const ledId = device.device_id;
            const isOn = device.action === 'ON';

            // Cập nhật toggle
            const input = document.getElementById('led' + ledId);
            const statusEl = document.getElementById('led' + ledId + '-status');
            const iconEl = document.getElementById('led' + ledId + '-icon');

            if (input) input.checked = isOn;
            if (statusEl) statusEl.textContent = isOn ? 'ON' : 'OFF';

            // Cập nhật icon
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

            // Cập nhật class row
            const row = input ? input.closest('.switch-row') : null;
            if (row) row.classList.toggle('led-on', isOn);
        });

        console.log('✅ Đã đồng bộ trạng thái đèn');
    } catch (err) {
        console.error('❌ Lỗi syncLedStates:', err);
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard đang khởi động...');

    // 1. Lấy dữ liệu cảm biến mới nhất
    try {
        const res = await SensorAPI.latest();
        if (res.success && res.data) {
            if (res.data.temperature) document.getElementById('val-temp').textContent  = parseFloat(res.data.temperature.value).toFixed(1) + ' °C';
            if (res.data.humidity)    document.getElementById('val-humid').textContent = parseFloat(res.data.humidity.value).toFixed(0)    + ' %';
            if (res.data.light)       document.getElementById('val-light').textContent = parseFloat(res.data.light.value).toFixed(0)        + ' LUX';
            console.log('✅ Đã load dữ liệu cảm biến mới nhất');
        }
    } catch (err) {
        console.error('❌ Lỗi load sensors/latest:', err);
    }

    // 2. ✅ Lấy dữ liệu biểu đồ ban đầu (12-20 điểm gần nhất)
    try {
        const chartRes = await SensorAPI.chart();
        if (chartRes.success && chartRes.data) {
            // ✅ Đảm bảo labels là mảng giờ:phút:giây
            chartData.labels      = chartRes.data.labels || [];
            chartData.temperature = chartRes.data.temperature || [];
            chartData.humidity    = chartRes.data.humidity || [];
            chartData.light       = chartRes.data.light || [];

            // ✅ Chỉ giữ MAX_POINTS điểm mới nhất
            if (chartData.labels.length > MAX_POINTS) {
                const start = chartData.labels.length - MAX_POINTS;
                chartData.labels      = chartData.labels.slice(start);
                chartData.temperature = chartData.temperature.slice(start);
                chartData.humidity    = chartData.humidity.slice(start);
                chartData.light       = chartData.light.slice(start);
            }

            renderChart();
            console.log('✅ Đã load biểu đồ ban đầu:', chartData);
        }
    } catch (err) {
        console.error('❌ Lỗi load chart:', err);
    }
    await syncLedStates();
    // 3. Setup các control
    
    setupChartFilter();
    setupLedControls();
    setupLogout();
});
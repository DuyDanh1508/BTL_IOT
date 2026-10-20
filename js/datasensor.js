// ========== CẤU HÌNH ==========
let rowsPerPage  = 10;
let currentPage  = 1;
let allSensorData = [];         // Dữ liệu gốc từ API
let filteredData  = [];         // Sau khi lọc

// ========== ĐƠN VỊ THEO LOẠI CẢM BIẾN ==========
function getUnit(type) {
    switch (type) {
        case 'Nhiệt độ':  return '°C';
        case 'Độ ẩm':     return '%';
        case 'Ánh sáng':  return 'Lux';
        default:          return '';
    }
}
// ============================================================
// ✅ SẮP XẾP DỮ LIỆU CẢM BIẾN
// ============================================================
// Quy tắc:
//   1. Theo THỜI GIAN giảm dần (mới nhất lên đầu)
//   2. Nếu cùng thời gian → theo ID tăng dần (1, 2, 3)
// ============================================================
function sortSensorData(arr) {
    return arr.sort((a, b) => {
        // So sánh thời gian (mới nhất lên đầu)
        const timeA = new Date(a.rawTime || a.time).getTime();
        const timeB = new Date(b.rawTime || b.time).getTime();

        if (timeB !== timeA) {
            return timeB - timeA;   // Thời gian giảm dần
        }

        // Cùng thời gian → sắp xếp theo ID tăng dần (1, 2, 3)
        return Number(a.id) - Number(b.id);
    });
}
// ========== LOAD DỮ LIỆU TỪ API ==========
async function loadSensorData() {
    try {
        const res = await SensorAPI.history({ page: 1, limit: 1000 });
        if (res.success && res.data) {
            allSensorData = res.data.map(row => ({
                id: row.sensor_id,
                type: row.sensor_name,
                value: parseFloat(row.value),
                time: formatTime(row.created_at),
                rawTime: row.created_at          // ✅ Lưu timestamp gốc để sắp xếp
            }));

            // ✅ Sắp xếp chuẩn: thời gian giảm dần, cùng thời gian thì ID tăng dần
            allSensorData = sortSensorData(allSensorData);

            filteredData = [...allSensorData];
            currentPage = 1;
            renderSensorTable();

            console.log('✅ Đã load', allSensorData.length, 'bản ghi cảm biến');
        }
    } catch (err) {
        console.error('❌ Lỗi load sensor data:', err);
    }
}
// Format thời gian từ MySQL
// ============================================================
// ============================================================
function formatTime(datetime) {
    const d = new Date(datetime);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day}-${h}:${m}:${s}`;
}

// ========== RENDER BẢNG ==========
function renderSensorTable() {
    const tbody = document.getElementById('sensor-tbody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex   = startIndex + rowsPerPage;
    const pageData   = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:#999;">Không có dữ liệu</td></tr>';
        renderPagination();
        return;
    }

    pageData.forEach((row, idx) => {
        const rowId = `sensor-row-${startIndex + idx}`;
        tbody.innerHTML += `
            <tr id="${rowId}">
                <td>${row.id}</td>
                <td>${row.type}</td>
                <td>${row.value} ${getUnit(row.type)}</td>
                <td>
                    <span class="time-text">${row.time}</span>
                    <button class="btn-copy" onclick="copyTime('${row.time}', this)" title="Copy thời gian">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                </td>
            </tr>`;
    });

    renderPagination();
}

// ============================================================
// ✅ COPY THỜI GIAN VÀO CLIPBOARD
// ============================================================
function copyTime(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        // Đổi icon thành dấu tick trong 1.5s
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        console.error('❌ Lỗi copy:', err);
        alert('Không thể copy: ' + err.message);
    });
}
function copyTime(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        // Đổi icon thành dấu tick trong 1.5s
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        console.error('❌ Lỗi copy:', err);
        alert('Không thể copy: ' + err.message);
    });
}
// ========== PHÂN TRANG ==========
function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    html += `<span class="page-btn ${currentPage === 1 ? 'disabled' : ''}"
                    onclick="${currentPage === 1 ? '' : 'goToPage(' + (currentPage - 1) + ')'}">
                <i class="fa-solid fa-arrow-left"></i>
             </span>`;

    const startPage = Math.max(1, currentPage - 2);
    const endPage   = Math.min(totalPages, startPage + 4);

    if (startPage > 1) {
        html += `<span class="page-btn" onclick="goToPage(1)">1</span>`;
        if (startPage > 2) html += `<span>...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<span class="page-btn ${i === currentPage ? 'active' : ''}"
                        onclick="goToPage(${i})">${i}</span>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<span class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</span>`;
    }

    html += `<span class="page-btn ${currentPage === totalPages ? 'disabled' : ''}"
                    onclick="${currentPage === totalPages ? '' : 'goToPage(' + (currentPage + 1) + ')'}">
                <i class="fa-solid fa-arrow-right"></i>
             </span>`;

    html += `<span class="page-info">
                ${filteredData.length} bản ghi — Trang ${currentPage}/${totalPages}
             </span>`;

    pagination.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderSensorTable();
}

function changePageSize() {
    const select = document.getElementById('page-size');
    rowsPerPage = parseInt(select.value);
    currentPage = 1;
    renderSensorTable();
}

// ========== LỌC + SẮP XẾP ==========
function filterSensorData() {
    const keyword = document.getElementById('search-input').value.trim().toLowerCase();
    const column  = document.getElementById('search-column').value;
    const sort    = document.getElementById('sort-order').value;

    filteredData = allSensorData.filter(item => {
        if (keyword === '') return true;

        // ✅ Nếu tìm theo thời gian
        if (column === 'time') {
            return item.time.toLowerCase().includes(keyword);
        }

        // ✅ Nếu tìm tất cả
        if (column === 'all') {
            return (
                String(item.id).toLowerCase().includes(keyword) ||
                item.type.toLowerCase().includes(keyword) ||
                String(item.value).toLowerCase().includes(keyword) ||
                item.time.toLowerCase().includes(keyword) // Tìm thẳng vào chuỗi time
            );
        }
        return String(item[column]).toLowerCase().includes(keyword);
    });

    if (sort === 'asc') {
        filteredData.sort((a, b) => Number(a.value) - Number(b.value));
    } else if (sort === 'desc') {
        filteredData.sort((a, b) => Number(b.value) - Number(a.value));
    }

    currentPage = 1;
    renderSensorTable();
}

// ========== WEBSOCKET REALTIME ==========
window.onRealtimeSensor = function(data) {
    const now = new Date();
    const timeStr = formatTime(now);

    // ✅ Chèn 3 dòng theo thứ tự NGƯỢC để sau khi unshift thì thành 1, 2, 3
    allSensorData.unshift({
        id: 3, type: 'Ánh sáng',
        value: parseFloat(data.light),
        time: timeStr,
        rawTime: now.toISOString()
    });
    allSensorData.unshift({
        id: 2, type: 'Độ ẩm',
        value: parseFloat(data.humidity),
        time: timeStr,
        rawTime: now.toISOString()
    });
    allSensorData.unshift({
        id: 1, type: 'Nhiệt độ',
        value: parseFloat(data.temperature),
        time: timeStr,
        rawTime: now.toISOString()
    });

    // ✅ Sắp xếp lại toàn bộ (đảm bảo chuẩn 100%)
    allSensorData = sortSensorData(allSensorData);

    // Giữ tối đa 500 dòng
    if (allSensorData.length > 500) allSensorData = allSensorData.slice(0, 500);

    // Nếu không có filter → refresh bảng
    const keyword = document.getElementById('search-input').value.trim();
    if (keyword === '') {
        filteredData = [...allSensorData];
        renderSensorTable();
    }
};
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
// ========== KHỞI TẠO ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Load dữ liệu từ API
    await loadSensorData();

    // Gán sự kiện
    document.getElementById('sort-order').addEventListener('change', filterSensorData);
    document.getElementById('search-column').addEventListener('change', filterSensorData);

    let debounceTimer;
    document.getElementById('search-input').addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterSensorData, 300);
    });
    setupLogout();
});
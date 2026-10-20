// ========== CẤU HÌNH ==========
let rowsPerPage = 10;
let currentPage = 1;
let allHistoryData = [];
let filteredData = [];

// ========== LOAD TỪ API ==========
async function loadHistoryData() {
    try {
        const res = await ActionAPI.history({ page: 1, limit: 1000 });
        if (res.success && res.data) {
            allHistoryData = res.data.map(row => ({
                id: row.id,
                user: row.user_name,
                device: row.device_name,
                action: row.action,
                status: row.status,
                time: formatTime(row.created_at),
                rawTime: new Date(row.created_at)    // ✅ Lưu để sắp xếp
            }));

            // ✅ Sắp xếp mới nhất lên đầu
            allHistoryData.sort((a, b) => b.id - a.id);

            filteredData = [...allHistoryData];
            currentPage = 1;
            renderHistoryTable();

            console.log('✅ Đã load', allHistoryData.length, 'bản ghi lịch sử');
        }
    } catch (err) {
        console.error('❌ Lỗi load history:', err);
    }
}

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
function renderHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex   = startIndex + rowsPerPage;
    const pageData   = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#999;">Không có dữ liệu</td></tr>';
        renderPagination();
        return;
    }

    pageData.forEach(row => {
        let badgeClass = 'success';
        if (row.status === 'LOADING') badgeClass = 'loading';
        if (row.status === 'FAILED')  badgeClass = 'failed';

        tbody.innerHTML += `
            <tr>
                <td>${row.id}</td>
                <td>${row.user}</td>
                <td>${row.device}</td>
                <td>${row.action}</td>
                <td><span class="badge ${badgeClass}">${row.status}</span></td>
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
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }

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
    renderHistoryTable();
}

function changePageSize() {
    const select = document.getElementById('page-size');
    rowsPerPage = parseInt(select.value);
    currentPage = 1;
    renderHistoryTable();
}

// ========== LỌC ==========
// ============================================================
// ✅ LỌC LỊCH SỬ THEO THỜI GIAN (LINH HOẠT)
// ============================================================
// Nguyên tắc: User gõ đến đâu → tìm prefix đến đó.
// VD: "2026/10/14-16:37:59" → so sánh 19 ký tự đầu
//     "2026/10/14-16:37"    → so sánh 16 ký tự đầu
//     "2026/10/14"          → so sánh 10 ký tự đầu
// ============================================================
// ============================================================
// ✅ LỌC LỊCH SỬ THEO THỜI GIAN (CHUẨN XÁC MỌI CẤP ĐỘ)
// ============================================================
function filterHistoryData() {
    const deviceFilter = document.getElementById('filter-device').value;
    const actionFilter = document.getElementById('filter-action').value;
    const statusFilter = document.getElementById('filter-status').value;
    const timeKeyword  = document.getElementById('filter-time').value.trim().toLowerCase();

    filteredData = allHistoryData.filter(item => {
        if (deviceFilter && item.device !== deviceFilter) return false;
        if (actionFilter && item.action !== actionFilter) return false;
        if (statusFilter && item.status !== statusFilter) return false;

        // ✅ Lọc theo thời gian
        if (timeKeyword) {
            const itemTime = item.time.toLowerCase();

            // Nếu user gõ từ đầu (VD: 2026, 2026/10, 2026/10/14-16)
            // thì ưu tiên tìm theo prefix
            if (itemTime.startsWith(timeKeyword)) {
                return true;
            }

            // Nếu user gõ ở giữa (VD: 16:37, 10/14, :37:59)
            if (itemTime.includes(timeKeyword)) {
                return true;
            }

            return false;
        }

        return true;
    });

    currentPage = 1;
    renderHistoryTable();
}
function clearFilters() {
    document.getElementById('filter-device').value = '';
    document.getElementById('filter-action').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-time').value = '';
    filteredData = [...allHistoryData];
    currentPage = 1;
    renderHistoryTable();
}
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
// ========== REFRESH KHI CÓ ACTION MỚI ==========
window.refreshHistoryIfVisible = function() {
    loadHistoryData();
};

// ========== KHỞI TẠO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadHistoryData();

    document.getElementById('filter-device').addEventListener('change', filterHistoryData);
    document.getElementById('filter-action').addEventListener('change', filterHistoryData);
    document.getElementById('filter-status').addEventListener('change', filterHistoryData);

    let debounceTimer;
    document.getElementById('filter-time').addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterHistoryData, 300);
    });
    setupLogout();
});
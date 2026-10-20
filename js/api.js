// ========== CẤU HÌNH API ==========
const API_BASE = 'http://localhost:3000/api';

// Lấy token từ localStorage
function getToken() {
    return localStorage.getItem('iot_token');
}

// Wrapper fetch có gắn token
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(API_BASE + endpoint, { ...options, headers });
    const data = await res.json();

    // Tự động chuyển về login nếu token hết hạn
    if (res.status === 401) {
        localStorage.removeItem('iot_token');
        localStorage.removeItem('iot_user');
        window.location.href = 'login.html';
        throw new Error('Chưa đăng nhập');
    }

    if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
    }
    return data;
}

// ============ AUTH ============
const AuthAPI = {
    register: (full_name, password) =>
        apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ full_name, password })
        }),
    login: (full_name, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ full_name, password })
        }),
    me: () => apiFetch('/auth/me')
};

// ============ SENSORS ============
const SensorAPI = {
    latest: () => apiFetch('/sensors/latest'),
    history: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch('/sensors/history?' + qs);
    },
    chart: () => apiFetch('/sensors/chart')
};

// ============ DEVICES ============
const DeviceAPI = {
    getAll: () => apiFetch('/devices'),
    getStatus: () => apiFetch('/devices/status'),
    control: (id, action) =>
        apiFetch(`/devices/${id}/control`, {
            method: 'POST',
            body: JSON.stringify({ action })
        })
};

// ============ ACTIONS ============
const ActionAPI = {
    history: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch('/actions?' + qs);
    },
    getById: (id) => apiFetch('/actions/' + id)
};
// ============ PROFILE ============
const ProfileAPI = {
    get: () => {
        const user = JSON.parse(localStorage.getItem('iot_user') || '{}');
        return apiFetch(`/profile?user_id=${user.id || 1}`);
    },
    update: (data) => {
        const user = JSON.parse(localStorage.getItem('iot_user') || '{}');
        return apiFetch('/profile', {
            method: 'PUT',
            body: JSON.stringify({ ...data, user_id: user.id || 1 })
        });
    },
    uploadAvatar: async (file) => {
        const user = JSON.parse(localStorage.getItem('iot_user') || '{}');
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('user_id', user.id || 1);

        const res = await fetch('http://localhost:3000/api/profile/avatar', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload thất bại');
        return data;
    }
};
// ========== XỬ LÝ ĐĂNG NHẬP (GỌI API BACKEND) ==========

async function handleLogin(event) {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('error-msg');

    // Reset thông báo
    errorBox.classList.remove('show');
    errorBox.textContent = '';

    // Validate
    if (!fullname || !password) {
        return showError('Vui lòng nhập đầy đủ thông tin!');
    }

    try {
        showError('Đang xử lý...', 'success');

        // ✅ Gọi API backend
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullname,
                password: password
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            // ✅ Lưu token + user vào localStorage
            localStorage.setItem('iot_token', data.token);
            localStorage.setItem('iot_user', JSON.stringify(data.user));

            showError('Đăng nhập thành công! Đang chuyển hướng...', 'success');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            showError(data.message || 'Họ tên hoặc mật khẩu không đúng!');
        }
    } catch (err) {
        console.error('❌ Lỗi đăng nhập:', err);
        showError('Không thể kết nối đến server. Kiểm tra backend!');
    }
}

// ========== HIỂN THỊ LỖI ==========
function showError(message, type = 'error') {
    const errorBox = document.getElementById('error-msg');
    errorBox.textContent = message;
    errorBox.classList.add('show');

    if (type === 'success') {
        errorBox.style.background = '#e5f8e5';
        errorBox.style.color = '#2e7d32';
    } else {
        errorBox.style.background = '#ffe5e5';
        errorBox.style.color = '#d32f2f';
    }
}

// ========== TỰ ĐỘNG CHUYỂN NẾU ĐÃ ĐĂNG NHẬP ==========
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('iot_token');
    if (token) {
        console.log('Đã có token, tự động vào Dashboard');
        window.location.href = 'dashboard.html';
    }
});
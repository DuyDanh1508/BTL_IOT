// ========== XỬ LÝ ĐĂNG KÝ (GỌI API BACKEND) ==========

async function handleRegister(event) {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    const messageBox = document.getElementById('message-box');
    messageBox.className = 'message-box';
    messageBox.textContent = '';

    // Validate
    if (!fullname || !password || !confirmPassword) {
        return showMessage('Vui lòng nhập đầy đủ thông tin!', 'error');
    }

    if (fullname.length < 3) {
        return showMessage('Họ và tên phải có ít nhất 3 ký tự!', 'error');
    }

    if (password.length < 6) {
        return showMessage('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
    }

    if (password !== confirmPassword) {
        return showMessage('Mật khẩu nhập lại không khớp!', 'error');
    }

    try {
        showMessage('Đang xử lý...', 'success');

        // ✅ Gọi API backend
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullname,
                password: password
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showMessage('Đăng ký thành công! Đang chuyển sang đăng nhập...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
        } else {
            showMessage(data.message || 'Đăng ký thất bại!', 'error');
        }
    } catch (err) {
        console.error('❌ Lỗi đăng ký:', err);
        showMessage('Không thể kết nối đến server!', 'error');
    }
}

function showMessage(message, type = 'error') {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.className = 'message-box ' + type;
}
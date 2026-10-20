// ============================================================
// LOAD PROFILE TỪ BACKEND
// ============================================================
async function loadProfile() {
    try {
        const res = await ProfileAPI.get();
        if (!res.success || !res.data) return;

        const p = res.data;

        // Hiển thị tên
        document.getElementById('display-name').textContent  = p.full_name  || '--';
        document.getElementById('display-msv').textContent   = p.msv        || '--';
        document.getElementById('display-class').textContent = p.class_name || '--';

        // Điền form
        document.getElementById('input-msv').value     = p.msv        || '';
        document.getElementById('input-class').value   = p.class_name || '';
        document.getElementById('link-github').value   = p.github     || '';
        document.getElementById('link-figma').value    = p.figma      || '';
        document.getElementById('link-postman').value  = p.postman    || '';
        document.getElementById('link-pdf').value      = p.pdf        || '';

        // Hiển thị avatar nếu có
        if (p.avatar) {
            document.getElementById('avatar-preview').innerHTML =
                `<img src="http://localhost:3000${p.avatar}" alt="Avatar">`;
        }

        console.log('✅ Đã load profile:', p);
    } catch (err) {
        console.error('❌ Lỗi load profile:', err);
    }
}

// ============================================================
// LƯU PROFILE
// ============================================================
async function saveProfile() {
    const data = {
        msv:        document.getElementById('input-msv').value.trim(),
        class_name: document.getElementById('input-class').value.trim(),
        github:     document.getElementById('link-github').value.trim(),
        figma:      document.getElementById('link-figma').value.trim(),
        postman:    document.getElementById('link-postman').value.trim(),
        pdf:        document.getElementById('link-pdf').value.trim()
    };

    try {
        const res = await ProfileAPI.update(data);
        if (res.success) {
            alert('✅ Đã lưu thông tin Profile!');
            // Cập nhật lại hiển thị
            document.getElementById('display-msv').textContent   = data.msv || '--';
            document.getElementById('display-class').textContent = data.class_name || '--';
        }
    } catch (err) {
        console.error('❌ Lỗi lưu profile:', err);
        alert('❌ Lỗi: ' + err.message);
    }
}

// ============================================================
// UPLOAD AVATAR
// ============================================================
function setupAvatarUpload() {
    const input = document.getElementById('avatar-input');
    const preview = document.getElementById('avatar-preview');

    if (!input) return;

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('❌ Ảnh không được quá 2MB!');
            return;
        }

        // Preview ngay
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.innerHTML = `<img src="${ev.target.result}" alt="Avatar">`;
        };
        reader.readAsDataURL(file);

        // Upload
        try {
            const res = await ProfileAPI.uploadAvatar(file);
            if (res.success) {
                console.log('✅ Upload avatar thành công:', res.avatar);
            }
        } catch (err) {
            console.error('❌ Lỗi upload avatar:', err);
            alert('❌ Lỗi upload: ' + err.message);
            loadProfile();   // Rollback
        }
    });
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
// ============================================================
// KHỞI TẠO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    setupAvatarUpload();
    setupLogout();
});
DROP DATABASE IF EXISTS iot_system; 
CREATE DATABASE IF NOT EXISTS iot_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE iot_system;


-- =========================================
-- 1. USERS
-- =========================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- 2. SENSORS
-- =========================================

CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- 3. DEVICES
-- =========================================

CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- 4. SENSOR VALUES
-- =========================================

CREATE TABLE sensor_values (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sensor_values_sensor
        FOREIGN KEY (sensor_id)
        REFERENCES sensors(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================
-- 5. ACTIONS
-- =========================================

CREATE TABLE actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_actions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_actions_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

USE iot_system;

-- ✅ Thêm 3 cảm biến với id = 1, 2, 3
INSERT INTO sensors (id, name) VALUES
(1, 'Nhiệt độ'),
(2, 'Độ ẩm'),
(3, 'Ánh sáng');

-- ✅ Thêm 3 thiết bị với id = 1, 2, 3
INSERT INTO devices (id, name) VALUES
(1, 'Đèn 1'),
(2, 'Đèn 2'),
(3, 'Đèn 3');

-- Kiểm tra lại
SELECT * FROM sensors;
SELECT * FROM devices;
SELECT * FROM actions;
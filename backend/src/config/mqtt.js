const mqtt = require('mqtt');
require('dotenv').config();

const client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 3000,
    clientId: 'backend-' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', () => {
    console.log('✅ Đã kết nối MQTT Broker:', process.env.MQTT_URL);
});

client.on('error', (err) => {
    console.error('❌ Lỗi MQTT:', err.message);
});

client.on('reconnect', () => {
    console.log('🔄 Đang kết nối lại MQTT...');
});

module.exports = client;
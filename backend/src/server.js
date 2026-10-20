const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { initWebSocket } = require('./services/wsService');
const { initMQTTService } = require('./services/mqttService');

const authRoutes    = require('./routes/authRoutes');
const sensorRoutes  = require('./routes/sensorRoutes');
const deviceRoutes  = require('./routes/deviceRoutes');
const actionRoutes  = require('./routes/actionRoutes');
const profileRoutes = require('./routes/profileRoutes');  

const app = express();
const server = http.createServer(app);

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve file tĩnh (avatar)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============ ROUTES ============
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth',    authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/profile', profileRoutes);  

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Backend đang chạy 🚀' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
});

// ============ KHỞI ĐỘNG ============
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('════════════════════════════════════════');
    console.log(`🚀 Backend đang chạy: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket:           ws://localhost:${PORT}/ws`);
    console.log('════════════════════════════════════════');

    initWebSocket(server);
    console.log('✅ WebSocket đã khởi động');

    initMQTTService();
});
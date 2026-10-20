const WebSocket = require('ws');

let wss = null;
const clients = new Set();

function initWebSocket(server) {
    wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', (ws) => {
        console.log('🔌 Client WebSocket đã kết nối');
        clients.add(ws);

        ws.on('close', () => {
            clients.delete(ws);
            console.log('🔌 Client WebSocket ngắt kết nối');
        });
    });
}

// Gửi dữ liệu đến TẤT CẢ client đang kết nối
function broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
}

module.exports = { initWebSocket, broadcast };
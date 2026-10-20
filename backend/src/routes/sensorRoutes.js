const router = require('express').Router();
const sensorController = require('../controllers/sensorController');

/**
 * @openapi
 * tags:
 *   name: Sensors
 *   description: API Cảm biến
 */

/**
 * @openapi
 * /api/sensors/latest:
 *   get:
 *     summary: Lấy giá trị mới nhất của 3 cảm biến
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Trả về nhiệt độ, độ ẩm, ánh sáng
 */
router.get('/latest',  sensorController.getLatest);

/**
 * @openapi
 * /api/sensors/history:
 *   get:
 *     summary: Lấy lịch sử cảm biến (có phân trang)
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách dữ liệu
 */
router.get('/history', sensorController.getHistory);

/**
 * @openapi
 * /api/sensors/chart:
 *   get:
 *     summary: Lấy dữ liệu vẽ biểu đồ (20 điểm gần nhất)
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Mảng labels, temperature, humidity, light
 */
router.get('/chart',   sensorController.getChart);

module.exports = router;
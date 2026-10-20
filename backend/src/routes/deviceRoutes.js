const router = require('express').Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   name: Devices
 *   description: API Điều khiển thiết bị
 */

/**
 * @openapi
 * /api/devices:
 *   get:
 *     summary: Lấy danh sách thiết bị
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: Mảng các thiết bị
 */
router.get('/', deviceController.getAll);

/**
 * @openapi
 * /api/devices/status:
 *   get:
 *     summary: Lấy trạng thái Bật/Tắt hiện tại của các đèn
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: Trạng thái hiện tại
 */
router.get('/status', deviceController.getStatus);

/**
 * @openapi
 * /api/devices/{id}/control:
 *   post:
 *     summary: Bật/Tắt đèn
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thiết bị (1, 2, 3)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ON, OFF]
 *     responses:
 *       202:
 *         description: Gửi lệnh thành công
 */
router.post('/:id/control', authMiddleware, deviceController.control);

module.exports = router;
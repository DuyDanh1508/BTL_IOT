const router = require('express').Router();
const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   name: Profile
 *   description: API Thông tin cá nhân
 */

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Lấy thông tin profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin profile
 */
router.get('/',  authMiddleware, profileController.getProfile);

/**
 * @openapi
 * /api/profile:
 *   put:
 *     summary: Cập nhật thông tin profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               msv:
 *                 type: string
 *               class_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/', authMiddleware, profileController.updateProfile);

/**
 * @openapi
 * /api/profile/avatar:
 *   post:
 *     summary: Upload ảnh đại diện (Avatar)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 */
router.post('/avatar', upload.single('avatar'), authMiddleware, profileController.uploadAvatar);

module.exports = router;
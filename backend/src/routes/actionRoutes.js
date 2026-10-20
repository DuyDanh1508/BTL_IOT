const router = require('express').Router();
const actionController = require('../controllers/actionController');

/**
 * @openapi
 * tags:
 *   name: Actions
 *   description: API Lịch sử hành động
 */

/**
 * @openapi
 * /api/actions:
 *   get:
 *     summary: Lấy lịch sử thao tác đèn
 *     tags: [Actions]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách lịch sử
 */
router.get('/',     actionController.getHistory);
/**
 * @openapi
 * /api/actions/{id}:
 *   get:
 *     summary: Lấy chi tiết một lịch sử hành động
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết action
 */
router.get('/:id',  actionController.getById);

module.exports = router;
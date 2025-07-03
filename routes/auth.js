const express = require('express');
const { getViewerToken } = require('../services/aps.js');

let router = express.Router();

/**
 * @swagger
 * /api/auth/token:
 *   get:
 *     summary: Get Autodesk Viewer access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Access token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: Access token string
 *                   example: eyJhbGciOiJIUzI1NiIsInR...
 *                 token_type:
 *                   type: string
 *                   description: Type of token
 *                   example: Bearer
 *                 expires_in:
 *                   type: integer
 *                   description: Time in seconds until token expiration
 *                   example: 3599
 *       500:
 *         description: Server error
 */
router.get('/api/auth/token', async function (req, res, next) {
  try {
    res.json(await getViewerToken());
  } catch (err) {
    next(err);
  }
});

module.exports = router;

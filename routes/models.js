const { APS_BUCKET } = require('../config.js');
const express = require('express');
const formidable = require('express-formidable');
const {
  listObjects,
  uploadObject,
  translateObject,
  getManifest,
  deleteObject,
  urnify,
} = require('../services/aps.js');

let router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Models
 *   description: Autodesk model management
 */

/**
 * @swagger
 * /api/models:
 *   get:
 *     summary: List all uploaded models
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of models
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   urn:
 *                     type: string
 */

router.get('/api/models', async function (req, res, next) {
  try {
    const objects = await listObjects();
    res.json(
      objects.map((o) => ({
        name: o.objectKey,
        urn: urnify(o.objectId),
      }))
    );
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/models/{urn}/status:
 *   get:
 *     summary: Get translation status of a model
 *     tags: [Models]
 *     parameters:
 *       - in: path
 *         name: urn
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64-encoded URN of the model
 *     responses:
 *       200:
 *         description: Translation status and progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 progress:
 *                   type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 */

router.get('/api/models/:urn/status', async function (req, res, next) {
  try {
    const manifest = await getManifest(req.params.urn);
    if (manifest) {
      let messages = [];
      if (manifest.derivatives) {
        for (const derivative of manifest.derivatives) {
          messages = messages.concat(derivative.messages || []);
          if (derivative.children) {
            for (const child of derivative.children) {
              messages.concat(child.messages || []);
            }
          }
        }
      }
      res.json({
        status: manifest.status,
        progress: manifest.progress,
        messages,
      });
    } else {
      res.json({ status: 'n/a' });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/models:
 *   post:
 *     summary: Upload and translate a model file
 *     tags: [Models]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - model-file
 *             properties:
 *               model-file:
 *                 type: string
 *                 format: binary
 *               model-zip-entrypoint:
 *                 type: string
 *                 example: scene.svf
 *     responses:
 *       200:
 *         description: Model uploaded and translation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 urn:
 *                   type: string
 */

router.post(
  '/api/models',
  formidable({ maxFileSize: Infinity }),
  async function (req, res, next) {
    if (req.fields['model-zip-entrypoint'] == '') {
      req.fields['model-zip-entrypoint'] = undefined;
    }
    const file = req.files['model-file'];
    if (!file) {
      res.status(400).send('The required field ("model-file") is missing.');
      return;
    }
    try {
      const obj = await uploadObject(file.name, file.path);
      await translateObject(
        urnify(obj.objectId),
        req.fields['model-zip-entrypoint']
      );
      res.json({
        name: obj.objectKey,
        urn: urnify(obj.objectId),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/models/{objectKey}/:
 *   delete:
 *     summary: Delete a model from Autodesk OSS bucket
 *     tags: [Models]
 *     description: Deletes a file from APS OSS using its objectKey.
 *     parameters:
 *       - in: path
 *         name: objectKey
 *         required: true
 *         schema:
 *           type: string
 *         description: objectKey of the file to delete
 *     responses:
 *       200:
 *         description: File successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File my_file.rvt deleted from bucket my_bucket
 *       400:
 *         description: Invalid objectKey
 *       500:
 *         description: Deletion failed or internal server error
 */

router.delete('/api/models/:objectKey/', async function (req, res, next) {
  try {
    const result = await deleteObject(req.params.objectKey);
    res.send(
      `The ${req.params.objectKey} file is deleted from ${APS_BUCKET} successfully.`
    );
    return true;
  } catch (err) {
    next(err);
  }
});

module.exports = router;

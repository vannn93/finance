const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, uploadController.uploadAndOCR);

module.exports = router;

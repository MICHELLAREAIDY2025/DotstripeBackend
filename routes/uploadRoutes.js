const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/uploadMiddleware');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

// Single image upload route
router.post(
  '/image',
  authenticate,
  isAdmin,
  upload.single('image'),
  uploadController.uploadImage
);

// Multiple images upload route
router.post(
  '/images',
  authenticate,
  isAdmin,
  upload.array('images', 10), // Max 10 images
  uploadController.uploadMultipleImages
);

// Delete image route
router.delete(
  '/image',
  authenticate,
  isAdmin,
  uploadController.deleteImage
);

module.exports = router;
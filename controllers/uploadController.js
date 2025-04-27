const { uploadFileToSupabase, deleteFileFromSupabase } = require('../services/uploadService');

/**
 * Upload a single image
 */
exports.uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Supabase
    const imageUrl = await uploadFileToSupabase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.body.folder || 'products' // Optional folder parameter
    );

    res.status(200).json({
      message: 'File uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

/**
 * Upload multiple images
 */
exports.uploadMultipleImages = async (req, res) => {
  try {
    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Upload all files to Supabase
    const uploadPromises = req.files.map(file => 
      uploadFileToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype,
        req.body.folder || 'products'
      )
    );

    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      message: 'Files uploaded successfully',
      imageUrls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

/**
 * Delete an image
 */
exports.deleteImage = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const success = await deleteFileFromSupabase(url);

    if (success) {
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete file' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      message: 'Failed to delete image',
      error: error.message
    });
  }
};
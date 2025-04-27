const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalname - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Storage folder (default: 'products')
 * @returns {Promise<string>} - URL of the uploaded file
 */
async function uploadFileToSupabase(fileBuffer, originalname, mimetype, folder = 'products') {
  try {
    // Generate a unique filename
    const fileExt = originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    console.log(`Uploading file: ${filePath} (${mimetype})`);

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET || 'dotstripe')
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(process.env.SUPABASE_BUCKET || 'dotstripe')
      .getPublicUrl(filePath);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload service error:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} fileUrl - The file URL to delete
 * @returns {Promise<boolean>} - Success status
 */
async function deleteFileFromSupabase(fileUrl) {
  try {
    if (!fileUrl) return true;
    
    // Extract the path from the URL
    const bucketName = process.env.SUPABASE_BUCKET || 'dotstripe';
    const urlObj = new URL(fileUrl);
    const pathRegex = new RegExp(`storage/v1/object/public/${bucketName}/(.+)`);
    const match = urlObj.pathname.match(pathRegex);
    
    if (!match || !match[1]) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return false;
    }
    
    const filePath = match[1];
    console.log(`Deleting file: ${filePath}`);

    // Delete from Supabase Storage
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    console.log('File deleted successfully');
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

module.exports = {
  uploadFileToSupabase,
  deleteFileFromSupabase
};
const multer = require('multer');// Import the Multer library, which is used to handle file uploads (e.g., images, documents) in Node.js

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
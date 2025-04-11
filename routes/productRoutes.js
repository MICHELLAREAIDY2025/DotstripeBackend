const express = require("express")
const router = express.Router()
const productController = require("../controllers/productController")
const { authenticate, isAdmin } = require("../middlewares/authMiddleware")
const upload = require("../middlewares/multer")

// Public routes
router.get("/", productController.getAllProducts)
router.get("/:id", productController.getProductById)
router.get("/category/:categoryId", productController.getProductsByCategory)

// Protected routes (admin only)
router.post("/", authenticate, isAdmin, upload.single("image"), productController.createProduct)
router.put("/:id", authenticate, isAdmin, upload.single("image"), productController.updateProduct)
router.delete("/:id", authenticate, isAdmin, productController.deleteProduct)

module.exports = router

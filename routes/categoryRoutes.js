const express = require("express")
const router = express.Router()
const categoryController = require("../controllers/categoryController")
const { authenticate, isAdmin } = require("../middlewares/authMiddleware")

// Public routes
router.get("/", categoryController.getAllCategories)
router.get("/:id", categoryController.getCategoryById)

// Protected routes (admin only)
router.post("/", authenticate, isAdmin, categoryController.createCategory)
router.put("/:id", authenticate, isAdmin, categoryController.updateCategory)
router.delete("/:id", authenticate, isAdmin, categoryController.deleteCategory)

module.exports = router

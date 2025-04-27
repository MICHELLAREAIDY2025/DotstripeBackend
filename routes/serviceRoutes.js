const express = require("express")
const router = express.Router()
const serviceController = require("../controllers/serviceController")
const { authenticate, isAdmin } = require("../middlewares/authMiddleware")
const upload = require("../middlewares/uploadMiddleware")

// Public routes
router.get("/", serviceController.getAllServices)
router.get("/:id", serviceController.getServiceById)

// Protected routes (admin only)
router.post("/", authenticate, isAdmin, upload.single("image"), serviceController.createService)
router.put("/:id", authenticate, isAdmin, upload.single("image"), serviceController.updateService)
router.delete("/:id", authenticate, isAdmin, serviceController.deleteService)

module.exports = router

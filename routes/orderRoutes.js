const express = require("express")
const router = express.Router()
const orderController = require("../controllers/orderController")
const { authenticate, isAdmin } = require("../middlewares/authMiddleware")

// User routes (require authentication)
router.get("/", authenticate, orderController.getUserOrders)
router.get("/:id", authenticate, orderController.getOrderById)
router.post("/", authenticate, orderController.createOrder)
router.put("/:id/cancel", authenticate, orderController.cancelOrder)

// Admin routes
router.put("/:id/status", authenticate, isAdmin, orderController.updateOrderStatus)

module.exports = router

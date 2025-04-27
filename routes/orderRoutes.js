const express = require("express")
const router = express.Router()
const orderController = require("../controllers/orderController")
const { authenticate, isAdmin } = require("../middlewares/authMiddleware")

// User routes (require authentication)
router.post("/", authenticate, orderController.createOrder)

// Admin routes
router.put("/:id/status", authenticate, isAdmin, orderController.updateOrderStatus)
router.delete("/:id", authenticate, isAdmin, orderController.deleteOrder)
router.put("/:id/cancel", authenticate, isAdmin, orderController.cancelOrder)

// IMPORTANT: Define specific routes BEFORE parameterized routes
router.get('/best-sellers', authenticate, isAdmin, orderController.getBestSellers)

// Fix the duplicate GET routes
router.get("/", authenticate, isAdmin, orderController.getAllOrders) // Admin gets all orders
router.get("/user", authenticate, orderController.getUserOrders) // User gets their own orders

// This should be the LAST route
router.get("/:id", authenticate, orderController.getOrderById)

module.exports = router
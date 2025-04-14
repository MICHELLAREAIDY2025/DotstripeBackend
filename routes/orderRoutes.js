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
router.get("/", authenticate, isAdmin, orderController.getUserOrders)
router.get("/:id", authenticate,isAdmin, orderController.getOrderById)

module.exports = router

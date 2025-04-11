const express = require("express")
const router = express.Router()
const checkoutController = require("../controllers/checkoutController")
const { authenticate, isAdmin } = require("../middlewares/authMiddleware")

// User routes (require authentication)
router.post("/", authenticate, checkoutController.createCheckout)
router.get("/order/:orderId", authenticate, checkoutController.getCheckoutByOrderId)

// Webhook route for payment provider callbacks (no auth required)
router.post("/webhook", checkoutController.updatePaymentStatus)

module.exports = router

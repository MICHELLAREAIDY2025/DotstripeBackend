const { Checkout, Order } = require("../models")

// Create checkout session
exports.createCheckout = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { order_id, shipping_address, billing_address } = req.body

    if (!order_id || !shipping_address) {
      return res.status(400).json({ message: "Order ID and shipping address are required" })
    }

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      where: {
        id: order_id,
        user_id: userId,
      },
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if checkout already exists for this order
    const existingCheckout = await Checkout.findOne({
      where: { order_id },
    })

    if (existingCheckout) {
      return res.status(400).json({ message: "Checkout already exists for this order" })
    }

    // Create checkout
    const checkout = await Checkout.create({
      user_id: userId,
      order_id,
      payment_status: "pending",
      shipping_address,
      billing_address: billing_address || shipping_address,
      created_at: new Date(),
      updated_at: new Date(),
    })

    res.status(201).json(checkout)
  } catch (error) {
    console.error("Error creating checkout:", error)
    res.status(500).json({ message: "Failed to create checkout", error: error.message })
  }
}

// Update checkout payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { payment_intent_id, payment_status } = req.body

    if (!payment_status || !["pending", "processing", "succeeded", "failed"].includes(payment_status)) {
      return res.status(400).json({ message: "Invalid payment status" })
    }

    const checkout = await Checkout.findByPk(id)

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" })
    }

    await checkout.update({
      payment_intent_id,
      payment_status,
      updated_at: new Date(),
    })

    // Update order payment status if checkout payment succeeded
    if (payment_status === "succeeded") {
      const order = await Order.findByPk(checkout.order_id)
      if (order) {
        await order.update({
          payment_status: "paid",
          status: "processing",
          updated_at: new Date(),
        })
      }
    }

    res.status(200).json(checkout)
  } catch (error) {
    console.error("Error updating payment status:", error)
    res.status(500).json({ message: "Failed to update payment status", error: error.message })
  }
}

// Get checkout by order ID
exports.getCheckoutByOrderId = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { orderId } = req.params

    const checkout = await Checkout.findOne({
      where: {
        order_id: orderId,
        user_id: userId,
      },
      include: [{ model: Order }],
    })

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" })
    }

    res.status(200).json(checkout)
  } catch (error) {
    console.error("Error fetching checkout:", error)
    res.status(500).json({ message: "Failed to fetch checkout", error: error.message })
  }
}

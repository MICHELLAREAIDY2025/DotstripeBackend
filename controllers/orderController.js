const { Order, OrderItem, Cart, Product, Service, Checkout } = require("../models")
const sequelize = require("../config/db")

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware

    const orders = await Order.findAll({
      where: { user_id: userId },
      include: [
        {
          model: OrderItem,
          include: [{ model: Product }, { model: Service }],
        },
      ],
      order: [["created_at", "DESC"]],
    })

    res.status(200).json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ message: "Failed to fetch orders", error: error.message })
  }
}

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { id } = req.params

    const order = await Order.findOne({
      where: {
        id,
        user_id: userId,
      },
      include: [
        {
          model: OrderItem,
          include: [{ model: Product }, { model: Service }],
        },
        { model: Checkout },
      ],
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.status(200).json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ message: "Failed to fetch order", error: error.message })
  }
}

// Create new order from cart
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { shipping_address, payment_method } = req.body

    if (!shipping_address) {
      return res.status(400).json({ message: "Shipping address is required" })
    }

    // Get cart items
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      include: [{ model: Product }, { model: Service }],
      transaction,
    })

    if (cartItems.length === 0) {
      await transaction.rollback()
      return res.status(400).json({ message: "Cart is empty" })
    }

    // Calculate total amount
    let totalAmount = 0
    for (const item of cartItems) {
      if (item.Product) {
        totalAmount += Number.parseFloat(item.Product.price) * item.quantity
      } else if (item.Service) {
        totalAmount += Number.parseFloat(item.Service.price) * item.quantity
      }
    }

    // Create order
    const order = await Order.create(
      {
        user_id: userId,
        total_amount: totalAmount,
        status: "pending",
        shipping_address,
        payment_method,
        payment_status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction },
    )

    // Create order items
    const orderItems = []
    for (const item of cartItems) {
      const price = item.Product ? item.Product.price : item.Service.price

      const orderItem = await OrderItem.create(
        {
          order_id: order.id,
          product_id: item.product_id,
          service_id: item.service_id,
          quantity: item.quantity,
          price,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction },
      )

      orderItems.push(orderItem)
    }

    // Clear cart
    await Cart.destroy({
      where: { user_id: userId },
      transaction,
    })

    await transaction.commit()

    res.status(201).json({
      order,
      orderItems,
    })
  } catch (error) {
    await transaction.rollback()
    console.error("Error creating order:", error)
    res.status(500).json({ message: "Failed to create order", error: error.message })
  }
}

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const order = await Order.findByPk(id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    await order.update({
      status,
      updated_at: new Date(),
    })

    res.status(200).json(order)
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ message: "Failed to update order status", error: error.message })
  }
}

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { id } = req.params

    const order = await Order.findOne({
      where: {
        id,
        user_id: userId,
      },
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (["shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({
        message: "Cannot cancel order that has been shipped or delivered",
      })
    }

    await order.update({
      status: "cancelled",
      updated_at: new Date(),
    })

    res.status(200).json(order)
  } catch (error) {
    console.error("Error cancelling order:", error)
    res.status(500).json({ message: "Failed to cancel order", error: error.message })
  }
}
// Delete an order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params

    const order = await Order.findByPk(id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Optionally: delete associated order items and checkout records
    await OrderItem.destroy({ where: { order_id: id } })
    await Checkout.destroy({ where: { order_id: id } })

    await order.destroy()

    res.status(200).json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    res.status(500).json({ message: "Failed to delete order", error: error.message })
  }
}

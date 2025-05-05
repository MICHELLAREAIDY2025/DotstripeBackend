const { Order, OrderItem, Cart, Product, Service, Checkout, User } = require("../models")
const sequelize = require("../config/db")
const { sendOrderStatusEmail } = require("../services/emailService")


exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
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
    console.error("Error fetching all orders:", error)
    res.status(500).json({ message: "Failed to fetch orders", error: error.message })
  }
}

// Fix the getBestSellers function
exports.getBestSellers = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { year, month } = req.query;
    
    console.log("Fetching best sellers with filters:", { year, month });
    
    // Build the SQL query for best sellers
    let query = `
      SELECT 
        p.id, 
        p.name as product_name, 
        p.stock, 
        COUNT(oi.product_id) as "totalSales"
      FROM 
        products p
      JOIN 
        order_items oi ON p.id = oi.product_id
      JOIN 
        orders o ON oi.order_id = o.id
      WHERE 
        o.status = 'delivered'
    `;
    
    // Add filters if provided
    const queryParams = [];
    
    if (year && year !== 'all') {
      query += ` AND EXTRACT(YEAR FROM o.created_at) = ?`;
      queryParams.push(year);
    }
    
    if (month && month !== 'all') {
      // Convert month name to month number (1-12)
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthNumber = monthNames.indexOf(month) + 1;
      
      if (monthNumber > 0) {
        query += ` AND EXTRACT(MONTH FROM o.created_at) = ?`;
        queryParams.push(monthNumber);
      }
    }
    
    // Group by product and order by sales count
    query += `
      GROUP BY 
        p.id, p.name, p.stock
      ORDER BY 
        "totalSales" DESC
      LIMIT 10
    `;
    
    console.log("Executing query:", query);
    console.log("With parameters:", queryParams);
    
    // Execute the raw query
    const results = await sequelize.query(query, {
      replacements: queryParams,
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log("Query results:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({ error: 'Failed to fetch best-selling products', details: error.message });
  }
}

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.findAll({
    where: { user_id: userId },
    include: [{ model: OrderItem, include: [Product] }],
  });
  res.json(orders);
}

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { id } = req.params

    // Validate that id is a number
    if (isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid order ID" })
    }

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
  const { items, shipping_address, payment_method, total_amount } = req.body;
  const userId = req.user.id;
  const order = await Order.create({
    user_id: userId,
    shipping_address,
    payment_method, // "cash"
    total_amount,
    status: payment_method === "cash_on_delivery" ? "pending" : "awaiting_payment",
  });
  // 2. Create order items
  for (const item of items) {
    await OrderItem.create({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    });
  }
  // 3. Optionally clear cart
  await Cart.destroy({ where: { user_id: userId } });
  console.log("Order payload received:", req.body);
  res.status(201).json(order);
}

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Update order status
    await order.update({
      status,
      updated_at: new Date(),
    })

    // Send email notification if status is not pending
    if (status !== 'pending' && order.User) {
      const emailSent = await sendOrderStatusEmail(order, order.User, status)
      if (!emailSent) {
        console.warn(`Failed to send email notification for order #${order.id}`)
      }
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order,
      emailSent: status !== 'pending'
    })
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

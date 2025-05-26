const { Cart, Product, Service, Category } = require("../models")// Importing multiple models

// Get user's cart
exports.getUserCart = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware

    const cartItems = await Cart.findAll({
      where: { user_id: userId },//filter cart items by user id 
      include: [  // Include associated models (Product and Service) in the result
        {
          model: Product,
          attributes: ["id", "name", "price", "image_url", "description", "stock"],
          include: [
            {
              model: Category,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Service,
          attributes: ["id", "name", "price", "image_url"],
        },
      ],
    })

    res.status(200).json(cartItems)
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ message: "Failed to fetch cart", error: error.message })
  }
}

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { product_id, service_id, quantity } = req.body

    if (!product_id && !service_id) {
      return res.status(400).json({ message: "Either product_id or service_id is required" })
    }

    // Check if product or service exists
    if (product_id) {
      const product = await Product.findByPk(product_id)
      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }
    }

    if (service_id) {
      const service = await Service.findByPk(service_id)
      if (!service) {
        return res.status(404).json({ message: "Service not found" })
      }
    }

    // Check if item already exists in cart
    const whereClause = { user_id: userId }// Start building a query condition with user ID

    if (product_id) { // If a product_id is provided, add it to the query condition
      whereClause.product_id = product_id
    } else {  // Otherwise, assume it's a service and add service_id to the condition
      whereClause.service_id = service_id
    }

    const existingItem = await Cart.findOne({ where: whereClause })

    if (existingItem) {
      // Update quantity if item already exists
      await existingItem.update({
        quantity: existingItem.quantity + (quantity || 1),
        updated_at: new Date(),
      })

      return res.status(200).json(existingItem)
    }

    // Create new cart item
    const newCartItem = await Cart.create({
      user_id: userId,
      product_id,
      service_id,
      quantity: quantity || 1,
      created_at: new Date(),
      updated_at: new Date(),
    })

    res.status(201).json(newCartItem)
  } catch (error) {
    console.error("Error adding to cart:", error)
    res.status(500).json({ message: "Failed to add to cart", error: error.message })
  }
}

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { id } = req.params
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" })
    }

    // Check if cart item exists and belongs to user
    const cartItem = await Cart.findOne({
      where: {
        id,
        user_id: userId,
      },
    })

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    // Update cart item
    await cartItem.update({
      quantity,
      updated_at: new Date(),
    })

    res.status(200).json(cartItem)
  } catch (error) {
    console.error("Error updating cart item:", error)
    res.status(500).json({ message: "Failed to update cart item", error: error.message })
  }
}

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware
    const { id } = req.params

    // Check if cart item exists and belongs to user
    const cartItem = await Cart.findOne({
      where: {
        id,
        user_id: userId,
      },
    })

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    // Delete cart item
    await cartItem.destroy()
    res.status(200).json({ message: "Item removed from cart" })
  } catch (error) {
    console.error("Error removing from cart:", error)
    res.status(500).json({ message: "Failed to remove from cart", error: error.message })
  }
}

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id // Assuming user ID is available from auth middleware

    // Delete all cart items for user
    await Cart.destroy({
      where: { user_id: userId },
    })

    res.status(200).json({ message: "Cart cleared successfully" })
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({ message: "Failed to clear cart", error: error.message })
  }
}

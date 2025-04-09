const { Product, Category } = require("../models")

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, attributes: ["id", "name"] }],
    })
    res.status(200).json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ message: "Failed to fetch products", error: error.message })
  }
}

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ["id", "name"] }],
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.status(200).json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ message: "Failed to fetch product", error: error.message })
  }
}

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, image_url, category_id } = req.body

    if (!name || !price) {
      return res.status(400).json({ message: "Product name and price are required" })
    }

    // Check if category exists
    if (category_id) {
      const category = await Category.findByPk(category_id)
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" })
      }
    }

    const newProduct = await Product.create({
      name,
      description,
      price,
      stock: stock || 0,
      image_url,
      category_id,
    })

    res.status(201).json(newProduct)
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ message: "Failed to create product", error: error.message })
  }
}

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, image_url, category_id } = req.body
    const product = await Product.findByPk(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if category exists if category_id is provided
    if (category_id) {
      const category = await Category.findByPk(category_id)
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" })
      }
    }

    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      stock: stock !== undefined ? stock : product.stock,
      image_url: image_url !== undefined ? image_url : product.image_url,
      category_id: category_id !== undefined ? category_id : product.category_id,
    })

    res.status(200).json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Failed to update product", error: error.message })
  }
}

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    await product.destroy()
    res.status(200).json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Failed to delete product", error: error.message })
  }
}

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params

    const products = await Product.findAll({
      where: { category_id: categoryId },
      include: [{ model: Category, attributes: ["id", "name"] }],
    })

    res.status(200).json(products)
  } catch (error) {
    console.error("Error fetching products by category:", error)
    res.status(500).json({ message: "Failed to fetch products", error: error.message })
  }
}

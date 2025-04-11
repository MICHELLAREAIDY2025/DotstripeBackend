const { Category, Product } = require("../models")

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
    })
    res.status(200).json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).json({ message: "Failed to fetch categories", error: error.message })
  }
}

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findByPk(id)

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.status(200).json(category)
  } catch (error) {
    console.error("Error fetching category:", error)
    res.status(500).json({ message: "Failed to fetch category", error: error.message })
  }
}

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    const newCategory = await Category.create({
      name,
      description,
      image_url,
      created_at: new Date(),
      updated_at: new Date(),
    })

    res.status(201).json(newCategory)
  } catch (error) {
    console.error("Error creating category:", error)
    res.status(500).json({ message: "Failed to create category", error: error.message })
  }
}

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, image_url } = req.body

    // Check if category exists
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Update category
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      image_url: image_url !== undefined ? image_url : category.image_url,
      updated_at: new Date(),
    })

    res.status(200).json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    res.status(500).json({ message: "Failed to update category", error: error.message })
  }
}

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    // Check if category exists
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check if category is being used by products
    const productsCount = await Product.count({
      where: { category_id: id },
    })

    if (productsCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category that has products. Remove or reassign products first.",
      })
    }

    // Delete category
    await category.destroy()
    res.status(200).json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    res.status(500).json({ message: "Failed to delete category", error: error.message })
  }
}

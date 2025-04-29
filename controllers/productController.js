const { Product, Category, Cart, OrderItem } = require("../models");
const { uploadFileToSupabase, deleteFileFromSupabase } = require('../services/uploadService');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
};

// Create new product with image upload
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    console.log("Create product request body:", req.body);
    console.log("File in request:", req.file);

    if (!name || !price) {
      return res.status(400).json({ message: "Product name and price are required" });
    }

    // Check if category exists if provided
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    // Handle image upload if file is provided
    let image_url = null;
    if (req.file) {
      try {
        console.log("Attempting to upload image to Supabase...");
        image_url = await uploadFileToSupabase(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'products'
        );
        console.log("Image uploaded successfully to Supabase:", image_url);
      } catch (uploadError) {
        console.error("Error uploading image to Supabase:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload product image", 
          error: uploadError.message 
        });
      }
    } else {
      console.log("No image file provided in request");
    }

    // Create product with image URL
    const newProduct = await Product.create({
      name,
      description,
      price,
      stock: stock || 0,
      image_url,
      category_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log("Product created with image URL:", image_url);

    // Fetch the product with category for the response
    const productWithCategory = await Product.findByPk(newProduct.id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
    });
    console.log("Product with category:", productWithCategory);

    res.status(201).json(productWithCategory);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

// Update product with image upload
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id } = req.body;
    console.log("Update product request body:", req.body);
    console.log("File in request:", req.file);

    // Check if product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if category exists if provided
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    // Handle image upload if file is provided
    let image_url = product.image_url;
    if (req.file) {
      try {
        console.log("Attempting to upload new image to Supabase...");
        // Upload new image
        const newImageUrl = await uploadFileToSupabase(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'products'
        );
        console.log("New image uploaded successfully to Supabase:", newImageUrl);
        
        // Delete old image if it exists
        if (product.image_url) {
          console.log("Deleting old image from Supabase:", product.image_url);
          await deleteFileFromSupabase(product.image_url);
        }
        
        image_url = newImageUrl;
      } catch (uploadError) {
        console.error("Error updating image in Supabase:", uploadError);
        return res.status(500).json({ 
          message: "Failed to update product image", 
          error: uploadError.message 
        });
      }
    } else {
      console.log("No new image file provided in request");
    }

    // Update product
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      stock: stock !== undefined ? stock : product.stock,
      image_url: image_url,
      category_id: category_id !== undefined ? category_id : product.category_id,
      updated_at: new Date(),
    });
    console.log("Product updated with image URL:", image_url);

    // Fetch the updated product with category for the response
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
    });
    console.log("Updated product with category:", updatedProduct);

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

// Delete product and its image
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is in any cart or order
    const cartCount = await Cart.count({ where: { product_id: id } });
    const orderCount = await OrderItem.count({ where: { product_id: id } });

    if (cartCount > 0 || orderCount > 0) {
      return res.status(400).json({
        message: "Cannot delete product that is in carts or orders",
      });
    }

    // Delete image from Supabase if it exists
    if (product.image_url) {
      try {
        await deleteFileFromSupabase(product.image_url);
        console.log("Product image deleted successfully");
      } catch (deleteError) {
        console.error("Error deleting product image:", deleteError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete product
    await product.destroy();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Verify category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.findAll({
      where: { category_id: categoryId },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const { Op } = require("sequelize");
    
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Failed to search products", error: error.message });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    // This is a placeholder implementation - you might want to add a 'featured' field to your products table
    // or implement your own logic for determining featured products
    const products = await Product.findAll({
      limit: 6,
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]], // Most recent products as featured
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ message: "Failed to fetch featured products", error: error.message });
  }
};
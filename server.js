const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const path = require("path")
require("dotenv").config()

// Import database connection
const sequelize = require("./config/db")

// Import routes
const categoryRoutes = require("./routes/categoryRoutes")
const productRoutes = require("./routes/productRoutes")
const serviceRoutes = require("./routes/serviceRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")
const checkoutRoutes = require("./routes/checkoutRoutes")
const userRoutes = require("./routes/userRoutes")

// Initialize express app
const app = express()

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*", // Allow any origin if FRONTEND_URL is not set
  credentials: true,
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// API routes
app.use("/api/categories", categoryRoutes)
app.use("/api/products", productRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/checkout", checkoutRoutes)
app.use("/api/users", userRoutes)

// Root route
app.get("/", (req, res) => {
  res.send("E-commerce API is running!")
})

app.get('/products', (req, res) => {
  // Replace with your real product data
  res.json([
    { id: 1, name: "Product 1", price: 10 },
    { id: 2, name: "Product 2", price: 20 }
  ]);
});

app.get('/categories', (req, res) => {
  // Replace with your real category data
  res.json([
    { id: 1, name: "Category 1" },
    { id: 2, name: "Category 2" }
  ]);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Database connection and server start
// Using a safer approach for database sync
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully.")

    // Start server without altering tables
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err)
  })

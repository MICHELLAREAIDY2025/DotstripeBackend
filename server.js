const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const path = require("path")
require("dotenv").config()

// Import database connection
const db = require("./config/db")

// Import routes
const categoryRoutes = require("./routes/categoryRoutes")
const productRoutes = require("./routes/productRoutes")
const serviceRoutes = require("./routes/serviceRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")
const checkoutRoutes = require("./routes/checkoutRoutes")
const userRoutes = require("./routes/userRoutes") // Add this line to import user routes

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
app.use("/api/users", userRoutes) // Add this line to register user routes

// Root route
app.get("/", (req, res) => {
  res.send("E-commerce API is running!")
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Start server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

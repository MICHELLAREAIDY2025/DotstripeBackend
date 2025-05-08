const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const path = require("path")
const bodyParser = require("body-parser")
require("dotenv").config()
const uploadRoutes = require('./routes/uploadRoutes');

// Import database connection
const sequelize = require("./config/db")

// Verify environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_BUCKET',
  'FRONTEND_URL'
];

// Set default JWT expiration if not provided
if (!process.env.JWT_EXPIRES) {
  process.env.JWT_EXPIRES = '24h'; // Default to 24 hours
  console.log('JWT_EXPIRES not set, using default value: 24h');
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Import routes
const categoryRoutes = require("./routes/categoryRoutes")
const productRoutes = require("./routes/productRoutes")
const serviceRoutes = require("./routes/serviceRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")
const checkoutRoutes = require("./routes/checkoutRoutes")
const userRoutes = require("./routes/userRoutes")
const shippingRoutes = require("./routes/shippingRoutes")

// Initialize express app
const app = express()

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://dotstripe-frontend-git-michella-michellareaidy2025s-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization']
    /*'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Credentials'
  ]*/
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(bodyParser.json())

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
app.use("/api/shipping", shippingRoutes)
app.use("/api/uploads", uploadRoutes);

// Test database connection endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: "Database connection is working",
      config: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        // Don't send password in response
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
});

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
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully.")
    console.log("Database configuration:", {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      // Don't log the password for security
    })

    // Start server without altering tables
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV}`)
    })
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err)
    console.error("Database connection error details:", {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    })
  })

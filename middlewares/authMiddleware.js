const jwt = require("jsonwebtoken")
require("dotenv").config()

// Default JWT secret if not provided in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key-change-this-in-production"

// Authenticate middleware
exports.authenticate = (req, res, next) => {
  try {
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(401).json({ message: "Invalid or expired token" })
  }
}

// Admin authorization middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin privileges required" })
  }

  next()
}

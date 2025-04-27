const jwt = require("jsonwebtoken")
const { User } = require("../models") // Make sure to import your User model
require("dotenv").config()

// Authenticate middleware
exports.authenticate = async (req, res, next) => {
  try {
    let token

    // Check for token in cookies first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }
    // Then check Authorization header (for API clients)
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    // Verify token
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables")
      return res.status(500).json({ message: "Server configuration error" })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // Optional: Check if user still exists in database
      // Uncomment if you want this additional security check
      /*
      const user = await User.findByPk(decoded.id)
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" })
      }
      */

      req.user = decoded
      next()
    } catch (error) {
      console.error("JWT verification error:", error)
      return res.status(401).json({ message: "Invalid or expired token" })
    }
  } catch (error) {
    console.error("Authentication middleware error:", error)
    return res.status(500).json({ message: "Server error" })
  }
}

// Admin authorization middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin privileges required" })
  }

  next()
}
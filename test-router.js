const express = require("express")
const app = express()
const port = 3001

// Simple middleware function
const testMiddleware = (req, res, next) => {
  console.log("Test middleware executed")
  next()
}

// Simple route handler
const testHandler = (req, res) => {
  res.send("Test route works!")
}

// Create a router
const router = express.Router()

// Add a route with middleware
router.get("/test", testMiddleware, testHandler)

// Register the router
app.use("/api", router)

// Start the server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`)
})

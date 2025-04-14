const { Sequelize } = require("sequelize")
require("dotenv").config()

// Get connection string from environment variables
const connectionString = process.env.DATABASE_URL

// Log connection attempt (with masked password)
const maskedConnectionString = connectionString
  ? connectionString.replace(/:[^:]*@/, ":****@")
  : "No connection string provided"

console.log("Attempting to connect to database with Sequelize...")
console.log("Connection string (masked):", maskedConnectionString)

// Create Sequelize instance with better SSL configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false, // Set to true for debugging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
})

module.exports = sequelize

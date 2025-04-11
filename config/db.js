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

// Create Sequelize instance
const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    statement_timeout: 30000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  logging: process.env.NODE_ENV === "development" ? console.log : false,
})

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.")
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err)
  })

module.exports = sequelize

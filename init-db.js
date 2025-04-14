const sequelize = require("./config/db")
const { Category, Product, Service, User, Cart, Order, OrderItem, Checkout } = require("./models")
const bcrypt = require("bcryptjs")

async function initializeDatabase() {
  try {
    console.log("Starting database initialization...")

    // Test connection
    await sequelize.authenticate()
    console.log("Connection has been established successfully.")

    // Sync models with database (force: false to avoid dropping tables)
    await sequelize.sync({ force: false, alter: false })
    console.log("Database synchronized without altering tables.")

    // Check if admin user exists
    const adminExists = await User.findOne({ where: { role: "admin" } })

    if (!adminExists) {
      console.log("Creating admin user...")
      await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: bcrypt.hashSync("Admin123", 10),
        role: "admin",
        created_at: new Date(),
        updated_at: new Date(),
      })
      console.log("Admin user created successfully.")
    } else {
      console.log("Admin user already exists.")
    }

    console.log("Database initialization completed successfully.")
  } catch (error) {
    console.error("Database initialization failed:", error)
  } finally {
    // Close the connection
    await sequelize.close()
  }
}

// Run the initialization
initializeDatabase()

require("dotenv").config()
const { Sequelize } = require("sequelize")

async function testConnection() {
  console.log("Testing database connection...")

  // Get connection string from environment
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set")
    return false
  }

  // Log masked connection string for debugging
  const maskedConnectionString = connectionString.replace(/:[^:]*@/, ":****@")
  console.log("Connection string (masked):", maskedConnectionString)

  // Create a new Sequelize instance directly in this file for testing
  const sequelize = new Sequelize(connectionString, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  })

  try {
    console.log("Testing database connection with Sequelize...")

    // Test the connection
    await sequelize.authenticate()

    console.log("✅ Connection successful!")

    // Test a simple query
    const [results] = await sequelize.query("SELECT NOW() as time")
    console.log("Current time from database:", results[0].time)

    return true
  } catch (error) {
    console.error("❌ Connection failed:", error.message)

    // Provide specific troubleshooting advice based on error
    if (error.message.includes("timeout")) {
      console.error("\n🔍 TROUBLESHOOTING:")
      console.error("1. Check if your IP is allowed in Supabase dashboard")
      console.error("2. Verify the connection string is correct")
      console.error("3. Try using the connection pooler URL (ends with .pooler.supabase.com)")
      console.error("4. Make sure you're using port 5432")
    } else if (error.message.includes("password authentication failed")) {
      console.error("\n🔍 TROUBLESHOOTING:")
      console.error("1. Check if your password is correct")
      console.error("2. Make sure special characters in password are URL encoded")
    } else if (error.message.includes("connection refused")) {
      console.error("\n🔍 TROUBLESHOOTING:")
      console.error("1. Your IP might be temporarily blocked due to failed connection attempts")
      console.error("2. Wait 30 minutes or contact Supabase support to unblock your IP")
    }

    return false
  } finally {
    // Close the connection
    if (sequelize) {
      await sequelize.close()
    }
  }
}

testConnection()

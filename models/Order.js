const { DataTypes, Sequelize } = require("sequelize")
const sequelize = require("../config/db")

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // Changed from ENUM to STRING to match existing schema
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "processing", "shipped", "delivered", "cancelled"]],
      },
    },
    shipping_address: {
      type: DataTypes.TEXT,
    },
    payment_method: {
      type: DataTypes.STRING,
    },
    payment_status: {
      type: DataTypes.STRING, // Changed from ENUM to STRING
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "paid", "failed"]],
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  },
)

module.exports = Order

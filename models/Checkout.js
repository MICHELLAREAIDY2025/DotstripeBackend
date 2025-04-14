const { DataTypes, Sequelize } = require("sequelize")
const sequelize = require("../config/db")

const Checkout = sequelize.define(
  "Checkout",
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
    order_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "orders",
        key: "id",
      },
    },
    payment_intent_id: {
      type: DataTypes.STRING,
    },
    payment_status: {
      type: DataTypes.STRING, // Changed from ENUM to STRING
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "processing", "succeeded", "failed"]],
      },
    },
    shipping_address: {
      type: DataTypes.TEXT,
    },
    billing_address: {
      type: DataTypes.TEXT,
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
    tableName: "checkout",
    timestamps: false,
  },
)

module.exports = Checkout

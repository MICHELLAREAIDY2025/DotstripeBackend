const { DataTypes, Sequelize } = require("sequelize")
const sequelize = require("../config/db")

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "orders",
        key: "id",
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "products",
        key: "id",
      },
    },
    service_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "services",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    tableName: "order_items",
    timestamps: false,
  },
)

module.exports = OrderItem

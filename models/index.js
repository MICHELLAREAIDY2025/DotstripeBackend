const sequelize = require("../config/db")
const Category = require("./Category")
const Product = require("./Product")
const Service = require("./Service")
const User = require("./User")
const Cart = require("./Cart")
const Order = require("./Order")
const OrderItem = require("./OrderItem")
const Checkout = require("./Checkout")

// Define associations
Category.hasMany(Product, { foreignKey: "category_id" })
Product.belongsTo(Category, { foreignKey: "category_id" })

User.hasMany(Order, { foreignKey: "user_id" })
Order.belongsTo(User, { foreignKey: "user_id" })

User.hasMany(Cart, { foreignKey: "user_id" })
Cart.belongsTo(User, { foreignKey: "user_id" })

Order.hasMany(OrderItem, { foreignKey: "order_id" })
OrderItem.belongsTo(Order, { foreignKey: "order_id" })

Product.hasMany(OrderItem, { foreignKey: "product_id" })
OrderItem.belongsTo(Product, { foreignKey: "product_id" })

Service.hasMany(OrderItem, { foreignKey: "service_id" })
OrderItem.belongsTo(Service, { foreignKey: "service_id" })

Product.hasMany(Cart, { foreignKey: "product_id" })
Cart.belongsTo(Product, { foreignKey: "product_id" })

Service.hasMany(Cart, { foreignKey: "service_id" })
Cart.belongsTo(Service, { foreignKey: "service_id" })

Order.hasOne(Checkout, { foreignKey: "order_id" })
Checkout.belongsTo(Order, { foreignKey: "order_id" })

User.hasMany(Checkout, { foreignKey: "user_id" })
Checkout.belongsTo(User, { foreignKey: "user_id" })

module.exports = {
  sequelize,
  Category,
  Product,
  Service,
  User,
  Cart,
  Order,
  OrderItem,
  Checkout,
}

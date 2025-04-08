const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { Op } = require("sequelize");

exports.checkout = async (req, res) => {
    try {
        const user_id = req.user.id;
        const cartItems = await Cart.findAll({ where: { user_id } });

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        let total_price = 0;

        for (let item of cartItems) {
            const product = await Product.findByPk(item.product_id);
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item.product_id} not found` });
            }
            total_price += product.price * item.quantity;
        }
 
        const order = await Order.create({ user_id, total_price, status: 'pending' });
 
        for (let item of cartItems) {
            await OrderItem.create({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity
            });
 
            await Product.increment('stock', {
                by: item.quantity,
                where: { id: item.product_id }
            });
        }
 
        await Cart.destroy({ where: { user_id } });

        return res.status(201).json({ message: 'Order placed successfully', order_id: order.id });
    } catch (error) {
        console.error('Checkout Error:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

// Get All Orders (Admin Only, No Relationships)
exports.getAllOrders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const orders = await Order.findAll(); // No Sequelize associations
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Get Orders Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Get Order Items by Order ID (Without Associations)
exports.getOrderItems = async (req, res) => {
    try {
        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only allow the order owner or admin to access
        if (req.user.id !== order.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied!' });
        }

        // Fetch Order Items without Sequelize associations
        const orderItems = await OrderItem.findAll({ where: { order_id } });

        return res.status(200).json(orderItems);
    } catch (error) {
        console.error('Get Order Items Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Cancel Order (Admins Only)
exports.cancelOrder = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);

        if (!order) return res.status(404).json({ error: 'Order not found' });

        await order.update({ status: 'canceled' });

        return res.status(200).json({ message: 'Order has been canceled' });
    } catch (error) {
        console.error('Cancel Order Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
//delete order
exports.deleteOrder = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);
        
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const orderItemsCount = await OrderItem.count({ where: { order_id } });
        if (orderItemsCount > 0) {
            return res.status(400).json({ error: 'Cannot delete order with order items. Delete order items first.' });
        }

        await order.destroy();

        return res.status(200).json({ message: 'Order successfully deleted' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        return res.status(500).json({ error: error.message });
    }
};


// Update Order Item (Admins Only)
exports.updateOrderItem = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const { order_item_id } = req.params;
        const { quantity } = req.body;

        const orderItem = await OrderItem.findByPk(order_item_id);
        if (!orderItem) return res.status(404).json({ error: 'Order item not found' });

        await orderItem.update({ quantity });

        return res.status(200).json({ message: 'Order item updated successfully' });
    } catch (error) {
        console.error('Update Order Item Error:', error);
        return res.status(500).json({ error: error.message });
    }
};


exports.deleteOrderItem = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const { order_id, order_item_id } = req.params;

        const order = await Order.findByPk(order_id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderItem = await OrderItem.findOne({ where: { id: order_item_id, order_id } });
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        await orderItem.destroy();

        // Check if there are any remaining items in the order
        const remainingItems = await OrderItem.count({ where: { order_id } });

        if (remainingItems === 0) {
            await order.destroy();
            return res.status(200).json({ message: 'Order item removed, and order deleted as it had no items left.' });
        }

        return res.status(200).json({ message: 'Order item removed successfully' });
    } catch (error) {
        console.error('Delete Order Item Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied! Admins only.' });
        }

        const { order_id } = req.params;
        const updateData = req.body;  
 
        const order = await Order.findByPk(order_id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
 
        await order.update(updateData);

        return res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Update Order Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
// Get Orders for Logged-in User
exports.getUserOrders = async (req, res) => {
    try {
        const user_id = req.user.id;

        
        const orders = await Order.findAll({ where: { user_id } });

        if (orders.length === 0) {
            return res.status(404).json({ error: 'No orders found for this user' });
        }

        return res.status(200).json(orders);
    } catch (error) {
        console.error('Get User Orders Error:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

//////////////////////////////////////////////////////////


exports.getBestSellingProducts = async (req, res) => {
    try {
        console.log("Received query:", req.query);
        const { year = "all", month = "all" } = req.query;
        let whereClause = {};

        if (year !== "all") {
            whereClause.createdAt = {
                [Op.gte]: new Date(`${year}-01-01`),
                [Op.lte]: new Date(`${year}-12-31`),
            };
        }

        if (month !== "all" && year !== "all") {
            const monthNumber = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
            if (isNaN(monthNumber)) {
                return res.status(400).json({ error: "Invalid month format" });
            }

            whereClause.createdAt = {
                [Op.gte]: new Date(`${year}-${monthNumber}-01`),
                [Op.lte]: new Date(`${year}-${monthNumber}-31`),
            };
        }

        console.log("Applied filters:", whereClause);

        const orderItems = await OrderItem.findAll({
            include: [
                {
                    model: Order, 
                    where: whereClause,
                    attributes: [] 
                },
                {
                    model: Product, 
                    attributes: ["id", "name"]
                }
            ]
        });

        console.log("Fetched order items count:", orderItems.length);

        if (orderItems.length === 0) {
            return res.status(200).json([]);  
        }

        orderItems.forEach(item => {
            if (!item.Product) {
                console.error(` Product not found for OrderItem ID: ${item.id}, Product ID: ${item.product_id}`);
            }
        });

        const productSales = {};
        orderItems.forEach(item => {
            if (item.Product) { 
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = { product_name: item.Product.name, totalSales: 0 };
                }
                productSales[item.product_id].totalSales += item.quantity;
            }
        });

        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.totalSales - a.totalSales);
 
        const bestSellers = sortedProducts.length > 0 ? sortedProducts.slice(0, 3) : [sortedProducts[0]];

        console.log("Best-selling products:", bestSellers);
        return res.status(200).json(bestSellers);
    } catch (error) {
        console.error("Get Best-Selling Products Error:", error);
        return res.status(500).json({ error: error.message || "Something went wrong." });
    }
};

const emailjs = require('@emailjs/nodejs');

// Email templates for different order statuses
const emailTemplates = {
  processing: (orderId, customerName) => ({
    template_id: process.env.EMAILJS_ORDER_PROCESSING_TEMPLATE,
    template_params: {
      to_name: customerName,
      order_id: orderId,
      status: 'Processing',
      message: 'Your order is now being processed by our team. We\'ll notify you when your order is ready for shipping.',
      company_name: 'Dotstripe'
    }
  }),
  shipped: (orderId, customerName) => ({
    template_id: process.env.EMAILJS_ORDER_SHIPPED_TEMPLATE,
    template_params: {
      to_name: customerName,
      order_id: orderId,
      status: 'Shipped',
      message: 'Great news! Your order has been shipped. You can track your order status in your account dashboard.',
      company_name: 'Dotstripe'
    }
  }),
  delivered: (orderId, customerName) => ({
    template_id: process.env.EMAILJS_ORDER_DELIVERED_TEMPLATE,
    template_params: {
      to_name: customerName,
      order_id: orderId,
      status: 'Delivered',
      message: 'Your order has been delivered! We hope you enjoy your purchase. If you have any questions, please don\'t hesitate to contact us.',
      company_name: 'Dotstripe'
    }
  }),
  cancelled: (orderId, customerName) => ({
    template_id: process.env.EMAILJS_ORDER_CANCELLED_TEMPLATE,
    template_params: {
      to_name: customerName,
      order_id: orderId,
      status: 'Cancelled',
      message: 'Your order has been cancelled as requested. If you didn\'t request this cancellation, please contact our support team immediately.',
      company_name: 'Dotstripe'
    }
  })
};

// Function to send order status update email
const sendOrderStatusEmail = async (order, user, newStatus) => {
  try {
    const template = emailTemplates[newStatus];
    if (!template) {
      console.error(`No email template found for status: ${newStatus}`);
      return false;
    }

    const { template_id, template_params } = template(order.id, user.name);

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      template_id,
      {
        ...template_params,
        to_email: user.email,
        from_name: 'Dotstripe',
        reply_to: process.env.EMAILJS_REPLY_TO
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY
      }
    );

    console.log(`Order status email sent to ${user.email} for order #${order.id}`);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
};

module.exports = {
  sendOrderStatusEmail,
}; 
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const paymentService = require('../services/paymentService');
const { sendOrderConfirmation, sendOrderCancellation } = require('../services/emailService');
const { emitToUser, emitToAdmins } = require('../sockets/socketHandler');
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.user = req.user.id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name price images')
      .populate('paymentProvider', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Order.countDocuments(filter);
    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('paymentProvider', 'name');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
const createOrder = async (req, res, next) => {
  try {
    const Cart = require('../models/Cart');
    const { shippingAddress, paymentMethod, shippingMethod } = req.body;
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }
    let subtotal = 0;
    const orderItems = [];
    for (const cartItem of cart.items) {
      if (!cartItem.product) continue;
      const product = cartItem.product;
      if (product.inventory && product.inventory.quantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product: ${product.name}`
        });
      }
      const itemTotal = product.price * cartItem.quantity;
      subtotal += itemTotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        total: itemTotal
      });
    }
    const tax = 0; 
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      items: orderItems,
      subtotal,
      tax,
      shipping: { 
        cost: shipping,
        method: shippingMethod 
      },
      total,
      shippingAddress: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || ''
      },
      paymentMethod: 'credit-card', 
      status: 'pending',
      paymentStatus: 'pending'
    });
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name price images' }
    ]);
    cart.items = [];
    await cart.save();
    try {
      const orderForEmail = {
        ...order.toObject(),
        subtotal,
        shippingCost: shipping,
        totalAmount: total
      };
      await sendOrderConfirmation(orderForEmail);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'order_creation',
      resource: 'order',
      resourceId: order._id.toString(),
      details: { total, itemCount: orderItems.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
const processPayment = async (req, res, next) => {
  try {
    const { paymentProviderId, paymentMethodId, returnUrl } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to process payment for this order'
      });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Order has already been paid'
      });
    }
    const paymentData = {
      amount: order.total,
      currency: 'USD',
      paymentMethodId,
      returnUrl,
      orderId: order.orderNumber
    };
    const paymentResult = await paymentService.processPayment(paymentProviderId, paymentData);
    if (paymentResult.success) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.transactionId = paymentResult.transactionId;
      order.paymentProvider = paymentProviderId;
      order.timeline.push({
        status: 'paid',
        note: 'Payment processed successfully'
      });
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            'inventory.quantity': -item.quantity,
            'sales.totalSold': item.quantity,
            'sales.totalRevenue': item.total
          }
        });
      }
      await order.save();
      await sendPaymentConfirmation(order);
      const notification = await Notification.create({
        recipient: req.user.id,
        title: 'Payment Confirmed',
        message: `Your payment of $${order.total} has been processed successfully`,
        type: 'payment',
        data: { orderId: order._id }
      });
      if (global.io) {
        emitToUser(global.io, req.user.id, 'payment_confirmed', {
          order,
          notification
        });
        if (global.io) {
          emitToAdmins(global.io, 'new_payment', {
            order,
            amount: order.total
          });
        }
      }
      await AuditLog.create({
        user: req.user._id,
        action: 'payment_processed',
        resource: 'order',
        resourceId: order._id.toString(),
        details: { amount: order.total, transactionId: paymentResult.transactionId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.json({
        success: true,
        data: {
          order,
          payment: paymentResult
        }
      });
    } else {
      order.paymentStatus = 'failed';
      order.timeline.push({
        status: 'payment_failed',
        note: paymentResult.message || 'Payment processing failed'
      });
      await order.save();
      res.status(400).json({
        success: false,
        error: 'Payment processing failed',
        details: paymentResult.message
      });
    }
  } catch (error) {
    next(error);
  }
};
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, trackingNumber, notes, shipping, estimatedDelivery, timeline } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber || shipping?.trackingNumber) {
      order.shipping = order.shipping || {};
      order.shipping.trackingNumber = trackingNumber || shipping?.trackingNumber;
    }
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    if (timeline && timeline.length > 0) {
      order.timeline = timeline;
    } else {
      order.timeline.push({
        status: status || order.status,
        note: notes || `Order status updated to ${status || order.status}`
      });
    }
    if (status === 'shipped' && !order.estimatedDelivery) {
      order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (status === 'delivered') {
      order.actualDelivery = new Date();
    }
    await order.save();
    if (status && order.user?.email) {
      const { sendOrderStatusUpdate } = require('../services/emailService');
      sendOrderStatusUpdate(order.user.email, {
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        status: status,
        trackingNumber: order.shipping?.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items,
        total: order.total
      }).catch(err => {
        console.error('Failed to send order status update email:', err);
      });
    }
    const notification = await Notification.create({
      recipient: order.user,
      sender: req.user.id,
      title: 'Order Status Updated',
      message: `Your order ${order.orderNumber} is now ${status || order.status}`,
      type: 'system',
      data: { orderId: order._id }
    });
    if (global.io) {
      emitToUser(global.io, order.user, 'order_status_updated', {
        order,
        notification
      });
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'order_status_update',
      resource: 'order',
      resourceId: req.params.id,
      details: { status, paymentStatus, trackingNumber },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price images');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order'
      });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Order is already cancelled'
      });
    }
    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel delivered order'
      });
    }
    order.status = 'cancelled';
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || (req.user.role === 'admin' ? 'Order cancelled by admin' : 'Order cancelled by customer')
    });
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { 'inventory.quantity': item.quantity }
        });
      }
    }
    await order.save();
    if (order.paymentStatus === 'paid') {
      try {
        if (order.paymentProvider && order.transactionId) {
          await paymentService.refundPayment(
            order.paymentProvider,
            order.transactionId,
            order.total
          );
        }
        order.paymentStatus = 'refunded';
        await order.save();
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
    }
    try {
      await sendOrderCancellation(order, reason || 'Order cancelled as requested');
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'order_cancellation',
      resource: 'order',
      resourceId: order._id.toString(),
      details: { 
        reason: reason || 'No reason provided',
        refundStatus: order.paymentStatus,
        cancelledBy: req.user.role === 'admin' ? 'admin' : 'customer'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getOrders,
  getOrder,
  createOrder,
  processPayment,
  updateOrderStatus,
  cancelOrder
};
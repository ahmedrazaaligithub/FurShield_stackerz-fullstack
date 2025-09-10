const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const paymentService = require('../services/paymentService');
const { sendPaymentConfirmation } = require('../services/emailService');
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
    const { items, shippingAddress, billingAddress, notes } = req.body;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.product}`
        });
      }

      if (!product.inStock || product.inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product: ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        variant: item.variant,
        total: itemTotal
      });
    }

    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      subtotal,
      tax,
      shipping: { cost: shipping },
      total,
      shippingAddress,
      billingAddress,
      notes
    });

    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name price images' }
    ]);

    await AuditLog.create({
      user: req.user._id,
      action: 'order_creation',
      resource: 'order',
      resourceId: order._id.toString(),
      details: { total, itemCount: items.length },
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

        emitToAdmins(global.io, 'new_payment', {
          order,
          amount: order.total
        });
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
    const { status, trackingNumber, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.status = status;
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    
    order.timeline.push({
      status,
      note: notes || `Order status updated to ${status}`
    });

    if (status === 'shipped') {
      order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    const notification = await Notification.create({
      recipient: order.user,
      sender: req.user.id,
      title: 'Order Status Updated',
      message: `Your order ${order.orderNumber} is now ${status}`,
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
      details: { status, trackingNumber },
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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order'
      });
    }

    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel order in current status'
      });
    }

    order.status = 'cancelled';
    order.timeline.push({
      status: 'cancelled',
      note: reason || 'Order cancelled by user'
    });

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.quantity': item.quantity }
      });
    }

    await order.save();

    if (order.paymentStatus === 'paid') {
      try {
        await paymentService.refundPayment(
          order.paymentProvider,
          order.transactionId,
          order.total
        );
        order.paymentStatus = 'refunded';
        await order.save();
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
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

const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../utils/appError');
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  let subtotal = 0;
  cart.items.forEach(item => {
    if (item.product) {
      subtotal += item.product.price * item.quantity;
    }
  });
  const discount = cart.coupon ? (subtotal * cart.coupon.discountPercentage / 100) : 0;
  const total = subtotal - discount;
  res.json({
    success: true,
    data: {
      ...cart.toObject(),
      subtotal,
      discount,
      total
    }
  });
});
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  if (product.stock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, quantity }]
    });
  } else {
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        throw new AppError('Insufficient stock', 400);
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
  }
  await cart.populate('items.product');
  res.status(201).json({
    success: true,
    data: cart,
    message: 'Item added to cart successfully'
  });
});
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity < 1) {
    throw new AppError('Product ID and valid quantity are required', 400);
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  if (product.stock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );
  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }
  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  await cart.populate('items.product');
  res.json({
    success: true,
    data: cart,
    message: 'Cart updated successfully'
  });
});
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );
  await cart.save();
  await cart.populate('items.product');
  res.json({
    success: true,
    data: cart,
    message: 'Item removed from cart successfully'
  });
});
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  cart.items = [];
  cart.coupon = null;
  await cart.save();
  res.json({
    success: true,
    data: cart,
    message: 'Cart cleared successfully'
  });
});
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    throw new AppError('Coupon code is required', 400);
  }
  const validCoupons = {
    'SAVE10': { discountPercentage: 10, minAmount: 50 },
    'SAVE20': { discountPercentage: 20, minAmount: 100 },
    'WELCOME': { discountPercentage: 15, minAmount: 0 }
  };
  const coupon = validCoupons[code.toUpperCase()];
  if (!coupon) {
    throw new AppError('Invalid coupon code', 400);
  }
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  const subtotal = cart.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  if (subtotal < coupon.minAmount) {
    throw new AppError(`Minimum order amount of $${coupon.minAmount} required for this coupon`, 400);
  }
  cart.coupon = {
    code: code.toUpperCase(),
    discountPercentage: coupon.discountPercentage
  };
  await cart.save();
  res.json({
    success: true,
    data: cart,
    message: 'Coupon applied successfully'
  });
});
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  cart.coupon = null;
  await cart.save();
  await cart.populate('items.product');
  res.json({
    success: true,
    data: cart,
    message: 'Coupon removed successfully'
  });
});
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
};
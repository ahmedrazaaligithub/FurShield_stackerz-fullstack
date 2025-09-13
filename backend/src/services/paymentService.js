const PaymentProvider = require('../models/PaymentProvider');
const { logger } = require('../utils/logger');
class PaymentService {
  constructor() {
    this.providers = new Map();
    this.loadProviders();
  }
  async loadProviders() {
    try {
      const providers = await PaymentProvider.find({ isActive: true });
      providers.forEach(provider => {
        this.providers.set(provider._id.toString(), provider);
      });
    } catch (error) {
      logger.error('Failed to load payment providers:', error);
    }
  }
  async addProvider(providerData) {
    try {
      const provider = await PaymentProvider.create(providerData);
      this.providers.set(provider._id.toString(), provider);
      return provider;
    } catch (error) {
      logger.error('Failed to add payment provider:', error);
      throw error;
    }
  }
  async removeProvider(providerId) {
    try {
      await PaymentProvider.findByIdAndUpdate(providerId, { isActive: false });
      this.providers.delete(providerId);
    } catch (error) {
      logger.error('Failed to remove payment provider:', error);
      throw error;
    }
  }
  getProvider(providerId) {
    return this.providers.get(providerId);
  }
  getAllProviders() {
    return Array.from(this.providers.values());
  }
  async processPayment(providerId, paymentData) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error('Payment provider not found');
    }
    try {
      switch (provider.name.toLowerCase()) {
        case 'stripe':
          return await this.processStripePayment(provider, paymentData);
        case 'paypal':
          return await this.processPayPalPayment(provider, paymentData);
        case 'mock':
        default:
          return await this.processMockPayment(provider, paymentData);
      }
    } catch (error) {
      logger.error('Payment processing failed:', error);
      throw error;
    }
  }
  async processStripePayment(provider, paymentData) {
    const stripe = require('stripe')(provider.secretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100),
      currency: paymentData.currency || 'usd',
      payment_method: paymentData.paymentMethodId,
      confirm: true,
      return_url: paymentData.returnUrl
    });
    return {
      success: paymentIntent.status === 'succeeded',
      transactionId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    };
  }
  async processPayPalPayment(provider, paymentData) {
    const paypal = require('@paypal/checkout-server-sdk');
    const environment = provider.sandboxMode 
      ? new paypal.core.SandboxEnvironment(provider.publicKey, provider.secretKey)
      : new paypal.core.LiveEnvironment(provider.publicKey, provider.secretKey);
    const client = new paypal.core.PayPalHttpClient(environment);
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: paymentData.currency || 'USD',
          value: paymentData.amount.toString()
        }
      }]
    });
    const order = await client.execute(request);
    return {
      success: order.result.status === 'CREATED',
      transactionId: order.result.id,
      status: order.result.status,
      amount: paymentData.amount,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    };
  }
  async processMockPayment(provider, paymentData) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.1;
    return {
      success,
      transactionId: 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      status: success ? 'succeeded' : 'failed',
      amount: paymentData.amount,
      message: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds'
    };
  }
  async refundPayment(providerId, transactionId, amount) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error('Payment provider not found');
    }
    try {
      switch (provider.name.toLowerCase()) {
        case 'stripe':
          return await this.refundStripePayment(provider, transactionId, amount);
        case 'paypal':
          return await this.refundPayPalPayment(provider, transactionId, amount);
        case 'mock':
        default:
          return await this.refundMockPayment(provider, transactionId, amount);
      }
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }
  async refundStripePayment(provider, transactionId, amount) {
    const stripe = require('stripe')(provider.secretKey);
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    };
  }
  async refundPayPalPayment(provider, transactionId, amount) {
    return {
      success: true,
      refundId: 'paypal_refund_' + Date.now(),
      amount,
      status: 'completed'
    };
  }
  async refundMockPayment(provider, transactionId, amount) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      refundId: 'mock_refund_' + Date.now(),
      amount,
      status: 'completed'
    };
  }
}
module.exports = new PaymentService();
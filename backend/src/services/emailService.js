const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    const message = {
      from: `PetCare <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };
    const info = await transporter.sendMail(message);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};
const sendAppointmentReminder = async (appointment) => {
  const message = `
    Dear ${appointment.owner.name},
    This is a reminder that you have an appointment scheduled for ${appointment.pet.name} on ${appointment.appointmentDate}.
    Appointment Details:
    - Pet: ${appointment.pet.name}
    - Veterinarian: ${appointment.vet.name}
    - Date: ${appointment.appointmentDate}
    - Reason: ${appointment.reason}
    Please arrive 15 minutes early for check-in.
    Best regards,
    PetCare Team
  `;
  return sendEmail({
    email: appointment.owner.email,
    subject: 'Appointment Reminder - PetCare',
    message
  });
};
const sendOrderConfirmation = async (order) => {
  const itemsList = order.items.map(item => 
    `• ${item.product.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-box { background: white; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-id { font-family: monospace; font-size: 14px; color: #6c757d; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; font-size: 18px; color: #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <p>Thank you for your purchase</p>
        </div>
        <div class="content">
          <p>Dear ${order.user.name || 'Valued Customer'},</p>
          <p>Your order has been successfully placed and is being processed. We'll send you another email when your order ships.</p>
          <div class="order-box">
            <h3>Order Details</h3>
            <p class="order-id">Order ID: ${order._id}</p>
            <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            <h4>Items Ordered:</h4>
            ${order.items.map(item => `
              <div class="item-row">
                <span>${item.product.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <div class="item-row">
                <span>Subtotal:</span>
                <span>$${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="item-row">
                <span>Shipping:</span>
                <span>${order.shippingCost === 0 ? 'FREE' : '$' + order.shippingCost.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Total:</span>
                <span>$${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div class="order-box">
            <h3>Shipping Information</h3>
            <p>
              ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
              ${order.shippingAddress.country}
            </p>
            <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="button">
              Track Your Order
            </a>
          </div>
          <p>If you have any questions about your order, please don't hesitate to contact us at support@furshield.com</p>
          <p>Thank you for shopping with FurShield!</p>
          <p>Best regards,<br>The FurShield Team</p>
        </div>
        <div class="footer">
          <p>FurShield - Everything Your Pet Needs</p>
          <p>This email was sent to ${order.user.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const textMessage = `
    Dear ${order.user.name || 'Valued Customer'},
    Your order has been successfully placed!
    Order ID: ${order._id}
    Order Date: ${new Date(order.createdAt).toLocaleDateString()}
    Items Ordered:
    ${itemsList}
    Subtotal: $${order.subtotal.toFixed(2)}
    Shipping: ${order.shippingCost === 0 ? 'FREE' : '$' + order.shippingCost.toFixed(2)}
    Total: $${order.totalAmount.toFixed(2)}
    Shipping Address:
    ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}
    ${order.shippingAddress.address}
    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
    Estimated Delivery: 3-5 business days
    Track your order: ${process.env.CLIENT_URL}/orders/${order._id}
    Thank you for shopping with FurShield!
    Best regards,
    The FurShield Team
  `;
  return sendEmail({
    email: order.user.email,
    subject: `Order Confirmation #${order._id} - FurShield`,
    message: textMessage,
    html: htmlContent
  });
};
const sendOrderCancellation = async (order, reason = 'Customer request') => {
  const itemsList = order.items.map(item => 
    `• ${item.product?.name || item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-box { background: white; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-id { font-family: monospace; font-size: 14px; color: #6c757d; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .refund-info { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Order Cancelled</h1>
          <p>Your order has been cancelled</p>
        </div>
        <div class="content">
          <p>Dear ${order.user?.name || 'Valued Customer'},</p>
          <p>We're writing to confirm that your order has been cancelled as requested.</p>
          <div class="order-box">
            <h3>Cancelled Order Details</h3>
            <p class="order-id">Order ID: ${order._id}</p>
            <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Cancellation Reason: ${reason}</p>
            <h4>Items Cancelled:</h4>
            ${order.items.map(item => `
              <div style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                <span>${item.product?.name || item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                <span>Total Amount:</span>
                <span>$${order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          <div class="refund-info">
            <h3>💰 Refund Information</h3>
            <p><strong>Refund Status:</strong> ${order.paymentStatus === 'paid' ? 'Processing - You will receive a full refund within 3-5 business days' : 'No payment was processed for this order'}</p>
            ${order.paymentStatus === 'paid' ? '<p><strong>Refund Method:</strong> Original payment method</p>' : ''}
          </div>
          <p>If you have any questions about this cancellation or need assistance with a new order, please don't hesitate to contact us.</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/shop" class="button">
              Continue Shopping
            </a>
          </div>
          <p>We apologize for any inconvenience and look forward to serving you again.</p>
          <p>Best regards,<br>The FurShield Team</p>
        </div>
        <div class="footer">
          <p>FurShield - Everything Your Pet Needs</p>
          <p>This email was sent to ${order.user?.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const textMessage = `
    Dear ${order.user?.name || 'Valued Customer'},
    Your order has been cancelled as requested.
    Order ID: ${order._id}
    Order Date: ${new Date(order.createdAt).toLocaleDateString()}
    Cancellation Reason: ${reason}
    Items Cancelled:
    ${itemsList}
    Total Amount: $${order.total?.toFixed(2) || '0.00'}
    Refund Status: ${order.paymentStatus === 'paid' ? 'Processing - You will receive a full refund within 3-5 business days' : 'No payment was processed for this order'}
    If you have any questions, please contact us at support@furshield.com
    Best regards,
    The FurShield Team
  `;
  return sendEmail({
    email: order.user?.email,
    subject: `Order Cancelled #${order._id} - FurShield`,
    message: textMessage,
    html: htmlContent
  });
};
const sendAdoptionStatusUpdate = async (listing, user, status) => {
  const message = `
    Dear ${user.name},
    Your adoption application for ${listing.title} has been ${status}.
    ${status === 'approved' ? 'Congratulations! Please contact the shelter to arrange pickup.' : 'Thank you for your interest. Please consider other pets available for adoption.'}
    Best regards,
    PetCare Team
  `;
  return sendEmail({
    email: user.email,
    subject: `Adoption Application ${status} - PetCare`,
    message
  });
};
const sendVetVerificationUpdate = async (vet, status) => {
  const message = `
    Dear ${vet.name},
    Your veterinarian verification has been ${status}.
    ${status === 'approved' ? 'You can now provide telehealth consultations and access full pet records.' : 'Please contact support for more information.'}
    Best regards,
    PetCare Team
  `;
  return sendEmail({
    email: vet.email,
    subject: `Veterinarian Verification ${status} - PetCare`,
    message
  });
};
const sendEmailVerification = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to FurShield!</h2>
      <p>Dear ${user.name},</p>
      <p>Thank you for registering with FurShield. Please verify your email address to complete your account setup.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        If you didn't create an account with FurShield, please ignore this email.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The FurShield Team
      </p>
    </div>
  `;
  const message = `
    Dear ${user.name},
    Thank you for registering with FurShield. Please verify your email address by clicking the link below:
    ${verificationUrl}
    This verification link will expire in 24 hours.
    If you didn't create an account with FurShield, please ignore this email.
    Best regards,
    The FurShield Team
  `;
  return sendEmail({
    email: user.email,
    subject: 'Verify Your Email Address - FurShield',
    message,
    html
  });
};
const sendVetApprovalEmail = async (vet) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veterinarian Application Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .badge { background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations Dr. ${vet.name}!</h1>
          <p>Your veterinarian application has been approved</p>
        </div>
        <div class="content">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge">✅ VERIFIED VETERINARIAN</span>
          </div>
          <p>We're excited to inform you that your veterinarian profile has been successfully verified and approved on FurShield!</p>
          <h3>What's Next?</h3>
          <ul>
            <li>✅ Your profile now displays the "Verified Veterinarian" badge</li>
            <li>✅ Pet owners can now book appointments with you</li>
            <li>✅ You can access all veterinarian features and tools</li>
            <li>✅ Start providing professional care to pets in your area</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/profile" class="button">
              View Your Profile
            </a>
          </div>
          <p>Thank you for joining the FurShield community. We look forward to the excellent care you'll provide to pets and their families.</p>
          <p>Best regards,<br>The FurShield Team</p>
        </div>
        <div class="footer">
          <p>FurShield - Protecting Pets, Connecting Hearts</p>
          <p>If you have any questions, contact us at support@furshield.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    email: vet.email,
    subject: '🎉 Veterinarian Application Approved - FurShield',
    html: htmlContent
  });
};
const sendVetRejectionEmail = async (vet, reason) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veterinarian Application Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Update</h1>
          <p>Regarding your veterinarian application</p>
        </div>
        <div class="content">
          <p>Dear Dr. ${vet.name},</p>
          <p>Thank you for your interest in joining FurShield as a verified veterinarian. After careful review, we regret to inform you that your application has not been approved at this time.</p>
          <div class="reason-box">
            <strong>Reason for rejection:</strong><br>
            ${reason}
          </div>
          <h3>Next Steps:</h3>
          <ul>
            <li>📋 Review the feedback provided above</li>
            <li>📄 Update your credentials and documentation</li>
            <li>🔄 You may reapply after addressing the mentioned concerns</li>
            <li>📞 Contact our support team if you need clarification</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/contact" class="button">
              Contact Support
            </a>
          </div>
          <p>We appreciate your understanding and encourage you to reapply once you've addressed the feedback.</p>
          <p>Best regards,<br>The FurShield Team</p>
        </div>
        <div class="footer">
          <p>FurShield - Protecting Pets, Connecting Hearts</p>
          <p>If you have any questions, contact us at support@furshield.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    email: vet.email,
    subject: 'Veterinarian Application Update - FurShield',
    html: htmlContent
  });
};
const sendOrderStatusUpdate = async (email, orderData) => {
  const { orderNumber, customerName, status, trackingNumber, estimatedDelivery, items, total } = orderData;
  const statusMessages = {
    'pending': 'Your order has been received and is being processed.',
    'confirmed': 'Your order has been confirmed and will be processed soon.',
    'processing': 'Your order is being prepared for shipment.',
    'shipped': `Your order has been shipped! ${trackingNumber ? `Tracking Number: ${trackingNumber}` : ''}`,
    'delivered': 'Your order has been delivered successfully!',
    'cancelled': 'Your order has been cancelled.'
  };
  const statusColors = {
    'pending': '#FFA500',
    'confirmed': '#4169E1',
    'processing': '#4169E1',
    'shipped': '#9370DB',
    'delivered': '#32CD32',
    'cancelled': '#DC143C'
  };
  const itemsHtml = items?.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${item.name || item.product?.name || 'Product'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('') || '';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Status Update</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">FurShield - Your Pet Care Partner</p>
        </div>
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-bottom: 10px;">Hello ${customerName || 'Valued Customer'},</h2>
          <div style="background-color: ${statusColors[status]}; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin: 0; font-size: 20px;">Order Status: ${status.toUpperCase()}</h3>
            <p style="margin: 10px 0 0 0;">${statusMessages[status]}</p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            ${trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
            ${estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString()}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${total?.toFixed(2) || '0.00'}</p>
          </div>
          ${itemsHtml ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          ` : ''}
          <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 10px;">
            <h4 style="color: #1f2937; margin-top: 0;">What's Next?</h4>
            ${status === 'confirmed' ? '<p>We\'re preparing your order for processing.</p>' : ''}
            ${status === 'processing' ? '<p>Your order is being carefully packed and will be shipped soon.</p>' : ''}
            ${status === 'shipped' ? '<p>Your order is on its way! You can track your package using the tracking number provided above.</p>' : ''}
            ${status === 'delivered' ? '<p>We hope you enjoy your purchase! If you have any issues, please contact our support team.</p>' : ''}
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL}/orders" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order Details</a>
          </div>
        </div>
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0;">Need help? Contact us at support@furshield.com</p>
          <p style="color: #6b7280; margin: 10px 0 0 0;">© 2024 FurShield. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    email: email,
    subject: `Order ${orderNumber} - Status Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: htmlContent
  });
};
module.exports = {
  sendEmail,
  sendAppointmentReminder,
  sendOrderConfirmation,
  sendOrderCancellation,
  sendOrderStatusUpdate,
  sendAdoptionStatusUpdate,
  sendVetVerificationUpdate,
  sendEmailVerification,
  sendVetApprovalEmail,
  sendVetRejectionEmail
};
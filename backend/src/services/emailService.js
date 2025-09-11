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

const sendPaymentConfirmation = async (order) => {
  const message = `
    Dear ${order.user.name},
    
    Your payment has been successfully processed.
    
    Order Details:
    - Order Number: ${order.orderNumber}
    - Total: $${order.total}
    - Status: ${order.status}
    
    Thank you for your purchase!
    
    Best regards,
    PetCare Team
  `;

  return sendEmail({
    email: order.user.email,
    subject: 'Payment Confirmation - PetCare',
    message
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
            <a href="${process.env.FRONTEND_URL}/profile" class="button">
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

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: vet.email,
    subject: '🎉 Veterinarian Application Approved - FurShield',
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
  sendAppointmentReminder,
  sendPaymentConfirmation,
  sendAdoptionStatusUpdate,
  sendVetVerificationUpdate,
  sendEmailVerification,
  sendVetApprovalEmail
};

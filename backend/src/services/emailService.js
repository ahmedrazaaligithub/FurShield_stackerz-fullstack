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

module.exports = {
  sendEmail,
  sendAppointmentReminder,
  sendPaymentConfirmation,
  sendAdoptionStatusUpdate,
  sendVetVerificationUpdate
};

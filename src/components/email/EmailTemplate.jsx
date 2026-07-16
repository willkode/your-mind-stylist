import React from "react";

export default function EmailTemplate({ children, preheader }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Mind Stylist</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #F9F5EF;
      color: #2B2725;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #1E3A32;
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: bold;
      color: #F9F5EF;
      margin: 0;
    }
    .subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: rgba(249, 245, 239, 0.6);
      margin: 8px 0 0;
    }
    .content {
      padding: 48px 32px;
    }
    .footer {
      background-color: #F9F5EF;
      padding: 32px;
      text-align: center;
      font-size: 12px;
      color: rgba(43, 39, 37, 0.6);
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background-color: #1E3A32;
      color: #F9F5EF;
      text-decoration: none;
      font-size: 14px;
      letter-spacing: 0.05em;
      margin: 24px 0;
    }
    .divider {
      height: 1px;
      background-color: #E4D9C4;
      margin: 32px 0;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      color: #1E3A32;
      margin: 0 0 16px;
    }
    p {
      line-height: 1.6;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <div class="subtitle">Roberta Fernandez</div>
      <div class="logo">The Mind Stylist</div>
    </div>
    <div class="content">
      ${children}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} The Mind Stylist. All rights reserved.</p>
      <p>Emotional Intelligence • Mind Styling • Leadership & Personal Transformation</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Export individual email templates as functions that return HTML strings

export const WelcomeEmail = ({ name, loginLink }) => EmailTemplate({
  preheader: "Welcome to The Mind Stylist Portal",
  children: `
    <h1>Welcome to The Mind Stylist</h1>
    <p>Hi ${name},</p>
    <p>Your account has been created successfully. You now have access to your personal Mind Stylist Portal.</p>
    <p>Log in anytime:</p>
    <a href="${loginLink}" class="button">Access Your Portal</a>
    <p>— Roberta, The Mind Stylist</p>
  `
});

export const PurchaseReceiptEmail = ({ name, productName, dashboardLink }) => EmailTemplate({
  preheader: "Your purchase is confirmed",
  children: `
    <h1>Your Purchase is Confirmed</h1>
    <p>Hi ${name},</p>
    <p>Thank you for your purchase! You now have access to:</p>
    <p style="font-weight: 600; font-size: 18px; color: #1E3A32;">${productName}</p>
    <p>Access it anytime:</p>
    <a href="${dashboardLink}" class="button">Go to Dashboard</a>
    <p>If you need help, I'm here for you.</p>
    <p>— Roberta</p>
  `
});

export const PasswordResetEmail = ({ name, resetLink }) => EmailTemplate({
  preheader: "Reset your password",
  children: `
    <h1>Reset Your Password</h1>
    <p>Hi ${name},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you didn't request this, you can ignore this message safely.</p>
    <p>— The Mind Stylist Portal</p>
  `
});

export const EmailVerificationEmail = ({ name, verificationLink }) => EmailTemplate({
  preheader: "Confirm your email address",
  children: `
    <h1>Confirm Your Email</h1>
    <p>Hi ${name},</p>
    <p>Please confirm your email by clicking the link below:</p>
    <a href="${verificationLink}" class="button">Verify Email</a>
    <p>Once verified, you'll be able to access your portal.</p>
    <p>— The Mind Stylist Portal</p>
  `
});

export const NewContactFormEmail = ({ name, email, interest, message }) => EmailTemplate({
  preheader: `New message from ${name}`,
  children: `
    <h1>New Message from ${name}</h1>
    <p>Hi Roberta,</p>
    <p>You've received a new message through The Mind Stylist website.</p>
    <div class="divider"></div>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Interest:</strong> ${interest}</p>
    <p><strong>Message:</strong></p>
    <p style="background: #F9F5EF; padding: 16px; border-left: 3px solid #D8B46B;">${message}</p>
    <div class="divider"></div>
    <p>You can respond directly to the email above, or view all messages in your Manager Dashboard.</p>
    <p>— The Mind Stylist Portal</p>
  `
});

export const NewPurchaseEmail = ({ userName, userEmail, productName, timestamp }) => EmailTemplate({
  preheader: "New purchase completed",
  children: `
    <h1>New Purchase Completed</h1>
    <p>Hi Roberta,</p>
    <p>A new purchase has been completed.</p>
    <div class="divider"></div>
    <p><strong>Name:</strong> ${userName}</p>
    <p><strong>Email:</strong> ${userEmail}</p>
    <p><strong>Product:</strong> ${productName}</p>
    <p><strong>Date:</strong> ${timestamp}</p>
    <div class="divider"></div>
    <p>You can view details in your Manager Dashboard.</p>
    <p>— The Mind Stylist Portal</p>
  `
});
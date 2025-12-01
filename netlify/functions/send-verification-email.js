// netlify/functions/send-verification-email.js
const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, userName, verificationLink } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !userName || !verificationLink) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'nkosi1tech@gmail.com',  // Your Gmail
        pass: process.env.GMAIL_APP_PASSWORD  // Your 16-char app password
      }
    });

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  background: #f4f4f4; 
                  padding: 20px; 
                  margin: 0;
              }
              .container { 
                  background: white; 
                  padding: 30px; 
                  border-radius: 10px; 
                  max-width: 500px; 
                  margin: 0 auto; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .button { 
                  background: #000000; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 6px; 
                  display: inline-block; 
                  margin: 15px 0;
              }
              .footer { 
                  margin-top: 20px; 
                  font-size: 12px; 
                  color: #666; 
                  border-top: 1px solid #eee;
                  padding-top: 15px;
              }
              .logo {
                  text-align: center;
                  margin-bottom: 20px;
                  font-size: 24px;
                  font-weight: bold;
                  color: #000000;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">iConnect</div>
              <h2>Verify Your Email Address</h2>
              <p>Hello ${userName},</p>
              <p>Thank you for creating an iConnect account. To complete your registration, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                  <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 4px;">
                  ${verificationLink}
              </p>
              
              <p><strong>This link will expire in 10 minutes.</strong></p>
              
              <div class="footer">
                  <p>If you didn't create an iConnect account, please ignore this email.</p>
                  <p>Need help? Contact our support team: nkosi1tech@gmail.com</p>
                  <p>&copy; 2024 iConnect. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: '"iConnect" <nkosi1tech@gmail.com>',
      to: to,
      subject: 'Verify your iConnect account',
      html: emailHtml
    });

    console.log('Email sent:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        messageId: info.messageId
      })
    };

  } catch (error) {
    console.error('Email sending error:', error);
    
    // Better error messages
    let errorMessage = 'Failed to send verification email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Check app password.';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid email address.';
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message 
      })
    };
  }
};

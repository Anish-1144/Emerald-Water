const OTP = require('../models/OTP.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create email transporter
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send OTP via email
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        message: 'Email service not configured. Please contact administrator.' 
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete any existing unverified OTPs for this email
    await OTP.deleteMany({ 
      email: email.toLowerCase().trim(), 
      verified: false 
    });

    // Save OTP to database
    const otp = new OTP({
      email: email.toLowerCase().trim(),
      otp: otpCode,
      expiresAt,
      verified: false
    });

    await otp.save();

    // Send OTP via email
    const transporter = createTransporter();
    
    const fromName = process.env.EMAIL_FROM_NAME || 'Emerald Water';
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Your OTP for Order Access',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4DB64F;">Emerald Water - Order Access</h2>
          <p>Hello,</p>
          <p>You requested to access your orders. Use the following OTP to verify your email:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4DB64F; font-size: 32px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">© 2024 Emerald Water. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'OTP sent successfully to your email',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // More detailed error message for debugging
    let errorMessage = 'Failed to send OTP. Please try again.';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your email credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Please check your SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage 
    });
  }
};

// Verify OTP and generate JWT token
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp,
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Generate JWT token with 5 days validity
    const token = jwt.sign(
      { 
        email: email.toLowerCase().trim(),
        type: 'order_access'
      },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.json({
      message: 'OTP verified successfully',
      token,
      expiresIn: 5 * 24 * 60 * 60 // 5 days in seconds
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to verify OTP. Please try again.' 
    });
  }
};

module.exports = { sendOTP, verifyOTP };


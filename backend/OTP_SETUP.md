# OTP Authentication Setup

This document explains how to set up OTP-based authentication for order access.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# JWT Secret (required)
JWT_SECRET=your-secret-key-here

# SMTP Configuration for sending OTP emails (required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Gmail Setup (Example)

If using Gmail, you need to:

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## How It Works

1. **User enters email** → System generates 6-digit OTP
2. **OTP sent via email** → Valid for 10 minutes
3. **User enters OTP** → System verifies and issues JWT token
4. **JWT token** → Valid for 5 days, used to access orders
5. **Orders API** → Requires valid JWT token in Authorization header

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Body: { "email": "user@example.com" }
```

### Verify OTP
```
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "token": "jwt-token", "expiresIn": 432000 }
```

### Get Orders (Protected)
```
GET /api/orders/search
Headers: { "Authorization": "Bearer jwt-token" }
```

## Security Features

- OTP expires in 10 minutes
- OTP can only be used once
- JWT token expires in 5 days
- Auto-cleanup of expired OTPs from database
- Email validation before sending OTP


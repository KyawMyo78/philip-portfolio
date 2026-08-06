import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { adminDb } from '../../../../lib/firebase-admin';
import { enforceRateLimit } from '@/lib/rate-limiter';

// Store reset tokens in Firebase (you could also use a database)
async function storeResetToken(email: string, token: string, expiresAt: Date) {
  try {
    await adminDb.collection('password-resets').doc(email).set({
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error storing reset token:', error);
    return false;
  }
}

// Create email transporter
function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Send password reset email
async function sendResetEmail(email: string, resetToken: string) {
  try {
    // Get the site URL dynamically
    const siteUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const resetUrl = `${siteUrl}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Development mode: by default only log the reset URL instead of sending email.
    // To actually send emails in development set SEND_EMAILS_IN_DEV=true in your `.env.local`.
    if (process.env.NODE_ENV === 'development' && process.env.SEND_EMAILS_IN_DEV !== 'true') {
      console.log('\n🔗 PASSWORD RESET LINK (DEVELOPMENT MODE):');
      console.log('📧 Email:', email);
      console.log('🔗 Reset URL:', resetUrl);
      console.log('⏰ Token expires in 1 hour');
      console.log('👆 Copy the reset URL above and paste it in your browser to test\n');
      return true;
    }

    // Production mode: Send actual email
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your Admin Password',
      text: `Reset your admin password using this link: ${resetUrl}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              You requested a password reset for your admin account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="background: #667eea; padding: 20px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 14px;">
              © ${new Date().getFullYear()} ${process.env.SITE_NAME || 'Portfolio'}. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Ensure envelope.from is set to the authenticated user to avoid empty/invalid MAIL FROM
    const envelope = {
      from: process.env.EMAIL_USER,
      to: email,
    }

    const info = await transporter.sendMail({ ...mailOptions, envelope, replyTo: process.env.EMAIL_FROM })
    console.log('sendMail info:', info)
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request, 'password-reset-request', { limit: 3, windowMs: 60 * 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
  const { email } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail || typeof email !== 'string') {
      console.error('ADMIN_EMAIL is not set in environment');
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    if (email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ success: true, message: 'If the account exists, a reset email will be sent.' });
    }
    const recipients = [adminEmail];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store the token
  // Store token for each recipient
  const storePromises = recipients.map(addr => storeResetToken(addr, resetToken, expiresAt));
  const storeResults = await Promise.all(storePromises);
  const tokenStored = storeResults.every(r => r === true);
  if (!tokenStored) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate reset token' },
        { status: 500 }
      );
    }

    // Send the reset email
  // Send to all provided addresses (avoid duplicates)
  // Send to recipients
  const sendResults = await Promise.all(recipients.map(addr => sendResetEmail(addr, resetToken)));
  const emailSent = sendResults.every(r => r === true);
  if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If the account exists, a reset email will be sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'testpass',
      },
    });
  }

  async sendPasswordResetEmail(to, token, appUrl) {
    const resetUrl = `${appUrl}/reset-password/${token}`;

    const mailOptions = {
      from: '"SocialFlow Support" <noreply@socialflow.app>',
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your SocialFlow password. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            If the button doesn't work, copy and paste this link into your browser: <br>
            ${resetUrl}
          </p>
        </div>
      `,
    };

    try {
      if (!process.env.SMTP_USER) {
        console.log('----------------------------------------------------');
        console.log('✉️ NO SMTP CREDENTIALS CONFIGURED.');
        console.log(`✉️ RESET LINK FOR ${to}:`);
        console.log(`✉️ ${resetUrl}`);
        console.log('----------------------------------------------------');
        return { success: true }; // Pretend it worked for dev
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

export default new EmailService();

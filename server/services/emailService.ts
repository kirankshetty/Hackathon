import nodemailer from 'nodemailer';
import { storage } from '../storage';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize with environment variables as fallback
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    // First try to use database settings
    try {
      const settings = await storage.getEmailSettings();
      if (settings?.enableEmails && settings.emailHost && settings.emailUser && settings.emailPass) {
        return nodemailer.createTransport({
          host: settings.emailHost,
          port: parseInt(settings.emailPort || '587'),
          secure: settings.emailPort === '465',
          auth: {
            user: settings.emailUser,
            pass: settings.emailPass,
          },
        });
      }
    } catch (error) {
      console.warn("Failed to load email settings from database:", error);
    }

    // Fallback to environment variables
    if (this.transporter) {
      return this.transporter;
    }

    throw new Error("Email service is not configured. Please configure email settings in Admin Settings.");
  }

  private getRegistrationTemplate(name: string, registrationId: string): EmailTemplate {
    return {
      subject: `🎉 Hackathon Registration Confirmed - Application ID: ${registrationId}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Welcome to HackathonHub!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your journey to innovation starts here</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 25px;">Dear ${name},</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 30px;">
              Congratulations! Your registration for the hackathon has been successfully processed. We're excited to have you join our community of innovators and problem-solvers.
            </p>
            
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #667eea;">
              <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px; font-weight: 600;">Your Application Registration ID</h2>
              <div style="background-color: #667eea; color: white; padding: 15px 20px; border-radius: 8px; text-align: center; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px;">
                ${registrationId}
              </div>
              <p style="margin: 15px 0 0 0; color: #64748b; font-size: 14px; text-align: center;">
                Please save this ID for all future communications and reference
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: white; font-size: 20px; font-weight: 600;">🚀 Access Your Applicant Portal</h3>
              <p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Track your application progress, submit projects, and stay updated on competition stages
              </p>
              <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/applicant/login` : 'https://hackathonhub.replit.app/applicant/login'}" 
                 style="background-color: white; color: #059669; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                Access Applicant Portal
              </a>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 12px;">
                Use your registered email or mobile number to login with OTP verification
              </p>
            </div>

            <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600;">What happens next?</h3>
              <div style="space-y: 15px;">
                <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                  <div style="background-color: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px; flex-shrink: 0;">1</div>
                  <div>
                    <strong style="color: #1e293b;">Access Your Portal:</strong>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Use the link above to access your dedicated applicant portal where you can track progress and submit projects.</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                  <div style="background-color: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px; flex-shrink: 0;">2</div>
                  <div>
                    <strong style="color: #1e293b;">Orientation Invitation:</strong>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">You'll receive a meeting link for our orientation session where we'll cover rules, timelines, and answer your questions.</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                  <div style="background-color: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px; flex-shrink: 0;">3</div>
                  <div>
                    <strong style="color: #1e293b;">Project Submission:</strong>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Get ready to submit your innovative project via GitHub repository with all required documentation through your portal.</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <div style="background-color: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px; flex-shrink: 0;">4</div>
                  <div>
                    <strong style="color: #1e293b;">Regular Updates:</strong>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Stay tuned for important announcements, deadline reminders, and exciting updates about the event.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Important:</strong> Please keep your Application Registration ID safe and readily accessible. You'll need it for all future correspondence and event-related activities.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Have questions? We're here to help!</p>
              <p style="color: #64748b; font-size: 14px;">Contact us at: <a href="mailto:support@hackathonhub.com" style="color: #667eea; text-decoration: none;">support@hackathonhub.com</a></p>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 16px; font-weight: 500;">Best regards,</p>
            <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">The HackathonHub Team</p>
          </div>
        </div>
      `,
      text: `Welcome to HackathonHub! Your Application Registration ID is ${registrationId}. Please keep this ID safe for all future communications and reference. 

ACCESS YOUR APPLICANT PORTAL: ${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/applicant/login` : 'https://hackathonhub.replit.app/applicant/login'}

Use your registered email or mobile number to login with OTP verification. Through your portal you can track progress, submit projects, and stay updated.

Next steps: 1) Access your applicant portal, 2) Wait for orientation meeting link, 3) Prepare for GitHub submission phase, 4) Stay tuned for regular updates. Contact: support@hackathonhub.com`,
    };
  }

  private getOrientationTemplate(name: string, meetingLink: string): EmailTemplate {
    return {
      subject: 'Hackathon Orientation Meeting Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Orientation Meeting Details</h2>
          <p>Dear ${name},</p>
          <p>We're excited to have you join our hackathon! Here's the link for the orientation meeting:</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <a href="${meetingLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Orientation Meeting</a>
          </div>
          <p>During the orientation, you'll learn about:</p>
          <ul>
            <li>Hackathon rules and guidelines</li>
            <li>Submission requirements</li>
            <li>Timeline and important dates</li>
            <li>Q&A session</li>
          </ul>
          <p>Best regards,<br>HackathonHub Team</p>
        </div>
      `,
      text: `Orientation meeting link: ${meetingLink}`,
    };
  }

  private getSelectionTemplate(name: string, registrationCode: string): EmailTemplate {
    return {
      subject: 'Congratulations! You\'ve been selected for the Hackathon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Congratulations!</h2>
          <p>Dear ${name},</p>
          <p>We're thrilled to inform you that you've been selected to participate in our hackathon!</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #065f46;">Your Registration Code: ${registrationCode}</h3>
            <p style="margin-bottom: 0;">Please use this code for event day registration.</p>
          </div>
          <p>To confirm your participation, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/confirm-participation?code=${registrationCode}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Participation</a>
          </div>
          <p>Important details:</p>
          <ul>
            <li>Please confirm your participation within 48 hours</li>
            <li>Bring your registration code on the event day</li>
            <li>Event details will be shared separately</li>
          </ul>
          <p>Best regards,<br>HackathonHub Team</p>
        </div>
      `,
      text: `Congratulations! You've been selected. Your registration code is ${registrationCode}. Confirm participation at: ${process.env.APP_URL}/confirm-participation?code=${registrationCode}`,
    };
  }

  async sendRegistrationConfirmation(email: string, name: string, registrationId: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const template = this.getRegistrationTemplate(name, registrationId);
      
      // Get sender email from database settings or fallback to environment
      let fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      try {
        const settings = await storage.getEmailSettings();
        if (settings?.fromEmail) {
          fromEmail = settings.fromEmail;
        } else if (settings?.emailUser) {
          fromEmail = settings.emailUser;
        }
      } catch (error) {
        console.warn("Failed to get sender email from database:", error);
      }
      
      await storage.createNotification({
        type: 'email',
        recipient: email,
        subject: template.subject,
        message: template.text,
      });

      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      console.log(`Registration confirmation email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send registration confirmation:", error);
      throw error;
    }
  }

  async sendOrientationLink(email: string, name: string, meetingLink: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const template = this.getOrientationTemplate(name, meetingLink);
      
      let fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      try {
        const settings = await storage.getEmailSettings();
        if (settings?.fromEmail) {
          fromEmail = settings.fromEmail;
        } else if (settings?.emailUser) {
          fromEmail = settings.emailUser;
        }
      } catch (error) {
        console.warn("Failed to get sender email from database:", error);
      }
      
      await storage.createNotification({
        type: 'email',
        recipient: email,
        subject: template.subject,
        message: template.text,
      });

      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send orientation link:', error);
      throw error;
    }
  }

  async sendSelectionNotification(email: string, name: string, registrationCode: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const template = this.getSelectionTemplate(name, registrationCode);
      
      let fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      try {
        const settings = await storage.getEmailSettings();
        if (settings?.fromEmail) {
          fromEmail = settings.fromEmail;
        } else if (settings?.emailUser) {
          fromEmail = settings.emailUser;
        }
      } catch (error) {
        console.warn("Failed to get sender email from database:", error);
      }
      
      await storage.createNotification({
        type: 'email',
        recipient: email,
        subject: template.subject,
        message: template.text,
      });

      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send selection notification:', error);
      throw error;
    }
  }

  async sendOtpEmail(email: string, otp: string, subject: string, html: string, text: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      
      let fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      try {
        const settings = await storage.getEmailSettings();
        if (settings?.fromEmail) {
          fromEmail = settings.fromEmail;
        } else if (settings?.emailUser) {
          fromEmail = settings.emailUser;
        }
      } catch (error) {
        console.warn("Failed to get sender email from database:", error);
      }

      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject,
        html,
        text,
      });
      
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw error;
    }
  }

  async sendBulkEmails(emails: string[], subject: string, html: string, text: string): Promise<void> {
    const promises = emails.map(email =>
      this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@hackathonhub.com',
        to: email,
        subject,
        html,
        text,
      })
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      throw error;
    }
  }

  async sendCustomEmail(options: {
    to: string | string[];
    cc?: string | string[];
    subject: string;
    message: string;
    attachments?: any[];
  }): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      
      let fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      try {
        const settings = await storage.getEmailSettings();
        if (settings?.fromEmail) {
          fromEmail = settings.fromEmail;
        } else if (settings?.emailUser) {
          fromEmail = settings.emailUser;
        }
      } catch (error) {
        console.warn("Failed to get sender email from database:", error);
      }

      // Convert base64 attachments back to buffer if present
      const processedAttachments = options.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: attachment.buffer ? Buffer.from(attachment.buffer, 'base64') : attachment.content,
        contentType: attachment.mimetype || attachment.contentType
      }));

      await transporter.sendMail({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(',') : options.cc) : undefined,
        subject: options.subject,
        html: options.message || '',
        text: options.message ? options.message.replace(/<[^>]*>/g, '') : '', // Strip HTML for text version
        attachments: processedAttachments
      });
      
      console.log(`Custom email sent to ${options.to}`);
    } catch (error) {
      console.error("Failed to send custom email:", error);
      throw error;
    }
  }
}

export const emailService = new EmailService();

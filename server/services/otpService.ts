import { storage } from "../storage";
import { emailService } from "./emailService";

interface OtpData {
  identifier: string; // email or mobile
  purpose: 'login' | 'registration';
}

export class OtpService {
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isEmail(identifier: string): boolean {
    return identifier.includes('@');
  }

  async sendOtp(data: OtpData): Promise<{ success: boolean; message: string }> {
    try {
      // Generate OTP
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Log OTP in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Generated OTP for ${data.identifier}: ${otp}`);
      }

      // Clean up any existing OTPs for this identifier
      await storage.cleanupExpiredOtps();

      // Store OTP in database
      await storage.createOtpVerification({
        identifier: data.identifier,
        otp,
        purpose: data.purpose,
        expiresAt,
        verified: false,
        attempts: "0",
      });

      // Send OTP based on identifier type
      if (this.isEmail(data.identifier)) {
        await this.sendEmailOtp(data.identifier, otp, data.purpose);
        return {
          success: true,
          message: `OTP sent to your email: ${this.maskEmail(data.identifier)}`
        };
      } else {
        // For mobile numbers, we'll use email service as fallback
        // In production, you would integrate with SMS service like Twilio
        const applicant = await storage.getApplicantByEmailOrMobile(data.identifier);
        if (applicant?.email) {
          await this.sendEmailOtp(applicant.email, otp, data.purpose);
          return {
            success: true,
            message: `OTP sent to your registered email: ${this.maskEmail(applicant.email)}`
          };
        } else {
          return {
            success: false,
            message: "No email found for this mobile number. SMS service not configured."
          };
        }
      }
    } catch (error) {
      console.error("OTP send error:", error);
      return {
        success: false,
        message: "Failed to send OTP. Please try again."
      };
    }
  }

  async verifyOtp(identifier: string, otp: string, purpose: string): Promise<{ 
    success: boolean; 
    message: string; 
    applicant?: any;
    sessionToken?: string;
  }> {
    try {
      // Get OTP verification record
      const otpRecord = await storage.getOtpVerification(identifier, otp, purpose);
      
      if (!otpRecord) {
        return {
          success: false,
          message: "Invalid or expired OTP"
        };
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        return {
          success: false,
          message: "OTP has expired. Please request a new one."
        };
      }

      // Check attempts limit
      if (parseInt(otpRecord.attempts) >= 3) {
        return {
          success: false,
          message: "Too many attempts. Please request a new OTP."
        };
      }

      // Mark OTP as verified
      await storage.markOtpAsVerified(otpRecord.id);

      // Get applicant details
      const applicant = await storage.getApplicantByEmailOrMobile(identifier);
      if (!applicant || !applicant.id) {
        return {
          success: false,
          message: "Applicant not found. Please register first."
        };
      }

      // Create session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createApplicantSession({
        sessionToken,
        applicantId: applicant.id,
        expiresAt,
        lastActivity: new Date(),
      });

      return {
        success: true,
        message: "Login successful",
        applicant,
        sessionToken
      };

    } catch (error) {
      console.error("OTP verification error:", error);
      
      // Increment attempts if OTP record exists
      try {
        const otpRecord = await storage.getOtpVerification(identifier, otp, purpose);
        if (otpRecord) {
          await storage.incrementOtpAttempts(otpRecord.id);
        }
      } catch (incrementError) {
        console.error("Failed to increment OTP attempts:", incrementError);
      }

      return {
        success: false,
        message: "Verification failed. Please try again."
      };
    }
  }

  private async sendEmailOtp(email: string, otp: string, purpose: string) {
    const subject = purpose === 'login' ? 'Login OTP - HackathonHub' : 'Registration OTP - HackathonHub';
    
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">HackathonHub</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${purpose === 'login' ? 'Login' : 'Registration'} Verification</p>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 20px;">Your Verification Code</h2>
          
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #667eea;">
            <div style="background-color: #667eea; color: white; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px;">
              ${otp}
            </div>
            <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
              This code will expire in 10 minutes
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            Enter this code to ${purpose === 'login' ? 'access your account' : 'complete your registration'}. 
            If you didn't request this code, please ignore this email.
          </p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Security Note:</strong> Never share this code with anyone. HackathonHub staff will never ask for your OTP.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 16px; font-weight: 500;">Best regards,</p>
          <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">The HackathonHub Team</p>
        </div>
      </div>
    `;

    const text = `Your HackathonHub ${purpose} verification code is: ${otp}. This code will expire in 10 minutes. Never share this code with anyone.`;

    // Send email using email service
    await emailService.sendOtpEmail(email, otp, subject, html, text);
  }

  private generateSessionToken(): string {
    return `ast_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    const masked = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${masked}@${domain}`;
  }

  async validateSession(sessionToken: string): Promise<{ valid: boolean; applicant?: any }> {
    try {
      const session = await storage.getApplicantSession(sessionToken);
      if (!session) {
        return { valid: false };
      }

      // Update last activity
      await storage.updateApplicantSessionActivity(sessionToken);

      // Get applicant details
      const applicant = await storage.getApplicant(session.applicantId);
      return { valid: true, applicant };

    } catch (error) {
      console.error("Session validation error:", error);
      return { valid: false };
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      await storage.deleteApplicantSession(sessionToken);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

export const otpService = new OtpService();
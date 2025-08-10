import { Router } from 'express';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/auth';
import { sendEmail } from '../services/emailService';

const router = Router();

// Send notification emails
router.post('/send-notification', requireAdmin, async (req: any, res) => {
  try {
    const { applicantIds, subject, message, template } = req.body;
    
    if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
      return res.status(400).json({ message: "Applicant IDs are required" });
    }

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const results = [];
    
    for (const applicantId of applicantIds) {
      try {
        const applicant = await storage.getApplicantById(applicantId);
        if (!applicant) {
          results.push({ applicantId, status: 'failed', error: 'Applicant not found' });
          continue;
        }

        await sendEmail({
          to: applicant.email,
          subject,
          html: `
            <h2>${subject}</h2>
            <p>Dear ${applicant.name},</p>
            <div>${message}</div>
            <br>
            <p>Best regards,<br>CIEL Kings VibeAIthon Team</p>
          `
        });

        results.push({ applicantId, status: 'sent', email: applicant.email });
      } catch (error) {
        console.error(`Failed to send email to ${applicantId}:`, error);
        results.push({ applicantId, status: 'failed', error: (error as Error).message });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    res.json({
      message: `Emails sent: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: { sent: successCount, failed: failureCount }
    });
  } catch (error) {
    console.error("Email notification error:", error);
    res.status(500).json({ message: "Failed to send notifications" });
  }
});

// Send orientation emails
router.post('/send-orientation', requireAdmin, async (req: any, res) => {
  try {
    const { applicantIds } = req.body;
    
    if (!applicantIds || !Array.isArray(applicantIds)) {
      return res.status(400).json({ message: "Applicant IDs are required" });
    }

    const results = [];
    
    for (const applicantId of applicantIds) {
      try {
        const applicant = await storage.getApplicantById(applicantId);
        if (!applicant) {
          results.push({ applicantId, status: 'failed', error: 'Applicant not found' });
          continue;
        }

        await sendEmail({
          to: applicant.email,
          subject: "Orientation Details - CIEL Kings VibeAIthon",
          html: `
            <h2>Welcome to CIEL Kings VibeAIthon!</h2>
            <p>Dear ${applicant.name},</p>
            <p>Congratulations on your successful registration! Here are the orientation details:</p>
            <ul>
              <li><strong>Date:</strong> [To be announced]</li>
              <li><strong>Time:</strong> [To be announced]</li>
              <li><strong>Platform:</strong> [To be announced]</li>
            </ul>
            <p>Please mark your calendar and stay tuned for more updates.</p>
            <p>Best regards,<br>CIEL Kings VibeAIthon Team</p>
          `
        });

        results.push({ applicantId, status: 'sent', email: applicant.email });
      } catch (error) {
        console.error(`Failed to send orientation email to ${applicantId}:`, error);
        results.push({ applicantId, status: 'failed', error: (error as Error).message });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    
    res.json({
      message: `Orientation emails sent to ${successCount} applicants`,
      results
    });
  } catch (error) {
    console.error("Orientation email error:", error);
    res.status(500).json({ message: "Failed to send orientation emails" });
  }
});

export { router as emailRoutes };
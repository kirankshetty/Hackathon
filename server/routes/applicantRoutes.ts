import { Router } from 'express';
import { storage } from '../storage';
import { enhancedAuth } from '../middleware/auth';
import { sendEmail } from '../services/emailService';
import { generateOTP } from '../utils/otpUtils';
import multer from 'multer';
import { insertApplicantSchema } from '../../shared/schema';

const router = Router();
const upload = multer({ dest: 'tmp/' });

// Public registration
router.post('/register', async (req, res) => {
  try {
    const validatedData = insertApplicantSchema.parse(req.body);
    const applicant = await storage.createApplicant(validatedData);
    
    // Send confirmation email
    try {
      await sendEmail({
        to: applicant.email,
        subject: "Registration Successful - CIEL Kings VibeAIthon",
        html: `
          <h2>Welcome to CIEL Kings VibeAIthon!</h2>
          <p>Dear ${applicant.name},</p>
          <p>Your registration has been successfully completed.</p>
          <p><strong>Registration ID:</strong> ${applicant.registrationId}</p>
          <p>You can access your applicant portal using your email/mobile and OTP.</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send registration email:", emailError);
    }

    res.status(201).json({ 
      applicant: {
        id: applicant.id,
        registrationId: applicant.registrationId,
        name: applicant.name,
        email: applicant.email
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// OTP login
router.post('/otp/send', async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ message: "Email or mobile number required" });
    }

    const applicant = await storage.getApplicantByEmailOrMobile(identifier);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const otp = generateOTP();
    await storage.saveOTP(applicant.id, otp);

    // Send OTP via email
    await sendEmail({
      to: applicant.email,
      subject: "Your OTP - CIEL Kings VibeAIthon",
      html: `
        <h2>Your OTP Code</h2>
        <p>Dear ${applicant.name},</p>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code is valid for 10 minutes.</p>
      `
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// OTP verification
router.post('/otp/verify', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    
    const applicant = await storage.getApplicantByEmailOrMobile(identifier);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const isValidOTP = await storage.verifyOTP(applicant.id, otp);
    if (!isValidOTP) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    // Create applicant session
    const sessionToken = await storage.createApplicantSession(applicant.id);
    
    res.json({ 
      sessionToken,
      applicant: {
        id: applicant.id,
        registrationId: applicant.registrationId,
        name: applicant.name,
        email: applicant.email,
        mobile: applicant.mobile,
        status: applicant.status
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

// Admin routes for applicant management
router.get('/', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'jury')) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const applicants = await storage.getApplicants({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      status: status as string
    });

    res.json(applicants);
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
});

router.post('/', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const validatedData = insertApplicantSchema.parse(req.body);
    const applicant = await storage.createApplicant(validatedData);
    
    res.status(201).json(applicant);
  } catch (error) {
    console.error("Error creating applicant:", error);
    res.status(500).json({ message: "Failed to create applicant" });
  }
});

router.put('/:id', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const updates = req.body;
    
    const updatedApplicant = await storage.updateApplicant(id, updates);
    res.json(updatedApplicant);
  } catch (error) {
    console.error("Error updating applicant:", error);
    res.status(500).json({ message: "Failed to update applicant" });
  }
});

router.delete('/:id', enhancedAuth, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    await storage.deleteApplicant(id);
    
    res.json({ message: "Applicant deleted successfully" });
  } catch (error) {
    console.error("Error deleting applicant:", error);
    res.status(500).json({ message: "Failed to delete applicant" });
  }
});

// Bulk upload
router.post('/bulk-upload', enhancedAuth, upload.single('file'), async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await storage.processBulkApplicantUpload(req.file.path);
    res.json(result);
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Bulk upload failed" });
  }
});

export { router as applicantRoutes };
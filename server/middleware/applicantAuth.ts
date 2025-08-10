import { RequestHandler } from 'express';
import { storage } from '../storage';

// Applicant authentication middleware for OTP-based sessions
export const applicantAuth: RequestHandler = async (req: any, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!sessionToken) {
      return res.status(401).json({ message: "Session token required" });
    }

    const session = await storage.getApplicantSession(sessionToken);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    const applicant = await storage.getApplicantById(session.applicantId);
    if (!applicant) {
      return res.status(401).json({ message: "Applicant not found" });
    }

    // Attach applicant to request
    req.applicant = applicant;
    req.sessionToken = sessionToken;

    next();
  } catch (error) {
    console.error("Applicant authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
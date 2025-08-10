import type { Express } from "express";
import { createServer, type Server } from "http";
import { createReadStream } from "fs";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as XLSX from 'xlsx';
import multer from 'multer';
import { insertApplicantSchema, insertSubmissionSchema, insertEventSettingsSchema } from "@shared/schema";
import { emailService } from "./services/emailService";
import { otpService } from "./services/otpService";
import { randomUUID } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { CCAvenueService } from './services/ccavenueService';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  },
});

// Applicant authentication middleware
const authenticateApplicant = async (req: any, res: any, next: any) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionToken) {
      return res.status(401).json({ message: "No session token provided" });
    }

    const sessionResult = await otpService.validateSession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    req.applicant = sessionResult.applicant;
    next();
  } catch (error) {
    console.error("Applicant authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up local authentication strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.password) {
            return done(null, false, { message: "Invalid credentials" });
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid credentials" });
          }

          // Only allow admin and jury users to login via local auth
          if (!user.role || !['admin', 'jury'].includes(user.role)) {
            return done(null, false, { message: "Access denied" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Auth middleware
  await setupAuth(app);

  // Enhanced authentication middleware for mixed auth
  const enhancedAuth = async (req: any, res: any, next: any) => {
    // Check for local authentication first
    if (req.user && !req.user.claims) {
      // Local auth - user object has id and role directly
      return next();
    }
    
    // Fall back to OAuth authentication
    return isAuthenticated(req, res, next);
  };

  // Helper function to get user from either auth method
  const getAuthenticatedUser = async (req: any) => {
    if (req.user && !req.user.claims) {
      // Local authentication - user object is stored directly
      return req.user;
    }
    
    if (req.user?.claims) {
      // OAuth authentication - fetch user by ID
      return await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
    }
    
    return null;
  };

  // Local authentication routes
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post('/api/auth/login', (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        res.json({ message: "Login successful", user });
      });
    })(req, res, next);
  });

  // Modified auth user route to handle both OAuth and local auth
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is authenticated via local auth
      if (req.user && !req.user.claims) {
        // Local authentication - user object is stored directly
        return res.json(req.user);
      }
      
      // OAuth authentication - user has claims
      if (req.user?.claims) {
        const userId = req.user.claims ? req.user.claims.sub : req.user.id;
        const user = await storage.getUser(userId);
        return res.json(user);
      }

      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public registration route (no auth required)
  app.post('/api/register', async (req, res) => {
    try {
      console.log("Registration request body:", req.body);
      
      // Manual validation for debugging
      const requiredFields = ['name', 'email', 'mobile', 'studentId', 'course', 'yearOfGraduation', 'collegeName'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        console.log("Missing fields:", missingFields);
        return res.status(400).json({ 
          message: "Missing required fields", 
          missingFields 
        });
      }
      
      const validatedData = insertApplicantSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getApplicantByEmail(validatedData.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const applicant = await storage.createApplicant(validatedData);
      
      // Send registration confirmation email (safely)
      try {
        await emailService.sendRegistrationConfirmation(
          applicant.email,
          applicant.name,
          applicant.registrationId
        );
      } catch (emailError) {
        console.log("Email sending failed (non-blocking):", emailError);
      }

      res.json({ 
        message: "Registration successful", 
        registrationId: applicant.registrationId 
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          details: error.errors 
        });
      }
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Public participation confirmation route
  app.post('/api/confirm-participation', async (req, res) => {
    try {
      const { code } = req.body;
      
      const applicant = await storage.getApplicantByRegistrationId(code);
      if (!applicant || applicant.status !== 'selected') {
        return res.status(404).json({ message: "Invalid confirmation code" });
      }

      await storage.updateApplicant(applicant.id, {
        status: 'confirmed',
        confirmedAt: new Date(),
      });

      res.json({ message: "Participation confirmed successfully" });
    } catch (error) {
      console.error("Confirmation error:", error);
      res.status(500).json({ message: "Confirmation failed" });
    }
  });

  // Create test admin user on startup
  const createTestAdmin = async () => {
    try {
      const existingAdmin = await storage.getUserByEmail('admin@test.com');
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await storage.createUser({
          email: 'admin@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'Admin',
          role: 'admin'
        });
        console.log('Test admin user created: admin@test.com / admin123');
      }
    } catch (error) {
      console.error('Error creating test admin:', error);
    }
  };
  await createTestAdmin();
  
  // Initialize competition data if missing
  const initializeData = async () => {
    try {
      await storage.restoreCompetitionData();
      console.log("Competition data initialization complete");
    } catch (error) {
      console.error("Competition data initialization failed:", error);
    }
  };
  await initializeData();

  // Debug route to check applicant count
  app.get('/api/debug/applicants-count', async (req, res) => {
    try {
      const count = await storage.getApplicantsCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin route to clear all applicant data
  app.delete('/api/admin/clear-applicants', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.clearAllApplicantData();
      res.json({ message: "All applicant data cleared successfully" });
    } catch (error) {
      console.error("Clear applicants error:", error);
      res.status(500).json({ message: "Failed to clear applicant data" });
    }
  });

  // Admin route to delete specific applicants by email
  app.delete('/api/admin/delete-applicant-emails', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { emails } = req.body;
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ message: "Emails array is required" });
      }

      const deletedCount = await storage.deleteApplicantsByEmails(emails);
      res.json({ message: `Successfully deleted ${deletedCount} applicant records`, deletedCount });
    } catch (error) {
      console.error("Delete applicants by email error:", error);
      res.status(500).json({ message: "Failed to delete applicant records" });
    }
  });

  // Admin route to restore competition rounds and settings
  app.post('/api/admin/restore-data', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.restoreCompetitionData();
      res.json({ message: "Competition rounds and settings restored successfully" });
    } catch (error) {
      console.error("Restore data error:", error);
      res.status(500).json({ message: "Failed to restore competition data" });
    }
  });

  // Admin route to export applicants data with filters
  app.post('/api/admin/export-applicants', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { fromDateTime, toDateTime, collegeName, status, registrationCode } = req.body;

      // Build filters object
      const filters: any = {};
      if (fromDateTime) filters.fromDateTime = new Date(fromDateTime);
      if (toDateTime) filters.toDateTime = new Date(toDateTime);
      if (collegeName) filters.collegeName = collegeName;
      if (status) filters.status = status;
      if (registrationCode) filters.registrationCode = registrationCode;

      const applicants = await storage.getApplicantsForExport(filters);

      // Convert applicants data to CSV
      const headers = [
        'Registration ID',
        'Name', 
        'Email',
        'Mobile',
        'College',
        'Course',
        'Year',
        'LinkedIn Profile',
        'Status',
        'Registration Date',
        'GitHub Repository',
        'Confirmation Token'
      ];

      const csvRows = [headers.join(',')];
      
      applicants.forEach((applicant: any) => {
        const row = [
          applicant.registrationId || '',
          `"${applicant.name || ''}"`,
          applicant.email || '',
          applicant.mobile || '',
          `"${applicant.college || ''}"`,
          `"${applicant.course || ''}"`,
          applicant.year || '',
          applicant.linkedinProfile || '',
          applicant.status || '',
          applicant.createdAt ? new Date(applicant.createdAt).toISOString() : '',
          applicant.githubRepo || '',
          applicant.confirmationToken || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const filename = `applicants_export_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);

    } catch (error) {
      console.error("Export applicants error:", error);
      res.status(500).json({ message: "Failed to export applicants data" });
    }
  });

  // Admin route to export competition round details
  app.post('/api/admin/export-rounds', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { filters, metrics } = req.body;
      
      // Get competition round data based on filters and metrics
      const roundData = await storage.getCompetitionRoundData(filters, metrics);
      
      // Convert to Excel format using xlsx
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet data
      const worksheetData = [];
      
      // Add headers based on selected metrics
      const headers = ['Stage Name', 'Date Range'];
      if (metrics.totalParticipants) headers.push('Total Participants');
      if (metrics.totalColleges) headers.push('Total Colleges');
      if (metrics.ideasSubmitted) headers.push('Ideas Submitted');
      if (metrics.prototypesApproved) headers.push('Prototypes Approved');
      if (metrics.projectsApproved) headers.push('Projects Approved');
      if (metrics.totalInvitees) headers.push('Total Invitees');
      if (metrics.solutionsToBeBuilt) headers.push('Solutions to be Built');
      
      worksheetData.push(headers);
      
      // Add data rows
      for (const stage of roundData.stages) {
        const row = [stage.name, stage.dateRange];
        if (metrics.totalParticipants) row.push(stage.totalParticipants || 0);
        if (metrics.totalColleges) row.push(stage.totalColleges || 0);
        if (metrics.ideasSubmitted) row.push(stage.ideasSubmitted || 0);
        if (metrics.prototypesApproved) row.push(stage.prototypesApproved || 0);
        if (metrics.projectsApproved) row.push(stage.projectsApproved || 0);
        if (metrics.totalInvitees) row.push(stage.totalInvitees || 0);
        if (metrics.solutionsToBeBuilt) row.push(stage.solutionsToBeBuilt || 0);
        worksheetData.push(row);
      }
      
      // Create worksheet and add to workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Competition Rounds');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers
      const filename = `rounds_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("Round export error:", error);
      res.status(500).json({ message: "Round export failed" });
    }
  });

  // Bulk operations routes
  app.get('/api/applicants/bulk-template', enhancedAuth, async (req: any, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Create Excel template with headers
      const workbook = XLSX.utils.book_new();
      const templateData = [
        ['Email', 'Name', 'Registration ID', 'Selection Status', 'Notes'],
        ['example@email.com', 'John Doe', 'REG001', 'selected', 'Sample entry']
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Update Template');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="bulk_update_template.xlsx"');
      res.send(excelBuffer);
    } catch (error) {
      console.error("Template download error:", error);
      res.status(500).json({ message: "Failed to download template" });
    }
  });

  app.post('/api/applicants/bulk-update-selection', enhancedAuth, async (req: any, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Handle file upload and processing would go here
      // For now, return success message
      res.json({ message: "Bulk update functionality will be implemented" });
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).json({ message: "Failed to perform bulk update" });
    }
  });

  // Recent activity endpoint
  app.get('/api/recent-activity', enhancedAuth, async (req: any, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user || !['admin', 'jury'].includes(user.role)) {
        return res.status(403).json({ message: "Admin or jury access required" });
      }

      const activity = await storage.getRecentActivity(10); // Get last 10 activities
      res.json(activity);
    } catch (error) {
      console.error("Recent activity error:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Protected admin routes
  app.get('/api/dashboard/stats', enhancedAuth, async (req: any, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/applicants', enhancedAuth, async (req: any, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user || !['admin', 'jury'].includes(user.role || '')) {
        return res.status(403).json({ message: "Admin or jury access required" });
      }

      const { status, search, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const [applicants, total] = await Promise.all([
        storage.getApplicants({
          status: status as string,
          search: search as string,
          limit: parseInt(limit),
          offset,
        }),
        storage.getApplicantsCount({
          status: status as string,
          search: search as string,
        }),
      ]);

      res.json({
        applicants,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      });
    } catch (error) {
      console.error("Applicants fetch error:", error);
      res.status(500).json({ message: "Failed to fetch applicants" });
    }
  });

  app.put('/api/applicants/:id', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const updates = req.body;

      const applicant = await storage.updateApplicant(id, updates);
      res.json(applicant);
    } catch (error) {
      console.error("Applicant update error:", error);
      res.status(500).json({ message: "Failed to update applicant" });
    }
  });

  app.post('/api/applicants', enhancedAuth, async (req: any, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Map frontend fields to backend schema
      const frontendData = req.body;
      const backendData = {
        name: frontendData.name,
        email: frontendData.email,
        mobile: frontendData.mobile,
        studentId: frontendData.studentId,
        course: frontendData.course,
        yearOfGraduation: frontendData.year, // Map 'year' to 'yearOfGraduation'
        collegeName: frontendData.college, // Map 'college' to 'collegeName'
        linkedinProfile: frontendData.linkedinProfile
      };

      // Check if email already exists
      const existing = await storage.getApplicantByEmail(backendData.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const applicant = await storage.createApplicant(backendData);
      res.json({ 
        message: "Applicant added successfully", 
        applicant 
      });
    } catch (error: any) {
      console.error("Applicant creation error:", error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to add applicant" });
    }
  });

  app.delete('/api/applicants/:id', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      
      // Check if applicant exists
      const applicant = await storage.getApplicantById(id);
      if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
      }

      await storage.deleteApplicant(id);
      res.json({ message: "Applicant deleted successfully" });
    } catch (error) {
      console.error("Applicant delete error:", error);
      res.status(500).json({ message: "Failed to delete applicant" });
    }
  });

  app.post('/api/applicants/:id/select', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'jury') {
        return res.status(403).json({ message: "Jury access required" });
      }

      const { id } = req.params;
      const registrationCode = randomUUID();

      const applicant = await storage.updateApplicant(id, {
        status: 'selected',
        selectedBy: user.id,
        selectedAt: new Date(),
        confirmationToken: registrationCode,
      });

      // Send selection notification
      await emailService.sendSelectionNotification(
        applicant.email,
        applicant.name,
        registrationCode
      );

      res.json({ message: "Applicant selected successfully" });
    } catch (error) {
      console.error("Selection error:", error);
      res.status(500).json({ message: "Failed to select applicant" });
    }
  });

  // Applicant profile route
  app.get('/api/applicant/profile', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find applicant by user's email
      const applicant = await storage.getApplicantByEmail(user.email || '');
      if (!applicant) {
        return res.status(404).json({ message: "Applicant profile not found" });
      }

      res.json(applicant);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // GitHub submission routes
  app.post('/api/submissions', enhancedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find applicant by user's email
      const applicant = await storage.getApplicantByEmail(user.email || '');
      if (!applicant) {
        return res.status(404).json({ message: "Applicant profile not found" });
      }

      // Check if submission is enabled and within deadline
      const settings = await storage.getEventSettings();
      if (!settings?.submissionEnabled) {
        return res.status(400).json({ message: "Submissions are not currently enabled" });
      }

      if (settings.submissionDeadline && new Date() > settings.submissionDeadline) {
        return res.status(400).json({ message: "Submission deadline has passed" });
      }

      const { githubUrl } = req.body;
      const validatedData = insertSubmissionSchema.parse({
        applicantId: applicant.id,
        githubUrl,
      });

      const submission = await storage.createSubmission(validatedData);
      
      // Update applicant status and GitHub URL
      await storage.updateApplicant(applicant.id, {
        status: 'submitted',
        githubUrl,
      });

      res.json(submission);
    } catch (error) {
      console.error("Submission error:", error);
      res.status(400).json({ message: "Failed to submit GitHub URL" });
    }
  });

  app.get('/api/submissions/:applicantId', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || !['admin', 'jury'].includes(user.role || '')) {
        return res.status(403).json({ message: "Admin or jury access required" });
      }

      const { applicantId } = req.params;
      const submissions = await storage.getSubmissionsByApplicant(applicantId);
      res.json(submissions);
    } catch (error) {
      console.error("Submissions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Event settings routes
  app.get('/api/settings', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getEventSettings();
      res.json(settings);
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertEventSettingsSchema.parse(req.body);
      const settings = await storage.updateEventSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  // Orientation management
  app.post('/api/send-orientation', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { meetingLink, applicantIds } = req.body;
      
      let applicants;
      if (applicantIds && applicantIds.length > 0) {
        // Send to specific applicants
        applicants = await Promise.all(
          applicantIds.map((id: string) => storage.getApplicant(id))
        );
        applicants = applicants.filter(Boolean);
      } else {
        // Send to all registered applicants
        applicants = await storage.getApplicants({ status: 'registered' });
      }

      // Send orientation emails
      const emailPromises = applicants.map(applicant =>
        emailService.sendOrientationLink(applicant.email, applicant.name, meetingLink)
      );

      await Promise.all(emailPromises);

      // Update applicant status
      const updatePromises = applicants.map(applicant =>
        storage.updateApplicant(applicant.id, {
          status: 'orientation_sent',
          orientationLink: meetingLink,
          orientationSent: true,
        })
      );

      await Promise.all(updatePromises);

      res.json({ message: `Orientation sent to ${applicants.length} applicants` });
    } catch (error) {
      console.error("Orientation send error:", error);
      res.status(500).json({ message: "Failed to send orientation" });
    }
  });

  // Enable submissions
  app.post('/api/enable-submissions', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { deadline } = req.body;
      
      await storage.updateEventSettings({
        submissionEnabled: true,
        submissionDeadline: new Date(deadline),
      });

      // Update all qualified applicants to enable submissions
      const applicants = await storage.getApplicants({ 
        status: 'orientation_sent' 
      });

      const updatePromises = applicants.map(applicant =>
        storage.updateApplicant(applicant.id, {
          status: 'submission_enabled',
          submissionEnabled: true,
          submissionDeadline: new Date(deadline),
        })
      );

      await Promise.all(updatePromises);

      res.json({ message: "Submissions enabled successfully" });
    } catch (error) {
      console.error("Enable submissions error:", error);
      res.status(500).json({ message: "Failed to enable submissions" });
    }
  });

  // Jury Management Routes
  app.get("/api/jury", enhancedAuth, async (req, res) => {
    try {
      const juryMembers = await storage.getJuryMembers();
      res.json({ juryMembers });
    } catch (error) {
      console.error("Error fetching jury members:", error);
      res.status(500).json({ message: "Failed to fetch jury members" });
    }
  });

  app.post("/api/jury", enhancedAuth, async (req, res) => {
    try {
      const member = await storage.createJuryMember(req.body);
      res.json(member);
    } catch (error) {
      console.error("Error creating jury member:", error);
      res.status(500).json({ message: "Failed to create jury member" });
    }
  });

  // Project Submissions Routes
  app.get("/api/project-submissions", enhancedAuth, async (req, res) => {
    try {
      const submissions = await storage.getProjectSubmissions();
      res.json({ submissions });
    } catch (error) {
      console.error("Error fetching project submissions:", error);
      res.status(500).json({ message: "Failed to fetch project submissions" });
    }
  });

  app.post("/api/project-submissions", enhancedAuth, async (req, res) => {
    try {
      const submission = await storage.createProjectSubmission(req.body);
      res.json(submission);
    } catch (error) {
      console.error("Error creating project submission:", error);
      res.status(500).json({ message: "Failed to create project submission" });
    }
  });

  // Orientation Sessions Routes
  app.get("/api/orientation", enhancedAuth, async (req, res) => {
    try {
      const sessions = await storage.getOrientationSessions();
      res.json({ sessions });
    } catch (error) {
      console.error("Error fetching orientation sessions:", error);
      res.status(500).json({ message: "Failed to fetch orientation sessions" });
    }
  });

  app.post("/api/orientation", enhancedAuth, async (req, res) => {
    try {
      const session = await storage.createOrientationSession(req.body);
      res.json(session);
    } catch (error) {
      console.error("Error creating orientation session:", error);
      res.status(500).json({ message: "Failed to create orientation session" });
    }
  });

  // Applicant Selection Template and Upload Routes
  app.get("/api/applicant-selection/template", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Create template data
      const templateData = [
        {
          'ApplicantID': 'SAMPLE_001',
          'RegistrationID': 'REG12345',
          'Current Stage': 'Stage 1',
          'Status': 'Selected',
          'Next Stage': 'Stage 2'
        },
        {
          'ApplicantID': 'SAMPLE_002', 
          'RegistrationID': 'REG12346',
          'Current Stage': 'Stage 1',
          'Status': 'Not Selected',
          'Next Stage': ''
        }
      ];

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicant Selection');

      // Set column widths
      worksheet['!cols'] = [
        { width: 15 }, // ApplicantID
        { width: 15 }, // RegistrationID  
        { width: 15 }, // Current Stage
        { width: 15 }, // Status
        { width: 15 }  // Next Stage
      ];

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="applicant-selection-template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Upload applicant selection data
  app.post("/api/applicant-selection/upload", enhancedAuth, upload.single('file'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let updatedCount = 0;
      const errors: string[] = [];

      // Validate and process each row
      for (const [index, row] of (data as any[]).entries()) {
        const rowNumber = index + 2; // Excel row number (starting from 2)
        
        try {
          const applicantId = row['ApplicantID'];
          const registrationId = row['RegistrationID'];
          const currentStage = row['Current Stage'];
          const status = row['Status'];
          const nextStage = row['Next Stage'];

          // Validate required fields
          if (!applicantId && !registrationId) {
            errors.push(`Row ${rowNumber}: Either ApplicantID or RegistrationID is required`);
            continue;
          }

          if (!status) {
            errors.push(`Row ${rowNumber}: Status is required`);
            continue;
          }

          // Validate status values
          if (!['Selected', 'Not Selected', 'selected', 'not selected'].includes(status)) {
            errors.push(`Row ${rowNumber}: Status must be 'Selected' or 'Not Selected'`);
            continue;
          }

          // Find applicant by ID or registration ID
          let applicant;
          if (applicantId) {
            try {
              applicant = await storage.getApplicantById(applicantId);
            } catch (error) {
              // Applicant not found by ID, try registration ID
            }
          }
          
          if (!applicant && registrationId) {
            const applicants = await storage.getApplicants();
            applicant = applicants.find(a => a.registrationId === registrationId);
          }

          if (!applicant) {
            errors.push(`Row ${rowNumber}: Applicant not found with ID '${applicantId || registrationId}'`);
            continue;
          }

          // Update applicant status and stage
          const normalizedStatus = status.toLowerCase() === 'selected' ? 'selected' : 'registered';
          const updateData: any = {
            status: normalizedStatus
          };

          // Set current stage if provided
          if (currentStage) {
            updateData.currentStage = currentStage;
          }

          // Set next stage if selected and next stage provided
          if (normalizedStatus === 'selected' && nextStage) {
            updateData.nextStage = nextStage;
          }

          await storage.updateApplicant(applicant.id, updateData);
          updatedCount++;

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error);
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Return results
      const response: any = { 
        message: "Applicant selection update completed",
        updated: updatedCount
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message += ` with ${errors.length} errors`;
      }

      res.json(response);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Stage Details Template and Upload Routes
  app.get("/api/stage-details/template", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Create template data
      const templateData = [
        {
          'Stage Name': 'Example Stage 1 - Ideas Submission',
          'Total Participants': 100,
          'Total Colleges': 25,
          'Ideas Submitted': 85,
          'Prototypes Approved': 0,
          'Projects Approved': 0,
          'Total Invitees': 0,
          'Solutions to be Built': 0
        },
        {
          'Stage Name': 'Example Stage 2 - Prototype Selection',
          'Total Participants': 85,
          'Total Colleges': 22,
          'Ideas Submitted': 0,
          'Prototypes Approved': 60,
          'Projects Approved': 0,
          'Total Invitees': 0,
          'Solutions to be Built': 0
        }
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, "Stage Details");

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="stage-details-template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Template download error:", error);
      res.status(500).json({ message: "Failed to download template" });
    }
  });

  app.post("/api/stage-details/upload", enhancedAuth, upload.single('file'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Validate and process each row
      for (const row of data as any[]) {
        const stageName = row['Stage Name'];
        if (!stageName) continue;

        // Find existing round by name (case insensitive)
        const rounds = await storage.getCompetitionRounds();
        const existingRound = rounds.find(r => 
          r.name.toLowerCase().includes(stageName.toLowerCase()) ||
          stageName.toLowerCase().includes(r.name.toLowerCase())
        );

        if (existingRound) {
          // Update existing round with uploaded data
          await storage.updateCompetitionRound(existingRound.id, {
            currentParticipants: String(row['Total Participants'] || 0),
            totalColleges: String(row['Total Colleges'] || 0),
            ideasSubmitted: String(row['Ideas Submitted'] || 0),
            prototypesApproved: String(row['Prototypes Approved'] || 0),
            projectsApproved: String(row['Projects Approved'] || 0),
            totalInvitees: String(row['Total Invitees'] || 0),
            solutionsToBeBuilt: String(row['Solutions to be Built'] || 0),
          });
        }
      }

      res.json({ message: "Stage details updated successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Competition Rounds Routes
  app.get("/api/rounds", enhancedAuth, async (req: any, res) => {
    try {
      // Handle both local and OAuth authentication
      const userId = req.user.claims ? req.user.claims ? req.user.claims.sub : req.user.id : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || !['admin', 'jury'].includes(user.role || '')) {
        return res.status(403).json({ message: "Admin or jury access required" });
      }

      const rounds = await storage.getCompetitionRounds();
      res.json({ rounds });
    } catch (error) {
      console.error("Error fetching competition rounds:", error);
      res.status(500).json({ message: "Failed to fetch competition rounds" });
    }
  });

  // Stage Statistics Routes
  app.get("/api/stage-stats", enhancedAuth, async (req: any, res) => {
    try {
      // Handle both local and OAuth authentication
      const userId = req.user.claims ? req.user.claims ? req.user.claims.sub : req.user.id : req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const rounds = await storage.getCompetitionRounds();
      const stages = [];

      for (const round of rounds) {
        // Get submission count for this stage
        const submissions = await storage.getStageSubmissionsCount(round.id);
        
        // Get selection count (applicants who are selected/confirmed/submitted after this stage)
        const applicants = await storage.getApplicants();
        const selections = applicants.filter(applicant => 
          ['selected', 'confirmed', 'submitted'].includes(applicant.status) &&
          applicant.currentStage === round.name
        ).length;

        stages.push({
          stageId: round.id,
          stageName: round.name,
          submissions: submissions || 0,
          selections: selections || 0
        });
      }

      res.json({ stages });
    } catch (error) {
      console.error("Error fetching stage statistics:", error);
      res.status(500).json({ message: "Failed to fetch stage statistics" });
    }
  });

  app.post("/api/rounds", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log("Creating round with data:", req.body);
      const round = await storage.createCompetitionRound(req.body);
      res.json(round);
    } catch (error) {
      console.error("Error creating competition round:", error);
      res.status(500).json({ message: "Failed to create competition round" });
    }
  });

  app.put("/api/rounds/:id", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const roundId = req.params.id;
      
      // Handle date conversion properly
      const updateData = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : null,
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
      };

      console.log("Updating round with data:", updateData);
      const round = await storage.updateCompetitionRound(roundId, updateData);
      if (!round) {
        return res.status(404).json({ message: "Competition round not found" });
      }
      res.json(round);
    } catch (error) {
      console.error("Error updating competition round:", error);
      res.status(500).json({ message: "Failed to update competition round" });
    }
  });

  app.delete("/api/rounds/:id", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const roundId = req.params.id;
      
      // Check if the round exists first
      const rounds = await storage.getCompetitionRounds();
      const roundExists = rounds.some(round => round.id === roundId);
      
      if (!roundExists) {
        return res.status(404).json({ message: "Competition round not found" });
      }
      
      await storage.deleteCompetitionRound(roundId);
      res.json({ message: "Competition round deleted successfully" });
    } catch (error) {
      console.error("Error deleting competition round:", error);
      res.status(500).json({ message: "Failed to delete competition round" });
    }
  });

  // Email settings routes
  app.get("/api/admin/email-settings", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getEmailSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Get email settings error:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.post("/api/admin/email-settings", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.updateEmailSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update email settings error:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.post("/api/admin/test-email", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getEmailSettings();
      if (!settings?.enableEmails) {
        return res.status(400).json({ message: "Email service is disabled" });
      }

      if (!settings.emailHost || !settings.emailUser || !settings.emailPass) {
        return res.status(400).json({ message: "Email configuration is incomplete" });
      }

      // Test with current settings by sending a test email to the admin user
      await emailService.sendRegistrationConfirmation(settings.emailUser, "Admin Test", "TEST123");
      res.json({ message: "Test email sent successfully to " + settings.emailUser });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: `Email test failed: ${(error as Error).message}` });
    }
  });

  // ============= APPLICANT OTP AUTHENTICATION ROUTES =============
  
  // Send OTP for login
  app.post("/api/applicant/send-otp", async (req, res) => {
    try {
      const { identifier } = req.body; // email or mobile
      
      if (!identifier) {
        return res.status(400).json({ message: "Email or mobile number is required" });
      }

      // Check if applicant exists
      const applicant = await storage.getApplicantByEmailOrMobile(identifier);
      if (!applicant) {
        return res.status(404).json({ message: "Applicant not found. Please register first." });
      }

      const result = await otpService.sendOtp({ identifier, purpose: 'login' });
      res.json(result);
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and login
  app.post("/api/applicant/verify-otp", async (req, res) => {
    try {
      const { identifier, otp } = req.body;
      
      if (!identifier || !otp) {
        return res.status(400).json({ message: "Email/mobile and OTP are required" });
      }

      const result = await otpService.verifyOtp(identifier, otp, 'login');
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          sessionToken: result.sessionToken,
          applicant: result.applicant
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Logout applicant
  app.post("/api/applicant/logout", authenticateApplicant, async (req: any, res) => {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      await otpService.logout(sessionToken);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // ============= APPLICANT PORTAL ROUTES =============
  
  // Get applicant dashboard data
  app.get("/api/applicant/dashboard", authenticateApplicant, async (req: any, res) => {
    try {
      const applicant = req.applicant;
      
      // Get application progress
      const progress = await storage.getApplicationProgress(applicant.id);
      
      // Get competition rounds based on applicant's status and progression
      const rounds = await storage.getCompetitionRounds();
      const now = new Date();
      
      // Get applicant's stage submissions to determine which stages they've completed
      const submissions = await storage.getStageSubmissions(applicant.id);
      const submittedStageIds = new Set(submissions.map(s => s.stageId));
      
      let availableRounds = [];
      
      // Find the first active round (available to all applicants regardless of status)
      const firstActiveRound = rounds.find(round => 
        round.status === 'active' && 
        (!round.endTime || new Date(round.endTime) > now) &&
        (!round.startTime || new Date(round.startTime) <= now)
      );
      
      if (firstActiveRound) {
        availableRounds.push(firstActiveRound);
      }
      
      // For applicants with 'selected', 'confirmed', or 'submitted' status, show additional rounds
      if (['selected', 'confirmed', 'submitted'].includes(applicant.status)) {
        const subsequentRounds = rounds.filter(round => {
          const isActive = round.status === 'active';
          const notExpired = !round.endTime || new Date(round.endTime) > now;
          const hasStarted = !round.startTime || new Date(round.startTime) <= now;
          const isNotFirstRound = round.id !== firstActiveRound?.id;
          
          return isActive && notExpired && hasStarted && isNotFirstRound;
        });
        
        availableRounds.push(...subsequentRounds);
      }
      
      // Remove duplicates and sort by start time or creation order
      const activeRounds = availableRounds.filter((round, index, self) => 
        index === self.findIndex(r => r.id === round.id)
      ).sort((a, b) => {
        if (a.startTime && b.startTime) {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Found ${activeRounds.length} active rounds for applicant ${applicant.id} (status: ${applicant.status}):`, 
        activeRounds.map(r => ({ id: r.id, name: r.name, status: r.status })));
      
      res.json({
        applicant,
        progress,
        activeRounds,
        submissions,
        currentStatus: applicant.status,
        requiresConfirmation: applicant.status === 'selected' && !applicant.confirmedAt
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  });

  // Confirm participation
  app.post("/api/applicant/confirm-participation", authenticateApplicant, async (req: any, res) => {
    try {
      const applicant = req.applicant;
      
      if (applicant.status !== 'selected') {
        return res.status(400).json({ message: "Participation confirmation not available at this stage" });
      }

      if (applicant.confirmedAt) {
        return res.status(400).json({ message: "Participation already confirmed" });
      }

      // Update applicant status
      await storage.updateApplicant(applicant.id, {
        status: 'confirmed',
        confirmedAt: new Date()
      });

      // Create progress entry
      await storage.createApplicationProgress({
        applicantId: applicant.id,
        stage: 'confirmed',
        status: 'completed',
        description: 'Participation confirmed by applicant',
        completedAt: new Date()
      });

      res.json({ message: "Participation confirmed successfully" });
    } catch (error) {
      console.error("Confirm participation error:", error);
      res.status(500).json({ message: "Failed to confirm participation" });
    }
  });

  // Get competition rounds for applicants
  app.get("/api/applicant/rounds", authenticateApplicant, async (req: any, res) => {
    try {
      const rounds = await storage.getCompetitionRounds();
      res.json({ rounds });
    } catch (error) {
      console.error("Get rounds error:", error);
      res.status(500).json({ message: "Failed to load rounds" });
    }
  });

  // Get document templates for a stage
  app.get("/api/applicant/documents/:stageId", authenticateApplicant, async (req: any, res) => {
    try {
      const { stageId } = req.params;
      
      // Get the stage/round to check if it exists and get requirements
      const rounds = await storage.getCompetitionRounds();
      const stage = rounds.find(r => r.id === stageId);
      
      if (!stage) {
        return res.status(404).json({ message: "Stage not found" });
      }

      // For now, create sample document templates based on stage requirements
      const documents = (stage.requirements || []).map((req: any, index: number) => ({
        id: `${stageId}-doc-${index}`,
        name: req.description,
        description: req.description,
        fileUrl: req.template || undefined,
        fileType: req.template ? req.template.split('.').pop() || 'unknown' : 'unknown',
        isRequired: true,
        isActive: true,
        stageId: stageId
      }));

      res.json({ documents });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to load documents" });
    }
  });

  // Submit stage submission
  app.post("/api/applicant/submit-stage", authenticateApplicant, async (req: any, res) => {
    try {
      const applicant = req.applicant;
      const { stageId, githubUrl, documents } = req.body;
      
      if (!stageId) {
        return res.status(400).json({ message: "Stage ID is required" });
      }

      // Check if stage exists and is active
      const rounds = await storage.getCompetitionRounds();
      const stage = rounds.find(r => r.id === stageId);
      
      if (!stage) {
        return res.status(404).json({ message: "Stage not found" });
      }

      if (stage.status !== 'active') {
        return res.status(400).json({ message: "This stage is not currently active" });
      }

      if (stage.endTime && new Date(stage.endTime) < new Date()) {
        return res.status(400).json({ message: "This stage has expired" });
      }

      // Check if applicant is eligible to submit for this stage
      // For the first active stage, allow all registered applicants to submit
      // For subsequent stages, require selection status
      const now = new Date();
      const firstActiveStage = rounds.find(round => 
        round.status === 'active' && 
        (!round.endTime || new Date(round.endTime) > now) &&
        (!round.startTime || new Date(round.startTime) <= now)
      );
      
      const isFirstActiveStage = firstActiveStage && stage.id === firstActiveStage.id;
      

      
      if (isFirstActiveStage) {
        // First active stage: allow registered, selected, confirmed, and submitted applicants
        const allowedStatuses = ['registered', 'selected', 'confirmed', 'submitted'];
        if (!allowedStatuses.includes(applicant.status)) {
          return res.status(403).json({ 
            message: `You are not eligible to submit for this stage. Current status: ${applicant.status}.` 
          });
        }
      } else {
        // Subsequent stages: require selection status
        const eligibleStatuses = ['selected', 'confirmed', 'submitted'];
        if (!eligibleStatuses.includes(applicant.status)) {
          return res.status(403).json({ 
            message: `You are not eligible to submit for this stage. Current status: ${applicant.status}. You must be selected for the hackathon to make submissions.` 
          });
        }
      }

      // Check if submission already exists
      const existingSubmission = await storage.getStageSubmission(applicant.id, stageId);
      
      if (existingSubmission) {
        // Update existing submission
        const updated = await storage.updateStageSubmission(existingSubmission.id, {
          githubUrl,
          documents: documents || [],
          status: 'submitted',
          submittedAt: new Date()
        });
        
        res.json({ message: "Submission updated successfully", submission: updated });
      } else {
        // Create new submission
        const submission = await storage.createStageSubmission({
          applicantId: applicant.id,
          stageId,
          githubUrl,
          documents: documents || [],
          status: 'submitted',
          submittedAt: new Date()
        });
        
        res.json({ message: "Submission created successfully", submission });
      }

      // Create progress entry
      await storage.createApplicationProgress({
        applicantId: applicant.id,
        stage: `stage_${stageId}`,
        status: 'completed',
        description: `Submitted for ${stage.name}`,
        completedAt: new Date()
      });

    } catch (error) {
      console.error("Submit stage error:", error);
      res.status(500).json({ message: "Failed to submit" });
    }
  });

  // Get my submissions
  app.get("/api/applicant/my-submissions", authenticateApplicant, async (req: any, res) => {
    try {
      const applicant = req.applicant;
      const submissions = await storage.getStageSubmissions(applicant.id);
      res.json({ submissions });
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ message: "Failed to load submissions" });
    }
  });

  // ============= NOTIFICATION MANAGEMENT ROUTES =============

  // Get all notifications
  app.get("/api/notifications", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Create new notification
  app.post("/api/notifications", enhancedAuth, upload.array('attachments', 10), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Parse form data
      const {
        type,
        title,
        description,
        subject,
        message,
        toEmails,
        ccEmails,
        useBulkTemplate
      } = req.body;

      // Parse email arrays
      const toEmailsArray = toEmails ? JSON.parse(toEmails) : [];
      const ccEmailsArray = ccEmails ? JSON.parse(ccEmails) : [];

      // Handle attachments
      const attachments = req.files ? req.files.map((file: any) => ({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        buffer: file.buffer.toString('base64') // Store as base64 for simplicity
      })) : [];

      const notificationData = {
        type,
        title,
        description,
        subject,
        message,
        toEmails: toEmailsArray,
        ccEmails: ccEmailsArray,
        useBulkTemplate: useBulkTemplate === 'true',
        attachments,
        status: 'draft' as const,
        createdBy: user.id
      };

      // Create notification as draft
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Send notification
  app.post("/api/notifications/:id/send", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notificationId = req.params.id;
      const notification = await storage.getNotificationById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.status === 'sent') {
        return res.status(400).json({ message: "Notification has already been sent" });
      }

      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      try {
        if (notification.useBulkTemplate && notification.bulkData) {
          // Handle bulk sending (not implemented in this basic version)
          // Would process CSV data and send personalized emails
          console.log("Bulk sending not implemented yet");
        } else {
          // Send individual emails
          for (const email of notification.toEmails || []) {
            try {
              await emailService.sendCustomEmail({
                to: email,
                cc: notification.ccEmails,
                subject: notification.subject || notification.title,
                message: notification.message || notification.description,
                attachments: notification.attachments
              });
              sentCount++;
            } catch (error) {
              failedCount++;
              errors.push(`Failed to send to ${email}: ${(error as Error).message}`);
            }
          }
        }

        // Update notification status
        await storage.updateNotification(notificationId, {
          status: failedCount === 0 ? 'sent' : 'failed',
          sentAt: new Date(),
          sentCount: String(sentCount),
          failedCount: String(failedCount),
          errorMessage: errors.length > 0 ? errors.join('; ') : null
        });

        res.json({ 
          message: `Notification sent successfully. Sent: ${sentCount}, Failed: ${failedCount}`,
          sentCount,
          failedCount,
          errors: errors.length > 0 ? errors : undefined
        });
      } catch (error) {
        await storage.updateNotification(notificationId, {
          status: 'failed',
          errorMessage: (error as Error).message
        });
        throw error;
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Update notification
  app.put("/api/notifications/:id", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notificationId = req.params.id;
      const notification = await storage.getNotificationById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.status === 'sent') {
        return res.status(400).json({ message: "Cannot edit a notification that has already been sent" });
      }

      const updateData = req.body;
      
      // Parse email arrays if they're strings
      if (updateData.toEmails && typeof updateData.toEmails === 'string') {
        updateData.toEmails = updateData.toEmails.split(',').map((email: string) => email.trim()).filter(Boolean);
      }
      if (updateData.ccEmails && typeof updateData.ccEmails === 'string') {
        updateData.ccEmails = updateData.ccEmails.split(',').map((email: string) => email.trim()).filter(Boolean);
      }

      const updatedNotification = await storage.updateNotification(notificationId, updateData);
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notificationId = req.params.id;
      await storage.deleteNotification(notificationId);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // CCAvenue Payment Routes
  const ccavenueService = new CCAvenueService(
    process.env.CCAVENUE_MERCHANT_ID || '',
    process.env.CCAVENUE_ACCESS_CODE || '',
    process.env.CCAVENUE_WORKING_KEY || ''
  );

  // Create payment intent
  app.post('/api/payments/create', async (req: any, res) => {
    try {
      // For testing purposes, allow payment creation without strict authentication
      const userId = req.user?.claims?.sub || req.user?.id || 'guest-user';

      const {
        amount,
        paymentType,
        description,
        billingName,
        billingEmail,
        billingPhone,
        billingAddress,
        billingCity,
        billingState,
        billingZip
      } = req.body;

      // Generate unique order ID
      const orderId = `HKT${Date.now()}`;

      // Create payment record
      const payment = await storage.createPayment({
        orderId,
        userId: userId,
        amount: amount.toString(),
        currency: 'INR',
        status: 'pending',
        paymentType,
        description,
        billingName,
        billingEmail,
        billingPhone,
        billingAddress,
        billingCity,
        billingState,
        billingZip,
        billingCountry: 'India'
      });

      // Debug: Check if credentials are loaded
      console.log('CCAvenue Merchant ID present:', !!process.env.CCAVENUE_MERCHANT_ID);
      console.log('CCAvenue Access Code present:', !!process.env.CCAVENUE_ACCESS_CODE);
      console.log('CCAvenue Working Key present:', !!process.env.CCAVENUE_WORKING_KEY);
      console.log('Merchant ID length:', process.env.CCAVENUE_MERCHANT_ID?.length);
      console.log('Access Code length:', process.env.CCAVENUE_ACCESS_CODE?.length);
      console.log('Working Key length:', process.env.CCAVENUE_WORKING_KEY?.length);
      console.log('Access Code first 4 chars:', process.env.CCAVENUE_ACCESS_CODE?.substring(0, 4));
      console.log('Working Key first 8 chars:', process.env.CCAVENUE_WORKING_KEY?.substring(0, 8));

      // Generate CCAvenue payment request with all mandatory fields
      const paymentData = {
        merchant_id: process.env.CCAVENUE_MERCHANT_ID!,
        order_id: orderId,
        amount: amount.toString(),
        currency: 'INR',
        billing_name: billingName,
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_state: billingState,
        billing_zip: billingZip,
        billing_country: 'India',
        billing_tel: billingPhone,
        billing_email: billingEmail,
        delivery_name: billingName,
        delivery_address: billingAddress,
        delivery_city: billingCity,
        delivery_state: billingState,
        delivery_zip: billingZip,
        delivery_country: 'India',
        delivery_tel: billingPhone,
        merchant_param1: paymentType,
        merchant_param2: description,
        merchant_param3: userId,
        redirect_url: `${req.protocol}://${req.get('host')}/api/payments/response`,
        cancel_url: `${req.protocol}://${req.get('host')}/api/payments/cancel`,
        language: 'EN'
      };

      console.log('Payment data being sent:', ccavenueService.stringify(paymentData));
      const encryptedData = ccavenueService.encrypt(ccavenueService.stringify(paymentData));
      console.log('Encrypted data length:', encryptedData.length);

      res.json({
        orderId,
        encryptedData,
        accessCode: process.env.CCAVENUE_ACCESS_CODE,
        paymentUrl: process.env.NODE_ENV === 'production' 
          ? 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction'
          : 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction'
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Payment response handler
  app.post('/api/payments/response', async (req, res) => {
    try {
      const { encResp } = req.body;
      const decryptedData = ccavenueService.decrypt(encResp);
      const responseData = ccavenueService.parse(decryptedData);

      const payment = await storage.getPaymentByOrderId(responseData.order_id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Update payment status
      await storage.updatePayment(payment.id, {
        status: responseData.order_status === 'Success' ? 'success' : 'failed',
        trackingId: responseData.tracking_id,
        bankRefNo: responseData.bank_ref_no,
        paymentMode: responseData.payment_mode,
        failureMessage: responseData.failure_message,
        responseData: responseData
      });

      // Redirect based on payment status
      if (responseData.order_status === 'Success') {
        res.redirect(`/payment-success?orderId=${responseData.order_id}`);
      } else {
        res.redirect(`/payment-failed?orderId=${responseData.order_id}`);
      }
    } catch (error) {
      console.error("Payment response error:", error);
      res.redirect('/payment-failed');
    }
  });

  // Payment cancel handler
  app.post('/api/payments/cancel', async (req, res) => {
    try {
      const { encResp } = req.body;
      const decryptedData = ccavenueService.decrypt(encResp);
      const responseData = ccavenueService.parse(decryptedData);

      const payment = await storage.getPaymentByOrderId(responseData.order_id);
      if (payment) {
        await storage.updatePayment(payment.id, {
          status: 'cancelled',
          responseData: responseData
        });
      }

      res.redirect(`/payment-cancelled?orderId=${responseData.order_id}`);
    } catch (error) {
      console.error("Payment cancel error:", error);
      res.redirect('/payment-cancelled');
    }
  });

  // Get payment status
  app.get('/api/payments/:orderId', enhancedAuth, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const payment = await storage.getPaymentByOrderId(orderId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check if user owns this payment
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (payment.userId !== user?.id && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Payment status error:", error);
      res.status(500).json({ message: "Failed to get payment status" });
    }
  });

  // Get user's payments
  app.get('/api/payments', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const payments = await storage.getPaymentsByUser(user.id);
      res.json(payments);
    } catch (error) {
      console.error("Payments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Download backend code endpoint
  app.get('/api/download/backend', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filePath = path.join(process.cwd(), 'hackathon-nodejs-complete.tar.gz');
      const fs = await import('fs/promises');
      
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'Backend archive not found' });
      }

      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="hackathon-nodejs-backend.tar.gz"');
      
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading backend code:', error);
      res.status(500).json({ error: 'Failed to download backend code' });
    }
  });

  // Download complete GitHub-ready project
  app.get('/api/download/github-project', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filePath = path.join(process.cwd(), 'hackathon-hub-github-ready.tar.gz');
      const fs = await import('fs/promises');
      
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'GitHub project archive not found' });
      }

      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="hackathon-hub-github-ready.tar.gz"');
      
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading GitHub project:', error);
      res.status(500).json({ error: 'Failed to download GitHub project' });
    }
  });

  // Download missing GitHub files (README, DEPLOYMENT, LICENSE, .gitignore)
  app.get('/api/download/missing-files', enhancedAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filePath = path.join(process.cwd(), 'missing-github-files.tar.gz');
      const fs = await import('fs/promises');
      
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: 'Missing files archive not found' });
      }

      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="missing-github-files.tar.gz"');
      
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading missing files:', error);
      res.status(500).json({ error: 'Failed to download missing files' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

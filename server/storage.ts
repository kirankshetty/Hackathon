import {
  users,
  applicants,
  submissions,
  eventSettings,
  notifications,
  juryMembers,
  projectSubmissions,
  orientationSessions,
  competitionRounds,
  otpVerifications,
  applicantSessions,
  documentTemplates,
  stageSubmissions,
  applicationProgress,
  payments,
  type User,
  type UpsertUser,
  type InsertApplicant,
  type Applicant,
  type InsertSubmission,
  type Submission,
  type InsertEventSettings,
  type EventSettings,
  type InsertNotification,
  type Notification,
  type JuryMember,
  type InsertJuryMember,
  type ProjectSubmission,
  type InsertProjectSubmission,
  type OrientationSession,
  type InsertOrientationSession,
  type CompetitionRound,
  type InsertCompetitionRound,
  type OtpVerification,
  type InsertOtpVerification,
  type ApplicantSession,
  type InsertApplicantSession,
  type DocumentTemplate,
  type InsertDocumentTemplate,
  type StageSubmission,
  type InsertStageSubmission,
  type ApplicationProgress,
  type InsertApplicationProgress,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, or, ilike, gte, lte, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  
  // Applicant operations
  createApplicant(applicant: InsertApplicant): Promise<Applicant>;
  getApplicant(id: string): Promise<Applicant | undefined>;
  getApplicantById(id: string): Promise<Applicant | undefined>;
  getApplicantByRegistrationId(registrationId: string): Promise<Applicant | undefined>;
  getApplicantByEmail(email: string): Promise<Applicant | undefined>;
  updateApplicant(id: string, updates: Partial<Applicant>): Promise<Applicant>;
  deleteApplicant(id: string): Promise<void>;
  getApplicants(filters?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Applicant[]>;
  getApplicantsCount(filters?: { status?: string; search?: string }): Promise<number>;
  clearAllApplicantData(): Promise<void>;
  deleteApplicantsByEmails(emails: string[]): Promise<number>;
  restoreCompetitionData(): Promise<void>;
  getApplicantsForExport(filters: any): Promise<Applicant[]>;
  getRecentActivity(limit?: number): Promise<any[]>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getLatestSubmission(applicantId: string): Promise<Submission | undefined>;
  getSubmissionsByApplicant(applicantId: string): Promise<Submission[]>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission>;
  
  // Event settings operations
  getEventSettings(): Promise<EventSettings | undefined>;
  updateEventSettings(settings: InsertEventSettings): Promise<EventSettings>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getPendingNotifications(): Promise<Notification[]>;
  markNotificationSent(id: string, error?: string): Promise<void>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalApplicants: number;
    selectedApplicants: number;
    confirmedParticipants: number;
    eventDayRegistered: number;
    round1Qualified: number;
    round2Qualified: number;
    finalRoundQualified: number;
    totalSubmissions: number;
    pendingReview: number;
    reviewed: number;
  }>;

  // Jury operations
  getJuryMembers(): Promise<JuryMember[]>;
  createJuryMember(member: InsertJuryMember): Promise<JuryMember>;
  updateJuryMember(id: string, updates: Partial<JuryMember>): Promise<JuryMember>;

  // Project submission operations
  getProjectSubmissions(): Promise<ProjectSubmission[]>;
  createProjectSubmission(submission: InsertProjectSubmission): Promise<ProjectSubmission>;
  updateProjectSubmission(id: string, updates: Partial<ProjectSubmission>): Promise<ProjectSubmission>;

  // Orientation operations
  getOrientationSessions(): Promise<OrientationSession[]>;
  createOrientationSession(session: InsertOrientationSession): Promise<OrientationSession>;
  updateOrientationSession(id: string, updates: Partial<OrientationSession>): Promise<OrientationSession>;

  // Competition rounds operations
  getCompetitionRounds(): Promise<CompetitionRound[]>;
  createCompetitionRound(round: InsertCompetitionRound): Promise<CompetitionRound>;
  updateCompetitionRound(id: string, updates: Partial<CompetitionRound>): Promise<CompetitionRound>;
  deleteCompetitionRound(id: string): Promise<void>;

  // OTP operations
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(identifier: string, otp: string, purpose: string): Promise<OtpVerification | undefined>;
  markOtpAsVerified(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Applicant session operations
  createApplicantSession(session: InsertApplicantSession): Promise<ApplicantSession>;
  getApplicantSession(sessionToken: string): Promise<ApplicantSession | undefined>;
  updateApplicantSessionActivity(sessionToken: string): Promise<void>;
  deleteApplicantSession(sessionToken: string): Promise<void>;
  getApplicantByEmailOrMobile(identifier: string): Promise<Applicant | undefined>;

  // Document template operations
  getDocumentTemplates(stageId?: string): Promise<DocumentTemplate[]>;
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  updateDocumentTemplate(id: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate>;
  deleteDocumentTemplate(id: string): Promise<void>;

  // Stage submission operations
  getStageSubmissions(applicantId?: string, stageId?: string): Promise<StageSubmission[]>;
  createStageSubmission(submission: InsertStageSubmission): Promise<StageSubmission>;
  updateStageSubmission(id: string, updates: Partial<StageSubmission>): Promise<StageSubmission>;
  getStageSubmission(applicantId: string, stageId: string): Promise<StageSubmission | undefined>;
  getStageSubmissionsCount(stageId: string): Promise<number>;

  // Application progress operations
  getApplicationProgress(applicantId: string): Promise<ApplicationProgress[]>;
  createApplicationProgress(progress: InsertApplicationProgress): Promise<ApplicationProgress>;
  updateApplicationProgress(id: string, updates: Partial<ApplicationProgress>): Promise<ApplicationProgress>;

  // Email settings operations (already exist in EventSettings)
  getEmailSettings(): Promise<EventSettings | undefined>;
  updateEmailSettings(settings: Partial<EventSettings>): Promise<EventSettings>;

  // Notification operations
  getNotifications(): Promise<Notification[]>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, updates: Partial<Notification>): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;

  // Competition round data export
  getCompetitionRoundData(filters: any, metrics: any): Promise<any>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment>;
  getPaymentsByApplicant(applicantId: string): Promise<Payment[]>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Applicant operations
  async createApplicant(applicantData: InsertApplicant): Promise<Applicant> {
    const registrationId = `HKT${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    const [applicant] = await db
      .insert(applicants)
      .values({
        ...applicantData,
        registrationId,
      })
      .returning();
    return applicant;
  }

  async getApplicant(id: string): Promise<Applicant | undefined> {
    const [applicant] = await db.select().from(applicants).where(eq(applicants.id, id));
    return applicant;
  }

  async getApplicantById(id: string): Promise<Applicant | undefined> {
    const [applicant] = await db.select().from(applicants).where(eq(applicants.id, id));
    return applicant;
  }

  async getApplicantByRegistrationId(registrationId: string): Promise<Applicant | undefined> {
    const [applicant] = await db.select().from(applicants).where(eq(applicants.registrationId, registrationId));
    return applicant;
  }

  async getApplicantByEmail(email: string): Promise<Applicant | undefined> {
    const [applicant] = await db.select().from(applicants).where(eq(applicants.email, email));
    return applicant;
  }

  async updateApplicant(id: string, updates: Partial<Applicant>): Promise<Applicant> {
    const [applicant] = await db
      .update(applicants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applicants.id, id))
      .returning();
    return applicant;
  }

  async deleteApplicant(id: string): Promise<void> {
    // Delete related records first (respecting foreign key constraints)
    await db.delete(applicationProgress).where(eq(applicationProgress.applicantId, id));
    await db.delete(applicantSessions).where(eq(applicantSessions.applicantId, id));
    await db.delete(stageSubmissions).where(eq(stageSubmissions.applicantId, id));
    await db.delete(projectSubmissions).where(eq(projectSubmissions.applicantId, id));
    await db.delete(submissions).where(eq(submissions.applicantId, id));
    
    // Get applicant email for OTP cleanup
    const applicant = await this.getApplicant(id);
    if (applicant) {
      await db.delete(otpVerifications).where(eq(otpVerifications.identifier, applicant.email));
    }
    
    // Finally delete the applicant
    await db.delete(applicants).where(eq(applicants.id, id));
  }

  async getApplicants(filters?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Applicant[]> {
    let query = db.select().from(applicants);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(applicants.status, filters.status as any));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          sql`${applicants.name} ILIKE ${`%${filters.search}%`}`,
          sql`${applicants.email} ILIKE ${`%${filters.search}%`}`,
          sql`${applicants.registrationId} ILIKE ${`%${filters.search}%`}`,
          sql`${applicants.collegeName} ILIKE ${`%${filters.search}%`}`
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(applicants.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async getApplicantsCount(filters?: { status?: string; search?: string }): Promise<number> {
    let query = db.select({ count: count() }).from(applicants);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(applicants.status, filters.status as any));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          sql`${applicants.name} ILIKE ${`%${filters.search}%`}`,
          sql`${applicants.email} ILIKE ${`%${filters.search}%`}`,
          sql`${applicants.registrationId} ILIKE ${`%${filters.search}%`}`,
          sql`${applicants.collegeName} ILIKE ${`%${filters.search}%`}`
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const [result] = await query;
    return result.count;
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const activities = [];

      // Get recent registrations
      const recentApplicants = await db
        .select({
          id: applicants.id,
          name: applicants.name,
          createdAt: applicants.createdAt,
          type: sql<string>`'registration'`
        })
        .from(applicants)
        .orderBy(desc(applicants.createdAt))
        .limit(limit);

      // Get recent submissions
      const recentSubmissions = await db
        .select({
          id: stageSubmissions.id,
          applicantId: stageSubmissions.applicantId,
          name: applicants.name,
          createdAt: stageSubmissions.createdAt,
          type: sql<string>`'submission'`
        })
        .from(stageSubmissions)
        .leftJoin(applicants, eq(stageSubmissions.applicantId, applicants.id))
        .orderBy(desc(stageSubmissions.createdAt))
        .limit(limit);

      // Get recent status updates (selected applicants)
      const recentSelections = await db
        .select({
          id: applicants.id,
          name: applicants.name,
          updatedAt: applicants.updatedAt,
          type: sql<string>`'selection'`,
          status: applicants.status
        })
        .from(applicants)
        .where(eq(applicants.status, 'selected'))
        .orderBy(desc(applicants.updatedAt))
        .limit(limit);

      // Combine and format activities
      const combinedActivities = [
        ...recentApplicants.map(item => ({
          id: item.id,
          name: item.name,
          action: 'registered',
          timestamp: item.createdAt,
          type: 'registration'
        })),
        ...recentSubmissions.map(item => ({
          id: item.id,
          name: item.name,
          action: 'submitted project',
          timestamp: item.createdAt,
          type: 'submission'
        })),
        ...recentSelections.map(item => ({
          id: item.id,
          name: item.name,
          action: 'was selected',
          timestamp: item.updatedAt,
          type: 'selection'
        }))
      ];

      // Sort by timestamp and limit
      return combinedActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }

  async clearAllApplicantData(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await db.delete(applicationProgress);
    await db.delete(applicantSessions);
    await db.delete(stageSubmissions);
    await db.delete(projectSubmissions);
    await db.delete(submissions);
    await db.delete(otpVerifications);
    await db.delete(applicants);
  }

  async deleteApplicantsByEmails(emails: string[]): Promise<number> {
    if (emails.length === 0) return 0;

    // Get applicant IDs first
    const applicantsToDelete = await db
      .select({ id: applicants.id })
      .from(applicants)
      .where(sql`${applicants.email} = ANY(${emails})`);

    const applicantIds = applicantsToDelete.map(a => a.id);
    
    if (applicantIds.length === 0) return 0;

    // Delete related records first (respecting foreign key constraints)
    await db.delete(applicationProgress)
      .where(sql`${applicationProgress.applicantId} = ANY(${applicantIds})`);
    
    await db.delete(applicantSessions)
      .where(sql`${applicantSessions.applicantId} = ANY(${applicantIds})`);
    
    await db.delete(stageSubmissions)
      .where(sql`${stageSubmissions.applicantId} = ANY(${applicantIds})`);
    
    await db.delete(projectSubmissions)
      .where(sql`${projectSubmissions.applicantId} = ANY(${applicantIds})`);
    
    await db.delete(submissions)
      .where(sql`${submissions.applicantId} = ANY(${applicantIds})`);
    
    // Delete OTP verifications by email
    await db.delete(otpVerifications)
      .where(sql`${otpVerifications.identifier} = ANY(${emails})`);
    
    // Finally delete applicants
    const result = await db.delete(applicants)
      .where(sql`${applicants.email} = ANY(${emails})`);

    return applicantIds.length;
  }

  async restoreCompetitionData(): Promise<void> {
    // Check if competition rounds already exist
    const existingRounds = await db.select().from(competitionRounds);
    if (existingRounds.length > 0) {
      console.log("Competition rounds already exist, skipping restoration");
      return;
    }

    // Insert competition rounds
    const rounds = [
      {
        id: "ebb05ead-8541-4155-8686-9832a47ab569",
        name: "Stage 1 - Preliminary Ideas Submission Round",
        description: "Initial screening based on project submissions and technical documentation.",
        startTime: new Date("2025-07-30T07:51:22.493Z"),
        endTime: new Date("2025-08-06T08:51:22.493Z"),
        maxParticipants: 1000,
        currentParticipants: 1000,
        status: "active" as any,
        prizes: ["Top 300 advance to Stage 2"],
        judgeIds: [],
        totalColleges: 25,
        ideasSubmitted: 600,
        prototypesApproved: 0,
        projectsApproved: 0,
        totalInvitees: 0,
        solutionsToBeBuilt: 0,
        requirements: [
          {
            template: "",
            description: "Submit working prototype with complete source code"
          },
          {
            template: "",
            description: "Complete technical documentation"
          },
          {
            template: "",
            description: "Record 5-minute demo video"
          }
        ]
      },
      {
        id: "57eaed5c-d128-453b-abdf-c5bf3217ae46",
        name: "Stage 2 - Prototype Submission and Selection Round",
        description: "Live presentations and technical interviews with jury members.",
        startTime: new Date("2025-08-11T10:00:00.000Z"),
        endTime: new Date("2025-08-31T17:00:00.000Z"),
        maxParticipants: 300,
        currentParticipants: 300,
        status: "upcoming" as any,
        prizes: ["Top 100 advance to Stage 3"],
        judgeIds: [],
        totalColleges: 18,
        ideasSubmitted: 0,
        prototypesApproved: 60,
        projectsApproved: 0,
        totalInvitees: 0,
        solutionsToBeBuilt: 0,
        requirements: [
          {
            template: null,
            description: "Live presentation (10 minutes maximum)"
          },
          {
            template: "https://example.com/qa-guide.pdf",
            description: "Technical Q&A session preparation"
          },
          {
            template: null,
            description: "Code review submission"
          }
        ]
      },
      {
        id: "a53fe8ef-59ed-47ec-975c-b5232bb7b6bf",
        name: "Stage 3 - Project Submission and Selection Round",
        description: "Project Submission and demonstrations to determine the winners for the next stage.",
        startTime: new Date("2025-09-01T13:00:00.000Z"),
        endTime: new Date("2025-09-18T18:00:00.000Z"),
        maxParticipants: 100,
        currentParticipants: 60,
        status: "upcoming" as any,
        prizes: ["Top 5 selected candidates move to the final round"],
        judgeIds: [],
        totalColleges: 10,
        ideasSubmitted: 0,
        prototypesApproved: 0,
        projectsApproved: 20,
        totalInvitees: 0,
        solutionsToBeBuilt: 0,
        requirements: [
          {
            template: null,
            description: "Submit working prototype and complete technical documentation"
          }
        ]
      },
      {
        id: "1727ce17-5800-475b-9fe5-8fa40ccd50cb",
        name: "Stage 4 - Change Makers and Innovators",
        description: "Recognition and final award ceremony.",
        startTime: new Date("2025-09-19T13:00:00.000Z"),
        endTime: new Date("2025-09-19T14:00:00.000Z"),
        maxParticipants: 5,
        currentParticipants: 0,
        status: "upcoming" as any,
        prizes: ["Job opportunities", "Certificate of participation"],
        judgeIds: [],
        totalColleges: 4,
        ideasSubmitted: 0,
        prototypesApproved: 0,
        projectsApproved: 0,
        totalInvitees: 10,
        solutionsToBeBuilt: 3,
        requirements: [
          {
            template: null,
            description: "Attend final ceremony and showcase completed solutions"
          }
        ]
      }
    ];

    await db.insert(competitionRounds).values(rounds);

    // Insert event settings if they don't exist
    const existingSettings = await db.select().from(eventSettings);
    if (existingSettings.length === 0) {
      await db.insert(eventSettings).values({
        registrationEnabled: true,
        submissionEnabled: false,
        enableEmails: true,
        emailHost: "smtp.gmail.com",
        emailPort: 587,
        emailUser: "info@hfactor.app",
        emailPass: "nmyy mnmj plrw elbc",
        fromEmail: "hackathon@hfactor.app",
        emailService: "gmail"
      });
    }

    // Insert document templates
    const existingTemplates = await db.select().from(documentTemplates);
    if (existingTemplates.length === 0) {
      const templates = [
        {
          name: "Project Proposal Template",
          description: "Template for submitting your project proposal with technical details",
          fileUrl: "/templates/project-proposal.pdf",
          fileType: "pdf",
          stageId: "ebb05ead-8541-4155-8686-9832a47ab569",
          isRequired: true,
          displayOrder: 1,
          isActive: true
        },
        {
          name: "Technical Specification Guide",
          description: "Guidelines for technical implementation details",
          fileUrl: "/templates/tech-spec.docx",
          fileType: "docx",
          stageId: "ebb05ead-8541-4155-8686-9832a47ab569",
          isRequired: true,
          displayOrder: 2,
          isActive: true
        },
        {
          name: "Budget Estimation Template",
          description: "Optional template for project budget estimation",
          fileUrl: "/templates/budget.xlsx",
          fileType: "xlsx",
          stageId: "ebb05ead-8541-4155-8686-9832a47ab569",
          isRequired: false,
          displayOrder: 3,
          isActive: true
        },
        {
          name: "Presentation Template",
          description: "PowerPoint template for project presentation",
          fileUrl: "/templates/presentation.pptx",
          fileType: "pptx",
          stageId: "ebb05ead-8541-4155-8686-9832a47ab569",
          isRequired: false,
          displayOrder: 4,
          isActive: true
        }
      ];

      await db.insert(documentTemplates).values(templates);
    }

    console.log("Competition data restored successfully");
  }

  async getApplicantsForExport(filters: any): Promise<Applicant[]> {
    let query = db.select().from(applicants);
    const conditions: any[] = [];

    // Date range filter
    if (filters.fromDateTime) {
      conditions.push(gte(applicants.createdAt, filters.fromDateTime));
    }
    if (filters.toDateTime) {
      conditions.push(lte(applicants.createdAt, filters.toDateTime));
    }

    // College name filter (case-insensitive partial match)
    if (filters.collegeName) {
      conditions.push(ilike(applicants.college, `%${filters.collegeName}%`));
    }

    // Status filter
    if (filters.status) {
      conditions.push(eq(applicants.status, filters.status));
    }

    // Registration code filter
    if (filters.registrationCode) {
      conditions.push(eq(applicants.registrationId, filters.registrationCode));
    }

    // Apply all conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Order by creation date (newest first)
    query = query.orderBy(desc(applicants.createdAt)) as any;

    return await query;
  }

  // Submission operations
  async createSubmission(submissionData: InsertSubmission): Promise<Submission> {
    // Mark previous submissions as not latest
    await db
      .update(submissions)
      .set({ isLatest: false })
      .where(eq(submissions.applicantId, submissionData.applicantId));

    const [submission] = await db
      .insert(submissions)
      .values(submissionData)
      .returning();
    return submission;
  }

  async getLatestSubmission(applicantId: string): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.applicantId, applicantId), eq(submissions.isLatest, true)));
    return submission;
  }

  async getSubmissionsByApplicant(applicantId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.applicantId, applicantId))
      .orderBy(desc(submissions.submittedAt));
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
    const [submission] = await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id))
      .returning();
    return submission;
  }

  // Event settings operations
  async getEventSettings(): Promise<EventSettings | undefined> {
    const [settings] = await db.select().from(eventSettings).limit(1);
    return settings;
  }

  async updateEventSettings(settingsData: InsertEventSettings): Promise<EventSettings> {
    const existing = await this.getEventSettings();
    
    if (existing) {
      const [settings] = await db
        .update(eventSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(eventSettings.id, existing.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(eventSettings)
        .values(settingsData)
        .returning();
      return settings;
    }
  }

  // Email settings operations
  async getEmailSettings(): Promise<EventSettings | undefined> {
    return this.getEventSettings();
  }

  async updateEmailSettings(emailData: {
    enableEmails: boolean;
    emailHost?: string;
    emailPort?: string;
    emailUser?: string;
    emailPass?: string;
    fromEmail?: string;
    emailService?: string;
  }): Promise<EventSettings> {
    return this.updateEventSettings(emailData);
  }

  // Notification operations
  async getNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  // Dashboard statistics
  async getDashboardStats() {
    const [
      totalApplicants,
      selectedApplicants,
      confirmedParticipants,
      eventDayRegistered,
      round1Qualified,
      round2Qualified,
      finalRoundQualified,
      totalSubmissions,
      pendingReview,
      reviewed,
    ] = await Promise.all([
      db.select({ count: count() }).from(applicants),
      db.select({ count: count() }).from(applicants).where(eq(applicants.status, 'selected')),
      db.select({ count: count() }).from(applicants).where(eq(applicants.status, 'confirmed')),
      db.select({ count: count() }).from(applicants).where(eq(applicants.eventDayRegistered, true)),
      db.select({ count: count() }).from(applicants).where(eq(applicants.status, 'round1')),
      db.select({ count: count() }).from(applicants).where(eq(applicants.status, 'round2')),
      db.select({ count: count() }).from(applicants).where(eq(applicants.status, 'round3')),
      db.select({ count: count() }).from(submissions),
      db.select({ count: count() }).from(submissions).where(sql`${submissions.reviewedAt} IS NULL`),
      db.select({ count: count() }).from(submissions).where(sql`${submissions.reviewedAt} IS NOT NULL`),
    ]);

    return {
      totalApplicants: totalApplicants[0].count,
      selectedApplicants: selectedApplicants[0].count,
      confirmedParticipants: confirmedParticipants[0].count,
      eventDayRegistered: eventDayRegistered[0].count,
      round1Qualified: round1Qualified[0].count,
      round2Qualified: round2Qualified[0].count,
      finalRoundQualified: finalRoundQualified[0].count,
      totalSubmissions: totalSubmissions[0].count,
      pendingReview: pendingReview[0].count,
      reviewed: reviewed[0].count,
    };
  }

  // Jury operations
  async getJuryMembers(): Promise<JuryMember[]> {
    return await db.select().from(juryMembers).orderBy(juryMembers.name);
  }

  async createJuryMember(memberData: InsertJuryMember): Promise<JuryMember> {
    const [member] = await db
      .insert(juryMembers)
      .values(memberData)
      .returning();
    return member;
  }

  async updateJuryMember(id: string, updates: Partial<JuryMember>): Promise<JuryMember> {
    const [member] = await db
      .update(juryMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(juryMembers.id, id))
      .returning();
    return member;
  }

  // Project submission operations
  async getProjectSubmissions(): Promise<ProjectSubmission[]> {
    return await db.select().from(projectSubmissions).orderBy(desc(projectSubmissions.submittedAt));
  }

  async createProjectSubmission(submissionData: InsertProjectSubmission): Promise<ProjectSubmission> {
    const [submission] = await db
      .insert(projectSubmissions)
      .values(submissionData)
      .returning();
    return submission;
  }

  async updateProjectSubmission(id: string, updates: Partial<ProjectSubmission>): Promise<ProjectSubmission> {
    const [submission] = await db
      .update(projectSubmissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectSubmissions.id, id))
      .returning();
    return submission;
  }

  // Orientation operations
  async getOrientationSessions(): Promise<OrientationSession[]> {
    return await db.select().from(orientationSessions).orderBy(orientationSessions.scheduledTime);
  }

  async createOrientationSession(sessionData: InsertOrientationSession): Promise<OrientationSession> {
    const [session] = await db
      .insert(orientationSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateOrientationSession(id: string, updates: Partial<OrientationSession>): Promise<OrientationSession> {
    const [session] = await db
      .update(orientationSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orientationSessions.id, id))
      .returning();
    return session;
  }

  // Competition rounds operations
  async getCompetitionRounds(): Promise<CompetitionRound[]> {
    return await db.select().from(competitionRounds).orderBy(competitionRounds.startTime);
  }

  async createCompetitionRound(roundData: InsertCompetitionRound): Promise<CompetitionRound> {
    const [round] = await db
      .insert(competitionRounds)
      .values(roundData)
      .returning();
    return round;
  }

  async updateCompetitionRound(id: string, updates: Partial<CompetitionRound>): Promise<CompetitionRound> {
    const [round] = await db
      .update(competitionRounds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(competitionRounds.id, id))
      .returning();
    return round;
  }

  async deleteCompetitionRound(id: string): Promise<void> {
    // First delete all stage submissions that reference this round
    await db
      .delete(stageSubmissions)
      .where(eq(stageSubmissions.stageId, id));
    
    // Then delete the competition round
    await db
      .delete(competitionRounds)
      .where(eq(competitionRounds.id, id));
  }

  // OTP operations
  async createOtpVerification(otpData: InsertOtpVerification): Promise<OtpVerification> {
    const [otp] = await db
      .insert(otpVerifications)
      .values(otpData)
      .returning();
    return otp;
  }

  async getOtpVerification(identifier: string, otp: string, purpose: string): Promise<OtpVerification | undefined> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.purpose, purpose),
          eq(otpVerifications.verified, false)
        )
      )
      .orderBy(desc(otpVerifications.createdAt))
      .limit(1);
    return verification;
  }

  async markOtpAsVerified(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ verified: true })
      .where(eq(otpVerifications.id, id));
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ attempts: sql`${otpVerifications.attempts}::int + 1` })
      .where(eq(otpVerifications.id, id));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(sql`${otpVerifications.expiresAt} < NOW()`);
  }

  // Applicant session operations
  async createApplicantSession(sessionData: InsertApplicantSession): Promise<ApplicantSession> {
    const [session] = await db
      .insert(applicantSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getApplicantSession(sessionToken: string): Promise<ApplicantSession | undefined> {
    const [session] = await db
      .select()
      .from(applicantSessions)
      .where(
        and(
          eq(applicantSessions.sessionToken, sessionToken),
          sql`${applicantSessions.expiresAt} > NOW()`
        )
      );
    return session;
  }

  async updateApplicantSessionActivity(sessionToken: string): Promise<void> {
    await db
      .update(applicantSessions)
      .set({ lastActivity: new Date() })
      .where(eq(applicantSessions.sessionToken, sessionToken));
  }

  async deleteApplicantSession(sessionToken: string): Promise<void> {
    await db
      .delete(applicantSessions)
      .where(eq(applicantSessions.sessionToken, sessionToken));
  }

  async getApplicantByEmailOrMobile(identifier: string): Promise<Applicant | undefined> {
    const [applicant] = await db
      .select()
      .from(applicants)
      .where(or(eq(applicants.email, identifier), eq(applicants.mobile, identifier)));
    return applicant;
  }

  // Document template operations
  async getDocumentTemplates(stageId?: string): Promise<DocumentTemplate[]> {
    const query = db.select().from(documentTemplates);
    if (stageId) {
      return await query.where(eq(documentTemplates.stageId, stageId)).orderBy(documentTemplates.displayOrder);
    }
    return await query.where(eq(documentTemplates.isActive, true)).orderBy(documentTemplates.displayOrder);
  }

  async createDocumentTemplate(templateData: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const [template] = await db
      .insert(documentTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async updateDocumentTemplate(id: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const [template] = await db
      .update(documentTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentTemplates.id, id))
      .returning();
    return template;
  }

  async deleteDocumentTemplate(id: string): Promise<void> {
    await db
      .delete(documentTemplates)
      .where(eq(documentTemplates.id, id));
  }

  // Stage submission operations
  async getStageSubmissions(applicantId?: string, stageId?: string): Promise<StageSubmission[]> {
    let query = db.select().from(stageSubmissions);
    
    if (applicantId && stageId) {
      return await query.where(
        and(eq(stageSubmissions.applicantId, applicantId), eq(stageSubmissions.stageId, stageId))
      );
    } else if (applicantId) {
      return await query.where(eq(stageSubmissions.applicantId, applicantId)).orderBy(desc(stageSubmissions.createdAt));
    } else if (stageId) {
      return await query.where(eq(stageSubmissions.stageId, stageId)).orderBy(desc(stageSubmissions.createdAt));
    }
    
    return await query.orderBy(desc(stageSubmissions.createdAt));
  }

  async createStageSubmission(submissionData: InsertStageSubmission): Promise<StageSubmission> {
    const [submission] = await db
      .insert(stageSubmissions)
      .values(submissionData)
      .returning();
    return submission;
  }

  async updateStageSubmission(id: string, updates: Partial<StageSubmission>): Promise<StageSubmission> {
    const [submission] = await db
      .update(stageSubmissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stageSubmissions.id, id))
      .returning();
    return submission;
  }

  async getStageSubmission(applicantId: string, stageId: string): Promise<StageSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(stageSubmissions)
      .where(
        and(eq(stageSubmissions.applicantId, applicantId), eq(stageSubmissions.stageId, stageId))
      );
    return submission;
  }

  async getStageSubmissionsCount(stageId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(stageSubmissions)
      .where(eq(stageSubmissions.stageId, stageId));
    return result[0]?.count || 0;
  }

  // Application progress operations
  async getApplicationProgress(applicantId: string): Promise<ApplicationProgress[]> {
    return await db
      .select()
      .from(applicationProgress)
      .where(eq(applicationProgress.applicantId, applicantId))
      .orderBy(desc(applicationProgress.createdAt));
  }

  async createApplicationProgress(progressData: InsertApplicationProgress): Promise<ApplicationProgress> {
    const [progress] = await db
      .insert(applicationProgress)
      .values(progressData)
      .returning();
    return progress;
  }

  async updateApplicationProgress(id: string, updates: Partial<ApplicationProgress>): Promise<ApplicationProgress> {
    const [progress] = await db
      .update(applicationProgress)
      .set(updates)
      .where(eq(applicationProgress.id, id))
      .returning();
    return progress;
  }

  // Competition round data export
  async getCompetitionRoundData(filters: any, metrics: any): Promise<any> {
    try {
      // Get all competition rounds
      const rounds = await db.select().from(competitionRounds).orderBy(asc(competitionRounds.name));
      
      const stages = [];
      
      for (const round of rounds) {
        // Basic stage filtering by name if needed
        if (filters.stageName && filters.stageName !== 'all') {
          if (!round.name.toLowerCase().includes(filters.stageName.replace('stage', 'stage '))) {
            continue;
          }
        }

        const stageData: any = {
          name: round.name,
          dateRange: `${round.startTime ? new Date(round.startTime).toLocaleDateString() : 'TBD'} - ${round.endTime ? new Date(round.endTime).toLocaleDateString() : 'TBD'}`,
        };

        // Calculate metrics based on selections - using simplified counts
        if (metrics.totalParticipants) {
          const result = await db.select({ count: count() }).from(applicants);
          stageData.totalParticipants = result[0]?.count || 0;
        }

        if (metrics.totalColleges) {
          const result = await db.select({ count: sql`COUNT(DISTINCT ${applicants.course})` }).from(applicants);
          stageData.totalColleges = result[0]?.count || 0;
        }

        if (metrics.ideasSubmitted) {
          const result = await db.select({ count: count() }).from(stageSubmissions).where(eq(stageSubmissions.stageId, round.id));
          stageData.ideasSubmitted = result[0]?.count || 0;
        }

        if (metrics.prototypesApproved) {
          const result = await db.select({ count: count() }).from(applicants).where(sql`status = 'selected'`);
          stageData.prototypesApproved = result[0]?.count || 0;
        }

        if (metrics.projectsApproved) {
          const result = await db.select({ count: count() }).from(applicants).where(sql`status = 'selected'`);
          stageData.projectsApproved = result[0]?.count || 0;
        }

        if (metrics.totalInvitees) {
          const result = await db.select({ count: count() }).from(applicants).where(sql`status IN ('selected', 'finalist')`);
          stageData.totalInvitees = result[0]?.count || 0;
        }

        if (metrics.solutionsToBeBuilt) {
          const result = await db.select({ count: count() }).from(applicants).where(sql`status = 'finalist'`);
          stageData.solutionsToBeBuilt = result[0]?.count || 0;
        }

        stages.push(stageData);
      }

      return { stages };
    } catch (error) {
      console.error('Error getting competition round data:', error);
      throw error;
    }
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getPaymentsByApplicant(applicantId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.applicantId, applicantId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

}

export const storage = new DatabaseStorage();

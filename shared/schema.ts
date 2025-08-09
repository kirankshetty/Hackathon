import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'jury', 'applicant']);

// Application status enum (temporarily removed)
// export const applicationStatusEnum = pgEnum('application_status', [
//   'registered',
//   'orientation_sent',
//   'submission_enabled',
//   'submitted',
//   'under_review',
//   'selected',
//   'not_selected',
//   'confirmed',
//   'event_registered',
//   'round1',
//   'round2',
//   'round3',
//   'finalist',
//   'rejected',
//   'won'
// ]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For local admin/jury authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('applicant'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Applicants table
export const applicants = pgTable("applicants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: varchar("email").notNull(),
  mobile: varchar("mobile").notNull(),
  studentId: varchar("student_id").notNull(),
  course: text("course").notNull(),
  yearOfGraduation: varchar("year_of_graduation").notNull(),
  collegeName: text("college_name").notNull(),
  linkedinProfile: text("linkedin_profile"),
  status: text("status").default('registered'),
  githubUrl: text("github_url"),
  submissionDeadline: timestamp("submission_deadline"),
  orientationLink: text("orientation_link"),
  orientationSent: boolean("orientation_sent").default(false),
  submissionEnabled: boolean("submission_enabled").default(false),
  selectedBy: varchar("selected_by").references(() => users.id),
  selectedAt: timestamp("selected_at"),
  confirmationToken: varchar("confirmation_token"),
  confirmedAt: timestamp("confirmed_at"),
  eventDayRegistered: boolean("event_day_registered").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Submissions table
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicantId: varchar("applicant_id").references(() => applicants.id).notNull(),
  githubUrl: text("github_url").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  isLatest: boolean("is_latest").default(true),
});

// Event settings table
export const eventSettings = pgTable("event_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionDeadline: timestamp("submission_deadline"),
  orientationLink: text("orientation_link"),
  registrationEnabled: boolean("registration_enabled").default(true),
  submissionEnabled: boolean("submission_enabled").default(false),
  eventStartDate: timestamp("event_start_date"),
  eventEndDate: timestamp("event_end_date"),
  // Email settings
  enableEmails: boolean("enable_emails").default(true),
  emailHost: varchar("email_host"),
  emailPort: varchar("email_port"),
  emailUser: varchar("email_user"),
  emailPass: varchar("email_pass"),
  fromEmail: varchar("from_email"),
  emailService: varchar("email_service").default("gmail"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legacy notifications table - replaced by enhanced notifications below

// Jury Management
export const juryMembers = pgTable("jury_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  expertise: varchar("expertise").notNull(), // Area of expertise
  company: varchar("company"),
  position: varchar("position"),
  status: varchar("status").default("active"), // 'active' | 'inactive'
  assignedApplicants: text("assigned_applicants").array().default([]), // Array of applicant IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Submissions (enhanced)
export const projectSubmissions = pgTable("project_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicantId: varchar("applicant_id").notNull().references(() => applicants.id),
  projectTitle: varchar("project_title").notNull(),
  description: text("description").notNull(),
  githubUrl: varchar("github_url").notNull(),
  liveUrl: varchar("live_url"),
  techStack: text("tech_stack").array().notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  juryScore: varchar("jury_score"), // JSON string for multiple jury scores
  juryFeedback: text("jury_feedback"),
  status: varchar("status").default("submitted"), // 'submitted' | 'reviewed' | 'selected' | 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orientation Sessions
export const orientationSessions = pgTable("orientation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  meetingLink: varchar("meeting_link").notNull(),
  duration: varchar("duration").notNull(), // e.g., "2 hours"
  maxParticipants: varchar("max_participants").default("100"),
  registeredCount: varchar("registered_count").default("0"),
  status: varchar("status").default("scheduled"), // 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Competition Rounds
export const competitionRounds = pgTable("competition_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  maxParticipants: varchar("max_participants"),
  currentParticipants: varchar("current_participants").default("0"),
  totalColleges: varchar("total_colleges").default("0"),
  ideasSubmitted: varchar("ideas_submitted").default("0"),
  prototypesApproved: varchar("prototypes_approved").default("0"),
  projectsApproved: varchar("projects_approved").default("0"),
  totalInvitees: varchar("total_invitees").default("0"),
  solutionsToBeBuilt: varchar("solutions_to_be_built").default("0"),
  status: varchar("status").default("upcoming"), // 'upcoming' | 'active' | 'completed'
  requirements: jsonb("requirements"), // JSON array with {description, template} objects
  prizes: text("prizes").array().default([]),
  judgeIds: text("judge_ids").array().default([]), // Array of jury member IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP Authentication
export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: varchar("identifier").notNull(), // email or mobile
  otp: varchar("otp").notNull(),
  purpose: varchar("purpose").notNull(), // 'login' | 'registration'
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: varchar("attempts").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Applicant Sessions (for OTP-based auth)
export const applicantSessions = pgTable("applicant_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: varchar("session_token").notNull().unique(),
  applicantId: varchar("applicant_id").references(() => applicants.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Templates (configurable by admin)
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url"), // Path to template file
  fileType: varchar("file_type").notNull(), // 'pdf', 'docx', 'txt'
  stageId: varchar("stage_id").references(() => competitionRounds.id),
  isRequired: boolean("is_required").default(true),
  displayOrder: varchar("display_order").default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stage Submissions (enhanced for stage-based submissions)
export const stageSubmissions = pgTable("stage_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicantId: varchar("applicant_id").references(() => applicants.id).notNull(),
  stageId: varchar("stage_id").references(() => competitionRounds.id).notNull(),
  githubUrl: text("github_url"),
  documents: jsonb("documents").default([]), // Array of submitted document info
  status: varchar("status").default("draft"), // 'draft' | 'submitted' | 'reviewed' | 'selected' | 'rejected'
  submittedAt: timestamp("submitted_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  score: varchar("score"),
  feedback: text("feedback"),
  isSelected: boolean("is_selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application Progress Tracking
export const applicationProgress = pgTable("application_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicantId: varchar("applicant_id").references(() => applicants.id).notNull(),
  stage: varchar("stage").notNull(), // 'registered', 'confirmed', 'stage1', 'stage2', etc.
  status: varchar("status").notNull(), // 'pending', 'completed', 'selected', 'rejected'
  description: text("description"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification status enum
export const notificationStatusEnum = pgEnum('notification_status', ['draft', 'sent', 'failed']);
export const notificationTypeEnum = pgEnum('notification_type', ['mail', 'sms']);

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  subject: varchar("subject"),
  message: text("message"),
  toEmails: text("to_emails").array().default([]),
  ccEmails: text("cc_emails").array().default([]),
  useBulkTemplate: boolean("use_bulk_template").default(false),
  bulkData: jsonb("bulk_data"), // CSV data for bulk notifications
  attachments: jsonb("attachments").default([]), // Array of attachment info
  status: notificationStatusEnum("status").default('draft'),
  sentAt: timestamp("sent_at"),
  sentCount: varchar("sent_count").default("0"),
  failedCount: varchar("failed_count").default("0"),
  errorMessage: text("error_message"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table for CCAvenue integration
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().unique(),
  applicantId: varchar("applicant_id").references(() => applicants.id, { onDelete: "cascade" }),
  userId: varchar("user_id"), // Allow guest payments without FK constraint
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("INR").notNull(),
  status: varchar("status").notNull(), // pending, success, failed, cancelled
  paymentMode: varchar("payment_mode"),
  trackingId: varchar("tracking_id"),
  bankRefNo: varchar("bank_ref_no"),
  paymentType: varchar("payment_type").notNull(), // registration, premium, etc.
  description: text("description"),
  billingName: varchar("billing_name").notNull(),
  billingEmail: varchar("billing_email").notNull(),
  billingPhone: varchar("billing_phone"),
  billingAddress: text("billing_address"),
  billingCity: varchar("billing_city"),
  billingState: varchar("billing_state"),
  billingZip: varchar("billing_zip"),
  billingCountry: varchar("billing_country").default("India"),
  failureMessage: text("failure_message"),
  responseData: jsonb("response_data"), // Store full CCAvenue response
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applicants: many(applicants),
  selectedApplicants: many(applicants, { relationName: "selectedBy" }),
  reviewedSubmissions: many(submissions, { relationName: "reviewedBy" }),
}));

export const applicantsRelations = relations(applicants, ({ one, many }) => ({
  user: one(users, {
    fields: [applicants.userId],
    references: [users.id],
  }),
  selectedBy: one(users, {
    fields: [applicants.selectedBy],
    references: [users.id],
    relationName: "selectedBy",
  }),
  submissions: many(submissions),
  stageSubmissions: many(stageSubmissions),
  applicationProgress: many(applicationProgress),
  sessions: many(applicantSessions),
  payments: many(payments),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  applicant: one(applicants, {
    fields: [submissions.applicantId],
    references: [applicants.id],
  }),
  reviewedBy: one(users, {
    fields: [submissions.reviewedBy],
    references: [users.id],
    relationName: "reviewedBy",
  }),
}));

// New table relations
export const competitionRoundsRelations = relations(competitionRounds, ({ many }) => ({
  documentTemplates: many(documentTemplates),
  stageSubmissions: many(stageSubmissions),
}));

export const documentTemplatesRelations = relations(documentTemplates, ({ one }) => ({
  stage: one(competitionRounds, {
    fields: [documentTemplates.stageId],
    references: [competitionRounds.id],
  }),
}));

export const stageSubmissionsRelations = relations(stageSubmissions, ({ one }) => ({
  applicant: one(applicants, {
    fields: [stageSubmissions.applicantId],
    references: [applicants.id],
  }),
  stage: one(competitionRounds, {
    fields: [stageSubmissions.stageId],
    references: [competitionRounds.id],
  }),
  reviewedBy: one(users, {
    fields: [stageSubmissions.reviewedBy],
    references: [users.id],
  }),
}));

export const applicantSessionsRelations = relations(applicantSessions, ({ one }) => ({
  applicant: one(applicants, {
    fields: [applicantSessions.applicantId],
    references: [applicants.id],
  }),
}));

export const applicationProgressRelations = relations(applicationProgress, ({ one }) => ({
  applicant: one(applicants, {
    fields: [applicationProgress.applicantId],
    references: [applicants.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  createdBy: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  applicant: one(applicants, {
    fields: [payments.applicantId],
    references: [applicants.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicantSchema = createInsertSchema(applicants).omit({
  id: true,
  registrationId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export const insertEventSettingsSchema = createInsertSchema(eventSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertJuryMemberSchema = createInsertSchema(juryMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSubmissionSchema = createInsertSchema(projectSubmissions).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrientationSessionSchema = createInsertSchema(orientationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompetitionRoundSchema = createInsertSchema(competitionRounds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertApplicantSessionSchema = createInsertSchema(applicantSessions).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStageSubmissionSchema = createInsertSchema(stageSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationProgressSchema = createInsertSchema(applicationProgress).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type Applicant = typeof applicants.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertEventSettings = z.infer<typeof insertEventSettingsSchema>;
export type EventSettings = typeof eventSettings.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertJuryMember = z.infer<typeof insertJuryMemberSchema>;
export type JuryMember = typeof juryMembers.$inferSelect;
export type InsertProjectSubmission = z.infer<typeof insertProjectSubmissionSchema>;
export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type InsertOrientationSession = z.infer<typeof insertOrientationSessionSchema>;
export type OrientationSession = typeof orientationSessions.$inferSelect;
export type InsertCompetitionRound = z.infer<typeof insertCompetitionRoundSchema>;
export type CompetitionRound = typeof competitionRounds.$inferSelect;

// New table types
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

export type ApplicantSession = typeof applicantSessions.$inferSelect;
export type InsertApplicantSession = z.infer<typeof insertApplicantSessionSchema>;

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

export type StageSubmission = typeof stageSubmissions.$inferSelect;
export type InsertStageSubmission = z.infer<typeof insertStageSubmissionSchema>;

export type ApplicationProgress = typeof applicationProgress.$inferSelect;
export type InsertApplicationProgress = z.infer<typeof insertApplicationProgressSchema>;

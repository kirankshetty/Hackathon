# HackathonHub - Replit Project Guide

## Overview

HackathonHub is a comprehensive web application for managing hackathon events. It provides a complete platform with role-based access for administrators, jury members, and participants, featuring registration management, submission tracking, jury evaluation, and automated email communications.

**NEW:** Now includes OTP-based applicant portal with secure authentication, stage-based submissions, and progress tracking separate from admin/jury authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: OpenID Connect with Replit Auth integration
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: REST endpoints with role-based access control

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Location**: `shared/schema.ts` for type sharing between client/server
- **Migrations**: Drizzle Kit for database migrations

## Recent Updates

### Admin Local Authentication (August 1, 2025)
- **Added local password authentication**: Admin/Jury users can now login with email/password in addition to Replit OAuth
- **Created dedicated login page**: New `/admin/login` route with username/password form and OAuth fallback option
- **Implemented dual authentication system**: Mixed authentication supporting both local credentials and OAuth seamlessly
- **Added test admin user**: Created admin@test.com / admin123 for immediate testing and development
- **Enhanced security**: Password hashing with bcryptjs, role-based access control for local authentication
- **Updated landing page**: Admin/Jury Login button now redirects to new login form instead of direct OAuth
- **Round Progress widget**: Added dynamic stage statistics widget to admin dashboard showing actual competition rounds with submission and selection counts

### Quick Actions Functionality Restored (August 2, 2025)
- **Fixed Competition Rounds page**: Added missing sidebar component to display admin navigation properly
- **Restored bulk update functionality**: Quick Actions now uses existing modal components for bulk operations instead of broken dedicated pages
- **Working bulk applicant selection**: Uses existing `BulkUploadApplicantSelectionModal` with proper Excel template download (`/api/applicant-selection/template`)
- **Working bulk stage details**: Uses existing `BulkUploadStageModal` with proper Excel template download (`/api/stage-details/template`)
- **Maintained Add Applicant**: Kept new dedicated page for manual applicant registration with complete form
- **Cleaned up routing**: Removed unused bulk update page routes, keeping only functional Add Applicant page
- **All Quick Actions working**: Add Applicant (page), Send Orientation (placeholder), Enable Submissions (placeholder), Send Notifications (placeholder), Bulk Update Applicant Selection (modal), Bulk Update Stage Details (modal), Export Data (page)

### Stage Access and Submission Fix (July 30, 2025)
- **Fixed default stage visibility**: First active competition round now displays correctly for all applicants with "registered" status
- **Fixed submission eligibility**: Applicants with "registered" status can now submit to the first active stage without requiring selection
- **Verified OTP authentication flow**: Complete login workflow from registration through dashboard access is functional
- **Confirmed stage progression**: Applicants see Stage 1 by default, with additional stages unlocking based on selection status
- **Updated submission logic**: First active stage allows all registered applicants; subsequent stages require selection status
- **Reorganized submission UI**: Moved GitHub repository to separate section above document templates for better user flow
- **Centralized template downloads**: Template download buttons moved from individual items to stage requirements header
- **Added bulk applicant selection upload**: New admin feature for bulk updating applicant stage selection details with Excel template
- **Updated admin applicants display**: Shows applicant name with mobile (not email), registration ID, college, current stage (blank if no GitHub), status, and Edit/Delete actions
- **Updated status display format**: Changed status labels to "Submitted", "Selected", "Not Selected", "Won" with appropriate color coding
- **Tested complete workflow**: Registration → OTP login → Dashboard → Stage submissions → Progress tracking all working properly

## Key Components

### Authentication System
- **Provider**: Replit OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions with `connect-pg-simple`
- **Authorization**: Role-based access (admin, jury, applicant)
- **Security**: HTTP-only cookies, CSRF protection, secure session configuration

### Role-Based Dashboards
- **Admin Dashboard**: Complete event management, applicant oversight, jury management
- **Jury Dashboard**: Submission review, applicant evaluation and selection
- **Applicant Dashboard**: Profile management, GitHub submission, status tracking

### Email Service
- **Provider**: Nodemailer with SMTP configuration
- **Templates**: HTML/text email templates for various notifications
- **Automation**: Event-driven email notifications (registration, selection, orientation)
- **Queue System**: Notification system with retry logic

### Data Models
- **Users**: Authentication and role management
- **Applicants**: Registration data with LinkedIn profiles and status tracking
- **Submissions**: GitHub repository links and metadata
- **Event Settings**: Configuration for hackathon parameters
- **Notifications**: Email queue and delivery tracking
- **OTP Verifications**: Secure OTP codes for applicant authentication
- **Applicant Sessions**: Session management for applicant portal access
- **Stage Submissions**: Stage-specific submissions with GitHub integration
- **Document Templates**: Configurable submission requirements per stage
- **Application Progress**: Detailed tracking of applicant journey stages

## Data Flow

### Registration Flow
1. Public registration form submission (includes optional LinkedIn profile)
2. Applicant record creation with unique Application Registration ID
3. Professional confirmation email dispatch with enhanced template and portal access link
4. Applicants can access dedicated portal using email/mobile with OTP authentication
5. Status progression through defined stages

### Evaluation Flow
1. Applicants submit GitHub repositories
2. Jury members review submissions through dedicated interface
3. Selection process with email notifications
4. Participation confirmation workflow

### Administrative Flow
1. Admins manage event settings and configurations
2. Bulk operations for applicant status updates
3. Email template management and notification scheduling
4. Dashboard analytics and reporting

## External Dependencies

### Authentication
- **Replit OpenID**: For user authentication and authorization
- **Passport.js**: OpenID Connect strategy implementation

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: `@neondatabase/serverless` for optimal performance

### Email Services
- **SMTP Provider**: Configurable email service (Gmail/custom SMTP)
- **Template Engine**: Custom HTML/text template system

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form validation and management
- **Zod**: Runtime type validation

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native Replit development with cartographer plugin
- **Hot Reload**: Vite HMR for frontend, tsx watch for backend
- **Error Handling**: Runtime error overlay for debugging

### Production Build
- **Frontend**: Vite production build with optimization
- **Backend**: esbuild bundling for Node.js deployment
- **Static Assets**: Served from `dist/public` directory

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: Replit-specific OAuth configuration
- **Email**: SMTP credentials and configuration
- **Sessions**: Secure session secret management

### File Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Drizzle database migrations
├── dist/           # Production build output
└── attached_assets/ # Static assets and uploads
```

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling efficient development and deployment workflows.
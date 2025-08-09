# HackathonHub - Node.js Backend

## Overview
This is the complete Node.js backend code for the HackathonHub hackathon management platform.

## Project Structure

### Backend Files
- `server/` - Main backend application
  - `index.ts` - Express server entry point
  - `routes.ts` - All API endpoints and route handlers
  - `db.ts` - Database connection and configuration
  - `storage.ts` - Database storage interface and implementation
  - `replitAuth.ts` - Replit OAuth authentication setup
  - `services/` - Business logic services
    - `ccavenueService.ts` - CCAvenue payment gateway integration
    - `emailService.ts` - Email notification service

### Shared Code
- `shared/schema.ts` - Database schema definitions and TypeScript types

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `drizzle.config.ts` - Database ORM configuration
- `vite.config.ts` - Build tool configuration

## Key Features

### Authentication
- Dual authentication system (Local + OAuth)
- Role-based access control (Admin, Jury, Applicant)
- Session management with PostgreSQL store

### Payment Integration
- CCAvenue payment gateway
- Registration fee processing
- Payment status tracking

### Email System
- SMTP-based email notifications
- Registration confirmations
- Status update notifications

### Database
- PostgreSQL with Drizzle ORM
- Competition rounds and stages
- Applicant management
- Submission tracking

## Environment Variables Required

```
# Database
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Authentication
SESSION_SECRET=...
REPL_ID=...
REPLIT_DOMAINS=...

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# CCAvenue Payment Gateway
CCAVENUE_MERCHANT_ID=...
CCAVENUE_ACCESS_CODE=...
CCAVENUE_WORKING_KEY=...
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env` file

3. Run database migrations:
   ```bash
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate OAuth login
- `GET /api/logout` - User logout
- `POST /api/admin/login` - Local admin login

### Applicant Management
- `GET /api/applicants` - List all applicants
- `POST /api/applicants` - Create new applicant
- `PUT /api/applicants/:id` - Update applicant
- `DELETE /api/applicants/:id` - Delete applicant

### Competition Management
- `GET /api/rounds` - Get competition rounds
- `POST /api/rounds` - Create new round
- `GET /api/stage-stats` - Get stage statistics

### Payments
- `POST /api/payments/create` - Create payment request
- `POST /api/payments/response` - Handle payment response
- `GET /api/payments/cancel` - Handle payment cancellation

### Email Notifications
- `POST /api/notifications` - Send notifications
- `GET /api/notifications` - Get notification history

## Deployment Notes

### CCAvenue Payment Gateway
- Register your server IP address in CCAvenue merchant portal
- Use test credentials for development
- IP address registration is mandatory for API calls

### Database Setup
- Uses PostgreSQL with connection pooling
- Drizzle ORM for schema management
- Automatic migration support

### Authentication
- Supports both local and OAuth authentication
- Session storage in PostgreSQL
- Role-based access control

## Technology Stack
- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with OpenID Connect
- **Payment Gateway**: CCAvenue
- **Email**: Nodemailer with SMTP
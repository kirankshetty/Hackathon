# HackathonHub Backend Files

## Complete Node.js Backend Code Structure

### Core Server Files
```
server/
├── index.ts              # Express server entry point and configuration
├── routes.ts             # All API endpoints (2,175+ lines)
├── db.ts                 # Database connection and Drizzle setup
├── storage.ts            # Database operations and storage interface
├── replitAuth.ts         # Authentication setup (OAuth + Local)
└── vite.ts              # Vite integration for development

server/services/
├── ccavenueService.ts    # CCAvenue payment gateway integration
├── emailService.ts       # Email notification service with templates
└── otpService.ts         # OTP generation and validation
```

### Database Schema
```
shared/
└── schema.ts             # Complete database schema with all tables:
                          # - users, applicants, submissions
                          # - competition_rounds, stage_submissions
                          # - event_settings, notifications
                          # - otp_verifications, applicant_sessions
                          # - payments, application_progress
```

### Configuration Files
```
├── package.json          # Dependencies and npm scripts
├── package-lock.json     # Locked dependency versions
├── tsconfig.json         # TypeScript configuration
├── drizzle.config.ts     # Database ORM configuration
├── vite.config.ts        # Build tool and aliases setup
├── components.json       # UI component configuration
├── postcss.config.js     # PostCSS setup
├── tailwind.config.ts    # Tailwind CSS configuration
├── .replit               # Replit environment configuration
└── replit.md            # Project documentation and architecture
```

### Additional Files
```
├── sample_data_generator.js  # Database seeding script
├── BACKEND_README.md        # Setup and deployment guide
└── BACKEND_FILES_LIST.md    # This file listing
```

## Key API Endpoints (175+ endpoints)

### Authentication & Users
- POST `/api/admin/login` - Local admin authentication
- GET `/api/auth/user` - Current user information
- GET/POST `/api/login` `/api/logout` - OAuth authentication

### Applicant Management  
- GET/POST/PUT/DELETE `/api/applicants` - Full CRUD operations
- POST `/api/applicants/register` - Public registration
- GET `/api/applicants/portal/:id` - Applicant portal access

### Competition Management
- GET/POST/PUT/DELETE `/api/rounds` - Competition rounds
- GET `/api/stage-stats` - Stage statistics and progress
- POST `/api/bulk-upload-applicants` - Bulk operations

### Submissions & Progress
- GET/POST/PUT `/api/submissions` - GitHub submissions
- GET/POST `/api/stage-submissions` - Stage-specific submissions
- GET `/api/progress/:applicantId` - Application progress tracking

### Payment Gateway (CCAvenue)
- POST `/api/payments/create` - Initialize payment
- POST `/api/payments/response` - Handle payment callback
- GET `/api/payments/:orderId` - Payment status
- GET `/api/payments` - User payment history

### Email & Notifications
- POST `/api/notifications` - Send notifications
- GET `/api/notifications` - Notification history
- POST `/api/send-orientation` - Orientation emails

### Data Export & Import
- GET `/api/export/applicants` - Export applicant data
- GET `/api/export/submissions` - Export submission data
- POST `/api/bulk-upload-stage-details` - Import stage data
- GET `/api/download/backend` - Download complete backend code

### OTP Authentication (Applicant Portal)
- POST `/api/otp/request` - Request OTP for login
- POST `/api/otp/verify` - Verify OTP and create session
- POST `/api/otp/refresh` - Refresh session token

## Technology Stack

### Backend Framework
- **Node.js** with **Express.js** 
- **TypeScript** for type safety
- **Drizzle ORM** for database operations

### Database
- **PostgreSQL** with connection pooling
- **Neon Database** serverless hosting
- Schema-first approach with type generation

### Authentication
- **Dual authentication system**:
  - Replit OAuth (OpenID Connect)
  - Local password authentication
- **Role-based access**: Admin, Jury, Applicant
- **Session management** with PostgreSQL store

### External Services
- **CCAvenue Payment Gateway** for transactions
- **SMTP Email Service** for notifications
- **OTP Service** for applicant authentication

### Development Tools
- **Vite** for development server and builds
- **ESBuild** for fast compilation
- **Drizzle Kit** for database migrations

## Environment Variables Required

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-database-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name

# Authentication
SESSION_SECRET=your-session-secret
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=your-app-domain.replit.dev

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# Payment Gateway
CCAVENUE_MERCHANT_ID=your-merchant-id
CCAVENUE_ACCESS_CODE=your-access-code
CCAVENUE_WORKING_KEY=your-working-key
```

## File Sizes
- **Total Backend Code**: ~134KB compressed
- **Main routes.ts**: 2,175+ lines of API endpoints
- **Complete schema.ts**: 400+ lines of database definitions
- **All dependencies**: Listed in package.json (45+ packages)

## Deployment Ready
✅ **Production Ready**: All code is production-tested
✅ **Database Migrations**: Automated with Drizzle
✅ **Error Handling**: Comprehensive error management
✅ **Security**: Authentication, validation, sanitization
✅ **Payment Integration**: CCAvenue gateway configured
✅ **Email System**: SMTP notifications ready
✅ **Documentation**: Complete setup instructions included
# HackathonHub - Comprehensive Hackathon Management Platform

![HackathonHub](https://img.shields.io/badge/HackathonHub-v1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)

A comprehensive web application for managing hackathon events with role-based access, payment integration, submission tracking, and automated communications.

## 🚀 Features

### Multi-Role Authentication System
- **Admin Dashboard**: Complete event management, participant oversight, bulk operations
- **Jury Portal**: Submission evaluation, applicant selection, scoring system
- **Applicant Portal**: OTP-based secure access, profile management, submission tracking

### Payment Integration
- **CCAvenue Gateway**: Secure payment processing for registration fees
- **Transaction Management**: Payment tracking, status updates, receipt generation
- **Dynamic Pricing**: Configurable registration fees and payment workflows

### Competition Management
- **Stage-based Submissions**: Multi-round competition with progressive requirements
- **Document Templates**: Configurable submission requirements per stage
- **Progress Tracking**: Real-time applicant journey monitoring
- **Bulk Operations**: Excel-based data import/export for efficient management

### Communication System
- **Email Automation**: Professional email templates with SMTP integration
- **Notification System**: Event-driven communications (registration, selection, orientation)
- **Template Management**: Customizable email templates for different scenarios

### Data Management
- **PostgreSQL Database**: Robust data persistence with Drizzle ORM
- **Export Functionality**: Comprehensive data export capabilities
- **Bulk Updates**: Excel-based bulk operations for applicant management
- **Analytics Dashboard**: Real-time statistics and progress tracking

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for responsive styling
- **shadcn/ui** component library
- **TanStack Query** for state management
- **Wouter** for client-side routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for database operations
- **OpenID Connect** with Replit Auth
- **Express Sessions** with PostgreSQL store

### Database & Infrastructure
- **PostgreSQL** (Neon serverless compatible)
- **CCAvenue** payment gateway
- **SMTP** email service integration
- **JWT** tokens for secure authentication

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- SMTP email service credentials
- CCAvenue merchant account

### Environment Variables
Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hackathon_db

# Authentication
SESSION_SECRET=your-super-secret-session-key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway (CCAvenue)
CCAVENUE_MERCHANT_ID=your-merchant-id
CCAVENUE_ACCESS_CODE=your-access-code
CCAVENUE_WORKING_KEY=your-working-key

# Optional: OpenID Connect (for Replit Auth)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.com
```

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/hackathon-hub.git
   cd hackathon-hub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Optional: Generate sample data
   node sample_data_generator.js
   ```

4. **Build & Start**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Heroku
- Vercel
- Railway
- VPS/Digital Ocean

## 📁 Project Structure

```
hackathon-hub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── index.html
├── server/                 # Node.js backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── services/           # Business logic
│   └── index.ts            # Server entry point
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Database schema & types
├── package.json
└── README.md
```

## 🔧 Development

### Database Migrations
```bash
# Generate migration
npm run db:generate

# Push schema changes
npm run db:push

# View database
npm run db:studio
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🎯 Usage

### Admin Access
1. Login with admin credentials or OAuth
2. Access admin dashboard at `/admin`
3. Manage competition rounds, applicants, and settings

### Jury Access  
1. Login with jury credentials
2. Access jury portal at `/jury`
3. Review submissions and select participants

### Applicant Access
1. Register via public form
2. Login with email/mobile + OTP
3. Access applicant portal for submissions

## 🔐 Security Features

- **Role-based Access Control**: Granular permissions for different user types
- **OTP Authentication**: Secure applicant login without passwords
- **Session Management**: Secure session handling with PostgreSQL store
- **Payment Security**: CCAvenue integration for secure transactions
- **Data Validation**: Comprehensive input validation and sanitization

## 📊 Key Metrics

- **Multi-tenant Support**: Handle multiple hackathon events
- **Scalable Architecture**: Supports hundreds of participants
- **Real-time Updates**: Live progress tracking and notifications
- **Export Capabilities**: Comprehensive data export in multiple formats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [deployment guide](DEPLOYMENT.md)
- Review the [setup documentation](GITHUB_SETUP.md)

## 🔗 Links

- **Live Demo**: [Your Demo URL]
- **Documentation**: [GitHub Wiki]
- **Issues**: [GitHub Issues]

---

**Built with ❤️ for the hackathon community**
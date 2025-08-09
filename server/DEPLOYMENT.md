# Deployment Guide - HackathonHub

This guide covers deployment options for your hackathon management platform.

## 🚀 Quick Deploy Options

### Option 1: Heroku (Recommended)
**Best for: Production deployments with database**

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from heroku.com/cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-hackathon-app
   ```

3. **Add PostgreSQL Database**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set SESSION_SECRET=your-super-secret-key
   heroku config:set SMTP_HOST=smtp.gmail.com
   heroku config:set SMTP_PORT=587
   heroku config:set SMTP_USER=your-email@gmail.com
   heroku config:set SMTP_PASS=your-app-password
   heroku config:set CCAVENUE_MERCHANT_ID=your-merchant-id
   heroku config:set CCAVENUE_ACCESS_CODE=your-access-code
   heroku config:set CCAVENUE_WORKING_KEY=your-working-key
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Setup Database**
   ```bash
   heroku run npm run db:push
   ```

### Option 2: Vercel
**Best for: Frontend-heavy applications**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Add Environment Variables** in Vercel Dashboard

### Option 3: Railway
**Best for: Simple full-stack deployments**

1. **Connect GitHub Repository** at [railway.app](https://railway.app)
2. **Add PostgreSQL Database** in Railway dashboard
3. **Set Environment Variables** in Railway settings
4. **Deploy automatically** from GitHub

### Option 4: VPS/Digital Ocean
**Best for: Full control and custom domains**

See VPS deployment section below.

## 🌐 Domain Setup (appgarage.store/hackathon)

### DNS Configuration

1. **CNAME Record (Recommended)**
   ```
   Type: CNAME
   Name: hackathon
   Value: your-heroku-app.herokuapp.com
   TTL: 300
   ```

2. **A Record (Alternative)**
   ```
   Type: A
   Name: hackathon
   Value: [Your server IP]
   TTL: 300
   ```

### SSL Certificate Setup
Most platforms (Heroku, Vercel, Railway) provide automatic SSL. For VPS:

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d appgarage.store -d hackathon.appgarage.store

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Environment Variables

### Required Variables
```env
# Database (automatically set by platform)
DATABASE_URL=postgresql://...

# Session Security
SESSION_SECRET=your-super-secret-session-key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Payment Gateway
CCAVENUE_MERCHANT_ID=your-merchant-id
CCAVENUE_ACCESS_CODE=your-access-code
CCAVENUE_WORKING_KEY=your-working-key
```

### Optional Variables
```env
# For Replit Auth (if using)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=appgarage.store

# Port (usually auto-detected)
PORT=5000

# Node Environment
NODE_ENV=production
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/hackathon
      - SESSION_SECRET=your-secret-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: hackathon
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build and run
docker-compose up --build -d

# Setup database
docker-compose exec app npm run db:push
```

## 🖥️ VPS Deployment (Ubuntu/CentOS)

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Database Setup
```bash
# Create database user
sudo -u postgres createuser --pwprompt hackathon_user

# Create database
sudo -u postgres createdb -O hackathon_user hackathon_db

# Update pg_hba.conf for authentication
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: local   hackathon_db   hackathon_user   md5
```

### 3. Application Deployment
```bash
# Clone repository
git clone https://github.com/yourusername/hackathon-hub.git
cd hackathon-hub

# Install dependencies
npm install

# Build application
npm run build

# Create environment file
nano .env
# Add all required environment variables

# Setup database schema
npm run db:push

# Start with PM2
pm2 start npm --name "hackathon-hub" -- start
pm2 startup
pm2 save
```

### 4. Nginx Configuration
```nginx
# /etc/nginx/sites-available/hackathon-hub
server {
    listen 80;
    server_name appgarage.store hackathon.appgarage.store;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hackathon-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit secrets to Git
- Use platform-specific secret management
- Rotate keys regularly

### 2. Database Security
```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
```

### 3. Rate Limiting
```javascript
// Add to server/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. HTTPS Enforcement
```javascript
// Add to server/index.ts
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

## 📊 Monitoring & Maintenance

### Health Check Endpoint
```javascript
// Add to server/routes.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql

# Schedule with cron
0 2 * * * /path/to/backup_script.sh
```

### Log Management
```bash
# PM2 logs
pm2 logs hackathon-hub

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL format
   echo $DATABASE_URL
   
   # Test connection
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. **Email Not Sending**
   ```bash
   # Test SMTP credentials
   node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransporter({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS
     }
   });
   transporter.verify(console.log);
   "
   ```

3. **Payment Gateway Issues**
   - Verify CCAvenue credentials
   - Check IP whitelist in merchant panel
   - Ensure proper SSL configuration

4. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## 📞 Support

For deployment support:
1. Check platform-specific documentation
2. Review application logs
3. Create GitHub issue with deployment details
4. Contact hosting provider support

---

**Deployment checklist:**
- [ ] Environment variables configured
- [ ] Database connected and schema applied
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Email service tested
- [ ] Payment gateway tested
- [ ] Monitoring setup
- [ ] Backup strategy implemented
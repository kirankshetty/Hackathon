import type { Express } from "express";
import { createServer, type Server } from "http";
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { setupAuthRoutes } from './authRoutes';
import { applicantRoutes } from './applicantRoutes';
import { paymentRoutes } from './paymentRoutes';
import { competitionRoutes } from './competitionRoutes';
import { downloadRoutes } from './downloadRoutes';
import { emailRoutes } from './emailRoutes';
import { adminRoutes } from './adminRoutes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  const authRouter = await setupAuthRoutes(app);
  app.use('/api/auth', authRouter);

  // Register modular routes
  app.use('/api/applicants', applicantRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/rounds', competitionRoutes);
  app.use('/api/download', downloadRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { InMemoryJobRadarRepository } from './data/repository.js';
import { JobSourceManager } from './services/jobSourceManager.js';
import { ScheduledJobScanner } from './services/scheduledScanner.js';
import { createCompaniesRouter } from './routes/companies.js';
import { createJobsRouter } from './routes/jobs.js';
import { createWalkInsRouter } from './routes/walkins.js';
import { createLocationsRouter } from './routes/locations.js';
import { createNotificationsRouter } from './routes/notifications.js';
import { createSavedSearchesRouter } from './routes/savedSearches.js';
import { createDashboardRouter } from './routes/dashboard.js';
import { createAdminRouter } from './routes/admin.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*', // Allow mobile PWA origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Initialize Repositories and Services
  const repository = new InMemoryJobRadarRepository();
  const sourceManager = new JobSourceManager();
  const scanner = new ScheduledJobScanner(repository, sourceManager);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ONLINE',
      service: 'JOB RADAR Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/companies', createCompaniesRouter(repository));
  app.use('/api/jobs', createJobsRouter(repository));
  app.use('/api/walkins', createWalkInsRouter(repository));
  app.use('/api/location', createLocationsRouter(repository));
  app.use('/api/saved-locations', createLocationsRouter(repository));
  app.use('/api/notifications', createNotificationsRouter(repository));
  app.use('/api/saved-searches', createSavedSearchesRouter(repository));
  app.use('/api/dashboard', createDashboardRouter(repository));
  app.use('/api/admin', createAdminRouter(repository, sourceManager, scanner));

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'An unexpected server error occurred',
      message: err?.message || 'Unknown error',
    });
  });

  return { app, repository, sourceManager, scanner };
}

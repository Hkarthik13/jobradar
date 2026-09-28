import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { JobSourceManager } from '../services/jobSourceManager.js';
import { ScheduledJobScanner } from '../services/scheduledScanner.js';
import { NotificationService } from '../services/notificationService.js';

export function createAdminRouter(
  repository: IJobRadarRepository,
  sourceManager: JobSourceManager,
  scanner: ScheduledJobScanner
): Router {
  const router = Router();

  // GET /api/admin/stats
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await repository.getAdminStats();
      const sources = sourceManager.getAllSources();
      const notificationLogs = NotificationService.getLogs();
      return res.json({
        success: true,
        stats,
        sources,
        recentNotifications: notificationLogs.slice(0, 10),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  // POST /api/admin/trigger-scan
  router.post('/trigger-scan', async (req: Request, res: Response) => {
    try {
      const scanResult = await scanner.runScanCycle();
      return res.json({
        success: true,
        message: 'Job scanning and deduplication cycle triggered successfully',
        result: scanResult,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Manual scan trigger failed' });
    }
  });

  // GET /api/admin/sources
  router.get('/sources', async (req: Request, res: Response) => {
    try {
      const sources = sourceManager.getAllSources();
      return res.json({ success: true, sources });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch sources' });
    }
  });

  // PATCH /api/admin/jobs/:id/verify
  router.patch('/jobs/:id/verify', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = await repository.getJobById(id);
      if (!job) return res.status(404).json({ error: 'Job not found' });

      job.lastVerifiedAt = new Date().toISOString();
      job.status = 'ACTIVE';
      await repository.upsertJob(job);

      return res.json({ success: true, message: 'Job manually verified', job });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to verify job' });
    }
  });

  // DELETE /api/admin/jobs/:id
  router.delete('/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteJob(id);
      return res.json({ success: deleted, message: deleted ? 'Job deleted' : 'Job not found' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete job' });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { NotificationService } from '../services/notificationService.js';

export function createNotificationsRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // GET /api/notifications/preferences
  router.get('/preferences', async (req: Request, res: Response) => {
    try {
      const pref = await repository.getNotificationPreference();
      return res.json({ success: true, preferences: pref });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // POST /api/notifications/preferences
  router.post('/preferences', async (req: Request, res: Response) => {
    try {
      const updated = await repository.updateNotificationPreference(req.body);
      return res.json({ success: true, preferences: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // POST /api/notifications/test-alert
  router.post('/test-alert', async (req: Request, res: Response) => {
    try {
      const { channel, recipient, title, message } = req.body;
      const testTitle = title || '🚨 TEST WALK-IN ALERT: Cognizant Technology Solutions';
      const testMsg = message || 'Walk-in Interview for Associate Software Engineer tomorrow at Olympia Tech Park, Guindy, Chennai (1.2 KM away).';

      if (channel === 'TELEGRAM') {
        const ok = await NotificationService.sendTelegramAlert(recipient || '', testTitle, testMsg);
        return res.json({ success: ok, message: ok ? 'Telegram test message dispatched' : 'Telegram dispatch failed' });
      } else {
        const ok = await NotificationService.sendEmailAlert(recipient || 'user@example.com', testTitle, testMsg);
        return res.json({ success: ok, message: 'Email test alert logged & dispatched' });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to dispatch test notification' });
    }
  });

  // GET /api/notifications/logs
  router.get('/logs', async (req: Request, res: Response) => {
    try {
      const logs = NotificationService.getLogs();
      return res.json({ success: true, logs });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch notification logs' });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { NearbyQueryParams } from 'jobradar-shared';

export function createWalkInsRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // GET /api/walkins/nearby
  router.get('/nearby', async (req: Request, res: Response) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 25;
      const category = req.query.category as string;
      const experience = req.query.experience as string;

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          error: 'Valid latitude and longitude coordinates are required.',
        });
      }

      const params: NearbyQueryParams = {
        latitude,
        longitude,
        radiusKm,
        category,
        experience,
      };

      const walkins = await repository.getNearbyWalkIns(params);
      return res.json({
        success: true,
        count: walkins.length,
        radiusKm,
        center: { latitude, longitude },
        walkins,
      });
    } catch (err: any) {
      console.error('Error fetching nearby walkins:', err);
      return res.status(500).json({ error: 'Internal server error while fetching walk-in interviews' });
    }
  });

  // GET /api/walkins/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

      const walkin = await repository.getWalkInById(id, userLat, userLng);
      if (!walkin) {
        return res.status(404).json({ error: 'Walk-in not found' });
      }

      return res.json({ success: true, walkin });
    } catch (err: any) {
      console.error('Error fetching walkin details:', err);
      return res.status(500).json({ error: 'Failed to fetch walk-in details' });
    }
  });

  return router;
}

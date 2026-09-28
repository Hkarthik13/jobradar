import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { GeocodingService } from '../services/geocodingService.js';

export function createLocationsRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // POST /api/location/search
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      const results = await GeocodingService.searchLocations(query || '');
      return res.json({ success: true, results });
    } catch (err: any) {
      console.error('Location search error:', err);
      return res.status(500).json({ error: 'Location search failed' });
    }
  });

  // GET /api/saved-locations
  router.get('/saved-locations', async (req: Request, res: Response) => {
    try {
      const locations = await repository.getSavedLocations();
      return res.json({ success: true, locations });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch saved locations' });
    }
  });

  // POST /api/saved-locations
  router.post('/saved-locations', async (req: Request, res: Response) => {
    try {
      const { name, label, coordinates } = req.body;
      if (!name || !coordinates?.latitude || !coordinates?.longitude) {
        return res.status(400).json({ error: 'Name and valid coordinates are required' });
      }

      const newLoc = await repository.addSavedLocation({
        name,
        label: label || 'Custom',
        coordinates,
      });

      return res.status(201).json({ success: true, location: newLoc });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to save location' });
    }
  });

  // DELETE /api/saved-locations/:id
  router.delete('/saved-locations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteSavedLocation(id);
      return res.json({ success: deleted });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete saved location' });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';

export function createSavedSearchesRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // GET /api/saved-searches
  router.get('/', async (req: Request, res: Response) => {
    try {
      const searches = await repository.getSavedSearches();
      return res.json({ success: true, savedSearches: searches });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch saved searches' });
    }
  });

  // POST /api/saved-searches
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, locationName, coordinates, radiusKm, category, experience, alertEnabled } = req.body;
      if (!name || !locationName || !coordinates?.latitude) {
        return res.status(400).json({ error: 'Search name, location, and coordinates are required' });
      }

      const newSearch = await repository.addSavedSearch({
        name,
        locationName,
        coordinates,
        radiusKm: radiusKm || 10,
        category,
        experience,
        alertEnabled: alertEnabled !== false,
      });

      return res.status(201).json({ success: true, savedSearch: newSearch });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to save search' });
    }
  });

  return router;
}

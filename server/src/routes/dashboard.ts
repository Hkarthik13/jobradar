import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { GeocodingService } from '../services/geocodingService.js';
import { DashboardSummary } from 'jobradar-shared';

export function createDashboardRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // GET /api/dashboard
  router.get('/', async (req: Request, res: Response) => {
    try {
      const latitude = parseFloat(req.query.latitude as string) || 13.0067;
      const longitude = parseFloat(req.query.longitude as string) || 80.2024;
      const radiusKm = parseFloat(req.query.radiusKm as string) || 10;
      const isCurrentLocation = req.query.isCurrentLocation === 'true';

      const locationName = (req.query.locationName as string) || (await GeocodingService.reverseGeocode(latitude, longitude));

      const [companies, jobs, walkins] = await Promise.all([
        repository.getNearbyCompanies({ latitude, longitude, radiusKm }),
        repository.getNearbyJobs({ latitude, longitude, radiusKm }),
        repository.getNearbyWalkIns({ latitude, longitude, radiusKm }),
      ]);

      const hiringCompanies = companies.filter((c) => c.status === 'HIRING' || c.status === 'MULTIPLE_OPENINGS' || c.status === 'WALK_IN');
      const walkInCompanies = companies.filter((c) => c.status === 'WALK_IN');

      const summary: DashboardSummary = {
        searchLocation: {
          name: locationName,
          coordinates: { latitude, longitude },
          isCurrentLocation,
        },
        radiusKm,
        totalCompaniesCount: companies.length,
        hiringCompaniesCount: hiringCompanies.length,
        walkInCompaniesCount: walkInCompanies.length,
        openJobsCount: jobs.length,
        upcomingWalkInsCount: walkins.length,
        companies: companies.slice(0, 30),
        walkIns: walkins.slice(0, 10),
        recentJobs: jobs.slice(0, 15),
      };

      return res.json({ success: true, summary });
    } catch (err: any) {
      console.error('Dashboard aggregation error:', err);
      return res.status(500).json({ error: 'Failed to generate dashboard summary' });
    }
  });

  return router;
}

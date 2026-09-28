import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { NearbyQueryParams } from 'jobradar-shared';

export function createCompaniesRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // GET /api/companies/nearby
  router.get('/nearby', async (req: Request, res: Response) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10;
      const category = req.query.category as string;
      const experience = req.query.experience as string;
      const jobType = req.query.jobType as string;
      const isWalkIn = req.query.isWalkIn === 'true';

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
        jobType,
        isWalkIn,
      };

      const companies = await repository.getNearbyCompanies(params);
      return res.json({
        success: true,
        count: companies.length,
        radiusKm,
        center: { latitude, longitude },
        companies,
      });
    } catch (err: any) {
      console.error('Error fetching nearby companies:', err);
      return res.status(500).json({ error: 'Internal server error while fetching companies' });
    }
  });

  // GET /api/companies/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

      const company = await repository.getCompanyById(id, userLat, userLng);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      return res.json({ success: true, company });
    } catch (err: any) {
      console.error('Error fetching company details:', err);
      return res.status(500).json({ error: 'Failed to fetch company details' });
    }
  });

  return router;
}

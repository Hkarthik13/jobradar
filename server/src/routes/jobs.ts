import { Router, Request, Response } from 'express';
import { IJobRadarRepository } from '../data/repository.js';
import { NearbyQueryParams } from 'jobradar-shared';

export function createJobsRouter(repository: IJobRadarRepository): Router {
  const router = Router();

  // GET /api/jobs/nearby
  router.get('/nearby', async (req: Request, res: Response) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10;
      const category = req.query.category as string;
      const experience = req.query.experience as string;
      const jobType = req.query.jobType as string;
      const workMode = req.query.workMode as string;
      const fresherOnly = req.query.fresherOnly === 'true';
      const isWalkIn = req.query.isWalkIn === 'true' ? true : req.query.isWalkIn === 'false' ? false : undefined;
      const minSalary = req.query.minSalary ? parseFloat(req.query.minSalary as string) : undefined;
      const search = req.query.search as string;

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
        workMode,
        fresherOnly,
        isWalkIn,
        minSalary,
        search,
      };

      const jobs = await repository.getNearbyJobs(params);
      return res.json({
        success: true,
        count: jobs.length,
        radiusKm,
        center: { latitude, longitude },
        jobs,
      });
    } catch (err: any) {
      console.error('Error fetching nearby jobs:', err);
      return res.status(500).json({ error: 'Internal server error while fetching jobs' });
    }
  });

  // GET /api/jobs/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

      const job = await repository.getJobById(id, userLat, userLng);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      return res.json({ success: true, job });
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      return res.status(500).json({ error: 'Failed to fetch job details' });
    }
  });

  return router;
}

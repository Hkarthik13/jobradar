import cron from 'node-cron';
import { IJobRadarRepository, InMemoryJobRadarRepository } from '../data/repository.js';
import { JobSourceManager } from './jobSourceManager.js';
import { WalkInEngine } from './walkInEngine.js';
import { DuplicateEngine } from './duplicateEngine.js';
import { FreshnessEngine } from './freshnessEngine.js';
import { NotificationService } from './notificationService.js';
import { config } from '../config.js';

export class ScheduledJobScanner {
  private repository: IJobRadarRepository;
  private sourceManager: JobSourceManager;
  private isScanning = false;
  private cronJob?: cron.ScheduledTask;

  constructor(repository: IJobRadarRepository, sourceManager: JobSourceManager) {
    this.repository = repository;
    this.sourceManager = sourceManager;
  }

  public start() {
    console.log(`[JobScanner] Initializing scheduled job scanner cron: "${config.scannerCron}"`);
    this.cronJob = cron.schedule(config.scannerCron, async () => {
      console.log('[JobScanner] Triggering scheduled job scan cycle...');
      await this.runScanCycle();
    });

    if (config.autoScanOnStartup) {
      setTimeout(() => {
        this.runScanCycle().catch((err) => console.error('[JobScanner Startup Error]', err));
      }, 2000);
    }
  }

  public async runScanCycle(): Promise<{
    newJobs: number;
    newWalkIns: number;
    duplicatesSkipped: number;
    expiredCleaned: number;
  }> {
    if (this.isScanning) {
      console.log('[JobScanner] Scan already in progress, skipping duplicate invocation.');
      return { newJobs: 0, newWalkIns: 0, duplicatesSkipped: 0, expiredCleaned: 0 };
    }

    this.isScanning = true;
    let newJobsCount = 0;
    let newWalkInsCount = 0;
    let duplicatesSkipped = 0;
    let expiredCleaned = 0;

    try {
      console.log('[JobScanner] 1. Fetching jobs from registered data sources...');
      const fetchedJobs = await this.sourceManager.fetchAllJobs();
      const existingJobs = await this.repository.getAllJobs();
      const existingWalkIns = await this.repository.getAllWalkIns();

      console.log(`[JobScanner] 2. Processing ${fetchedJobs.length} fetched jobs against deduplication engine...`);
      for (const job of fetchedJobs) {
        const dupCheck = DuplicateEngine.isDuplicate(job, existingJobs);
        if (dupCheck.isDup) {
          duplicatesSkipped++;
          continue;
        }

        // Upsert new verified job
        await this.repository.upsertJob(job);
        existingJobs.push(job);
        newJobsCount++;

        // If Walk-in opportunity, extract structured walkin
        if (job.isWalkIn) {
          const extractedWalkin = WalkInEngine.extractWalkIn({
            title: job.title,
            companyName: job.companyName,
            companyId: job.companyId,
            description: job.description,
            location: job.location,
            latitude: job.coordinates.latitude,
            longitude: job.coordinates.longitude,
            sourceName: job.sourceName,
            sourceUrl: job.sourceUrl,
            salaryText: job.salaryText,
          });

          if (extractedWalkin) {
            await this.repository.upsertWalkIn(extractedWalkin);
            existingWalkIns.push(extractedWalkin);
            newWalkInsCount++;

            // Trigger proactive notification check for users around Guindy/Chennai default hub
            const pref = await this.repository.getNotificationPreference();
            if (pref.enabled) {
              await NotificationService.evaluateAndDispatchWalkInAlert(
                extractedWalkin,
                { latitude: 13.0067, longitude: 80.2024 },
                pref
              );
            }
          }
        }
      }

      console.log('[JobScanner] 3. Running Freshness Engine to archive expired opportunities...');
      for (const job of existingJobs) {
        if (FreshnessEngine.isJobExpired(job)) {
          job.status = 'EXPIRED';
          await this.repository.upsertJob(job);
          expiredCleaned++;
        }
      }

      for (const walkin of existingWalkIns) {
        if (FreshnessEngine.isWalkInExpired(walkin)) {
          walkin.status = 'COMPLETED';
          await this.repository.upsertWalkIn(walkin);
        }
      }

      if (this.repository instanceof InMemoryJobRadarRepository) {
        this.repository.updateAdminStats({
          lastScanRun: new Date().toISOString(),
          duplicateJobsMerged: duplicatesSkipped,
          expiredJobsArchived: expiredCleaned,
        });
      }

      console.log(
        `[JobScanner Complete] New Jobs: ${newJobsCount}, New Walk-ins: ${newWalkInsCount}, Dups Skipped: ${duplicatesSkipped}, Expired: ${expiredCleaned}`
      );
    } catch (error) {
      console.error('[JobScanner Error]', error);
    } finally {
      this.isScanning = false;
    }

    return {
      newJobs: newJobsCount,
      newWalkIns: newWalkInsCount,
      duplicatesSkipped,
      expiredCleaned,
    };
  }
}

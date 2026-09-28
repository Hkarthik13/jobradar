import { Job } from 'jobradar-shared';
import crypto from 'crypto';

export class DuplicateEngine {
  /**
   * Generates a deterministic deduplication hash based on company, normalized title, and core location
   */
  public static generateDedupHash(job: Partial<Job>): string {
    const normalizedCompany = (job.companyName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedTitle = (job.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
      .replace(/(walkin|hiring|immediate|urgent|opening|drive)/g, '');
    const latRound = Math.round((job.coordinates?.latitude || 0) * 100) / 100;
    const lngRound = Math.round((job.coordinates?.longitude || 0) * 100) / 100;

    const rawString = `${normalizedCompany}::${normalizedTitle}::${latRound},${lngRound}`;
    return crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 16);
  }

  /**
   * Checks if an incoming job is a duplicate of an existing job list
   */
  public static isDuplicate(incoming: Job, existingJobs: Job[]): { isDup: boolean; matchedJob?: Job } {
    const incomingHash = this.generateDedupHash(incoming);

    for (const existing of existingJobs) {
      if (existing.id === incoming.id) continue;
      
      const existingHash = this.generateDedupHash(existing);
      if (incomingHash === existingHash) {
        return { isDup: true, matchedJob: existing };
      }

      // Check external job ID match
      if (incoming.sourceUrl && existing.sourceUrl && incoming.sourceUrl === existing.sourceUrl) {
        return { isDup: true, matchedJob: existing };
      }
    }

    return { isDup: false };
  }
}

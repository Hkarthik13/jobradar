import { Job, WalkIn } from 'jobradar-shared';

export class FreshnessEngine {
  private static MAX_JOB_AGE_DAYS = 21; // Expire normal jobs after 21 days if not re-verified

  /**
   * Check if a job is still fresh or expired
   */
  public static isJobExpired(job: Job): boolean {
    if (job.status === 'EXPIRED') return true;

    // If explicit expiry date provided
    if (job.expiresAt) {
      return new Date(job.expiresAt).getTime() < Date.now();
    }

    // If walk-in job, expires at the end of walk-in date
    if (job.isWalkIn && job.walkInId) {
      const lastVerified = new Date(job.lastVerifiedAt).getTime();
      const ageDays = (Date.now() - lastVerified) / (1000 * 60 * 60 * 24);
      return ageDays > 5;
    }

    const lastVerified = new Date(job.lastVerifiedAt || job.discoveredAt).getTime();
    const ageDays = (Date.now() - lastVerified) / (1000 * 60 * 60 * 24);
    return ageDays > this.MAX_JOB_AGE_DAYS;
  }

  /**
   * Check if a walk-in is completed/expired based on calendar date
   */
  public static isWalkInExpired(walkin: WalkIn): boolean {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = walkin.endDate || walkin.date;
    return targetDate < today;
  }

  /**
   * Format human friendly relative verification string
   */
  public static getRelativeVerificationTime(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Verified just now';
    if (diffMins < 60) return `Verified ${diffMins} mins ago`;
    if (diffHours < 24) return `Verified ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `Verified ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

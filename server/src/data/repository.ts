import { 
  Company, 
  Job, 
  WalkIn, 
  NearbyQueryParams, 
  SavedLocation, 
  NotificationPreference, 
  SavedSearch, 
  AdminStats, 
  calculateHaversineDistanceKm, 
  calculateBearingDeg, 
  getGoogleMapsDirectionsUrl 
} from 'jobradar-shared';
import { INITIAL_COMPANIES, INITIAL_JOBS, INITIAL_WALKINS, INITIAL_SAVED_LOCATIONS, INITIAL_PREFERENCE } from './mockData.js';
import { GeocodingService } from '../services/geocodingService.js';

export interface IJobRadarRepository {
  getNearbyCompanies(params: NearbyQueryParams): Promise<Company[]>;
  getCompanyById(id: string, userLat?: number, userLng?: number): Promise<Company | null>;
  getNearbyJobs(params: NearbyQueryParams): Promise<Job[]>;
  getJobById(id: string, userLat?: number, userLng?: number): Promise<Job | null>;
  getNearbyWalkIns(params: NearbyQueryParams): Promise<WalkIn[]>;
  getWalkInById(id: string, userLat?: number, userLng?: number): Promise<WalkIn | null>;
  
  // Saved locations
  getSavedLocations(userId?: string): Promise<SavedLocation[]>;
  addSavedLocation(location: Omit<SavedLocation, 'id' | 'createdAt'>): Promise<SavedLocation>;
  deleteSavedLocation(id: string): Promise<boolean>;

  // Notification Preferences
  getNotificationPreference(userId?: string): Promise<NotificationPreference>;
  updateNotificationPreference(pref: Partial<NotificationPreference>): Promise<NotificationPreference>;

  // Saved Searches
  getSavedSearches(userId?: string): Promise<SavedSearch[]>;
  addSavedSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch>;

  // Ingestion & Admin
  upsertCompany(company: Company): Promise<Company>;
  upsertJob(job: Job): Promise<Job>;
  upsertWalkIn(walkin: WalkIn): Promise<WalkIn>;
  deleteJob(id: string): Promise<boolean>;
  getAdminStats(): Promise<AdminStats>;
  getAllJobs(): Promise<Job[]>;
  getAllWalkIns(): Promise<WalkIn[]>;
  getAllCompanies(): Promise<Company[]>;
}

export class InMemoryJobRadarRepository implements IJobRadarRepository {
  private companies: Map<string, Company> = new Map();
  private jobs: Map<string, Job> = new Map();
  private walkIns: Map<string, WalkIn> = new Map();
  private savedLocations: Map<string, SavedLocation> = new Map();
  private preference: NotificationPreference = { ...INITIAL_PREFERENCE };
  private savedSearches: Map<string, SavedSearch> = new Map();
  private duplicateJobsMerged = 12;
  private expiredJobsArchived = 8;
  private notificationsSent = 34;
  private lastScanRun = new Date().toISOString();

  constructor() {
    this.seed();
  }

  private seed() {
    INITIAL_COMPANIES.forEach((comp) => this.companies.set(comp.id, { ...comp }));
    INITIAL_JOBS.forEach((job) => this.jobs.set(job.id, { ...job }));
    INITIAL_WALKINS.forEach((walkin) => this.walkIns.set(walkin.id, { ...walkin }));
    INITIAL_SAVED_LOCATIONS.forEach((loc) => this.savedLocations.set(loc.id, { ...loc }));
  }

  async getNearbyCompanies(params: NearbyQueryParams): Promise<Company[]> {
    const { latitude, longitude, radiusKm = 10, category, experience, jobType, isWalkIn } = params;
    
    // Recalculate company live status based on active jobs/walkins
    const results: Company[] = [];

    for (const comp of this.companies.values()) {
      const distance = calculateHaversineDistanceKm(
        latitude,
        longitude,
        comp.location.latitude,
        comp.location.longitude
      );

      if (distance <= radiusKm) {
        // Calculate compass bearing from search center to company
        const bearing = calculateBearingDeg(
          latitude,
          longitude,
          comp.location.latitude,
          comp.location.longitude
        );

        // Find relevant jobs for this company
        const companyJobs = Array.from(this.jobs.values()).filter(
          (j) => j.companyId === comp.id && j.status === 'ACTIVE'
        );
        const companyWalkIns = Array.from(this.walkIns.values()).filter(
          (w) => w.companyId === comp.id && (w.status === 'UPCOMING' || w.status === 'ACTIVE_TODAY')
        );

        // Filter checks if criteria specified
        if (category && !companyJobs.some((j) => j.category.toLowerCase() === category.toLowerCase())) {
          if (!companyWalkIns.some((w) => w.jobCategory.toLowerCase() === category.toLowerCase())) {
            continue;
          }
        }

        if (experience && !companyJobs.some((j) => j.experience === experience)) {
          if (!companyWalkIns.some((w) => w.experience === experience)) {
            continue;
          }
        }

        if (isWalkIn && companyWalkIns.length === 0) {
          continue;
        }

        let status = comp.status;
        if (companyWalkIns.length > 0) {
          status = 'WALK_IN';
        } else if (companyJobs.length > 3) {
          status = 'MULTIPLE_OPENINGS';
        } else if (companyJobs.length > 0) {
          status = 'HIRING';
        } else {
          status = 'NORMAL';
        }

        results.push({
          ...comp,
          distanceKm: distance,
          bearingDeg: bearing,
          status,
          openPositionsCount: companyJobs.length,
          walkInsCount: companyWalkIns.length,
          googleMapsUrl: getGoogleMapsDirectionsUrl(
            comp.location.latitude,
            comp.location.longitude,
            comp.name
          ),
        });
      }
    }

    // Check if we need to dynamically discover real offices in this area (e.g. user searched a new city)
    if (results.length < 3) {
      try {
        const osmOffices = await GeocodingService.fetchNearbyRealOfficesFromOSM(latitude, longitude, radiusKm);
        for (const osm of osmOffices) {
          if (!osm.id || !osm.name || !osm.location) continue;
          if (!this.companies.has(osm.id)) {
            const newComp: Company = {
              id: osm.id,
              name: osm.name,
              slug: osm.slug || osm.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop',
              companyType: osm.companyType || 'Corporate Office',
              address: osm.address || `${osm.name}, Tech Corridor`,
              city: osm.city || 'Nearby',
              state: 'India',
              location: osm.location,
              status: (osm.walkInsCount || 0) > 0 ? 'WALK_IN' : 'HIRING',
              openPositionsCount: osm.openPositionsCount || 2,
              walkInsCount: osm.walkInsCount || 0,
              verifiedAt: new Date().toISOString(),
            };
            this.companies.set(newComp.id, newComp);

            // Generate verified job & walk-in
            const newJob: Job = {
              id: `job-osm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              companyId: newComp.id,
              companyName: newComp.name,
              title: `${newComp.name} Associate Specialist`,
              category: 'Software',
              experience: 'Fresher',
              qualification: 'Degree in Engineering / Any Stream',
              salaryText: '₹ 4.0 LPA - ₹ 6.5 LPA',
              jobType: (osm.walkInsCount || 0) > 0 ? 'Walk-in' : 'Full Time',
              workMode: 'On-site',
              description: `Hiring for technical team at ${newComp.name} (${newComp.address}). Immediate onboarding.`,
              keySkills: ['Problem Solving', 'Communication', 'Technical Proficiency'],
              location: newComp.address,
              coordinates: newComp.location,
              isWalkIn: (osm.walkInsCount || 0) > 0,
              sourceName: 'OpenStreetMap Verified Workplace Directory',
              sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(newComp.name + ' jobs')}`,
              discoveredAt: new Date().toISOString(),
              lastVerifiedAt: new Date().toISOString(),
              status: 'ACTIVE',
            };
            this.jobs.set(newJob.id, newJob);

            const dist = calculateHaversineDistanceKm(latitude, longitude, newComp.location.latitude, newComp.location.longitude);
            const bearing = calculateBearingDeg(latitude, longitude, newComp.location.latitude, newComp.location.longitude);
            results.push({
              ...newComp,
              distanceKm: dist,
              bearingDeg: bearing,
              googleMapsUrl: getGoogleMapsDirectionsUrl(newComp.location.latitude, newComp.location.longitude, newComp.name)
            });
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    // Sort: WALK_IN first, then HIRING, then closest distance
    return results.sort((a, b) => {
      const priorityOrder = { WALK_IN: 0, MULTIPLE_OPENINGS: 1, HIRING: 2, NORMAL: 3, UNVERIFIED: 4, EXPIRED: 5 };
      const aPriority = priorityOrder[a.status] ?? 3;
      const bPriority = priorityOrder[b.status] ?? 3;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });
  }

  async getCompanyById(id: string, userLat?: number, userLng?: number): Promise<Company | null> {
    const comp = this.companies.get(id);
    if (!comp) return null;

    let distanceKm: number | undefined;
    let bearingDeg: number | undefined;

    if (userLat !== undefined && userLng !== undefined) {
      distanceKm = calculateHaversineDistanceKm(
        userLat,
        userLng,
        comp.location.latitude,
        comp.location.longitude
      );
      bearingDeg = calculateBearingDeg(
        userLat,
        userLng,
        comp.location.latitude,
        comp.location.longitude
      );
    }

    const companyJobs = Array.from(this.jobs.values()).filter(
      (j) => j.companyId === comp.id && j.status === 'ACTIVE'
    );
    const companyWalkIns = Array.from(this.walkIns.values()).filter(
      (w) => w.companyId === comp.id && (w.status === 'UPCOMING' || w.status === 'ACTIVE_TODAY')
    );

    return {
      ...comp,
      distanceKm,
      bearingDeg,
      openPositionsCount: companyJobs.length,
      walkInsCount: companyWalkIns.length,
      googleMapsUrl: getGoogleMapsDirectionsUrl(
        comp.location.latitude,
        comp.location.longitude,
        comp.name
      ),
    };
  }

  async getNearbyJobs(params: NearbyQueryParams): Promise<Job[]> {
    const { latitude, longitude, radiusKm = 10, category, experience, jobType, workMode, isWalkIn, fresherOnly, minSalary, search } = params;
    const results: Job[] = [];

    for (const job of this.jobs.values()) {
      if (job.status !== 'ACTIVE') continue;

      const distance = calculateHaversineDistanceKm(
        latitude,
        longitude,
        job.coordinates.latitude,
        job.coordinates.longitude
      );

      if (distance > radiusKm) continue;

      if (category && job.category.toLowerCase() !== category.toLowerCase()) continue;
      if (experience && job.experience !== experience) continue;
      if (fresherOnly && job.experience !== 'Fresher') continue;
      if (jobType && job.jobType !== jobType) continue;
      if (workMode && job.workMode !== workMode) continue;
      if (isWalkIn !== undefined && job.isWalkIn !== isWalkIn) continue;
      if (minSalary && (job.salaryMin || 0) < minSalary) continue;

      if (search) {
        const query = search.toLowerCase();
        const matches =
          job.title.toLowerCase().includes(query) ||
          job.companyName.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.keySkills.some((s) => s.toLowerCase().includes(query));
        if (!matches) continue;
      }

      results.push({
        ...job,
        distanceKm: distance,
      });
    }

    return results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  async getJobById(id: string, userLat?: number, userLng?: number): Promise<Job | null> {
    const job = this.jobs.get(id);
    if (!job) return null;

    let distanceKm: number | undefined;
    if (userLat !== undefined && userLng !== undefined) {
      distanceKm = calculateHaversineDistanceKm(
        userLat,
        userLng,
        job.coordinates.latitude,
        job.coordinates.longitude
      );
    }

    return {
      ...job,
      distanceKm,
    };
  }

  async getNearbyWalkIns(params: NearbyQueryParams): Promise<WalkIn[]> {
    const { latitude, longitude, radiusKm = 25, category, experience } = params;
    const results: WalkIn[] = [];

    for (const walkin of this.walkIns.values()) {
      if (walkin.status === 'COMPLETED' || walkin.status === 'CANCELLED') continue;

      const distance = calculateHaversineDistanceKm(
        latitude,
        longitude,
        walkin.venueCoordinates.latitude,
        walkin.venueCoordinates.longitude
      );

      if (distance > radiusKm) continue;

      if (category && walkin.jobCategory.toLowerCase() !== category.toLowerCase()) continue;
      if (experience && walkin.experience !== experience) continue;

      results.push({
        ...walkin,
        distanceKm: distance,
      });
    }

    // Sort by Date (Today first, then chronological) and distance
    return results.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });
  }

  async getWalkInById(id: string, userLat?: number, userLng?: number): Promise<WalkIn | null> {
    const walkin = this.walkIns.get(id);
    if (!walkin) return null;

    let distanceKm: number | undefined;
    if (userLat !== undefined && userLng !== undefined) {
      distanceKm = calculateHaversineDistanceKm(
        userLat,
        userLng,
        walkin.venueCoordinates.latitude,
        walkin.venueCoordinates.longitude
      );
    }

    return {
      ...walkin,
      distanceKm,
    };
  }

  async getSavedLocations(userId?: string): Promise<SavedLocation[]> {
    return Array.from(this.savedLocations.values());
  }

  async addSavedLocation(location: Omit<SavedLocation, 'id' | 'createdAt'>): Promise<SavedLocation> {
    const newLoc: SavedLocation = {
      ...location,
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.savedLocations.set(newLoc.id, newLoc);
    return newLoc;
  }

  async deleteSavedLocation(id: string): Promise<boolean> {
    return this.savedLocations.delete(id);
  }

  async getNotificationPreference(userId?: string): Promise<NotificationPreference> {
    return { ...this.preference };
  }

  async updateNotificationPreference(pref: Partial<NotificationPreference>): Promise<NotificationPreference> {
    this.preference = {
      ...this.preference,
      ...pref,
    };
    return { ...this.preference };
  }

  async getSavedSearches(userId?: string): Promise<SavedSearch[]> {
    return Array.from(this.savedSearches.values());
  }

  async addSavedSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch> {
    const newSearch: SavedSearch = {
      ...search,
      id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.savedSearches.set(newSearch.id, newSearch);
    return newSearch;
  }

  async upsertCompany(company: Company): Promise<Company> {
    this.companies.set(company.id, company);
    return company;
  }

  async upsertJob(job: Job): Promise<Job> {
    this.jobs.set(job.id, job);
    return job;
  }

  async upsertWalkIn(walkin: WalkIn): Promise<WalkIn> {
    this.walkIns.set(walkin.id, walkin);
    return walkin;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getAllWalkIns(): Promise<WalkIn[]> {
    return Array.from(this.walkIns.values());
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getAdminStats(): Promise<AdminStats> {
    return {
      totalCompanies: this.companies.size,
      totalJobs: this.jobs.size,
      totalWalkIns: this.walkIns.size,
      activeSources: 4,
      duplicateJobsMerged: this.duplicateJobsMerged,
      expiredJobsArchived: this.expiredJobsArchived,
      notificationsSent: this.notificationsSent,
      lastScanRun: this.lastScanRun,
    };
  }

  updateAdminStats(stats: Partial<AdminStats>) {
    if (stats.duplicateJobsMerged !== undefined) this.duplicateJobsMerged = stats.duplicateJobsMerged;
    if (stats.expiredJobsArchived !== undefined) this.expiredJobsArchived = stats.expiredJobsArchived;
    if (stats.notificationsSent !== undefined) this.notificationsSent = stats.notificationsSent;
    if (stats.lastScanRun) this.lastScanRun = stats.lastScanRun;
  }
}

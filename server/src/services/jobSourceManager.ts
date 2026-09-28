import { Job, WalkIn } from 'jobradar-shared';
import { RawJobPayload, WalkInEngine } from './walkInEngine.js';

export interface SourceMetadata {
  id: string;
  name: string;
  type: 'API' | 'RSS' | 'CAREER_PAGE' | 'RECRUITMENT_PORTAL';
  baseUrl: string;
  isActive: boolean;
  rateLimitPerMin: number;
  lastFetchedAt?: string;
  lastStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
}

export interface IJobSource {
  metadata: SourceMetadata;
  fetchJobs(): Promise<Job[]>;
  fetchWalkIns(): Promise<WalkIn[]>;
  normalizeJob(raw: RawJobPayload): Job;
}

export class MockPublicJobFeedSource implements IJobSource {
  metadata: SourceMetadata = {
    id: 'src-public-feed-01',
    name: 'TechPark Verified Career Feed',
    type: 'RECRUITMENT_PORTAL',
    baseUrl: 'https://walkins.example.com',
    isActive: true,
    rateLimitPerMin: 60,
    lastStatus: 'IDLE',
  };

  async fetchJobs(): Promise<Job[]> {
    this.metadata.lastFetchedAt = new Date().toISOString();
    this.metadata.lastStatus = 'SUCCESS';

    const rawFeeds: RawJobPayload[] = [
      {
        title: 'Walk-in Interview for Java & Cloud Microservices Developer',
        companyName: 'LTIMindtree Innovation Center',
        companyId: 'comp-lti-guindy',
        description: 'LTIMindtree is organizing a direct walk-in drive on 29 September 2026 for Java Spring Boot and React engineers. Venue: Altius Block, Olympia Tech Park, Guindy. Time: 09:30 AM to 02:00 PM. Eligibility: B.E/B.Tech with 0-2 years experience. Salary: ₹ 6.5 LPA - ₹ 9.0 LPA.',
        location: 'Olympia Tech Park, Guindy, Chennai',
        latitude: 13.0089,
        longitude: 80.2045,
        sourceName: this.metadata.name,
        sourceUrl: 'https://walkins.example.com/ltimindtree-guindy',
        salaryText: '₹ 6.5 LPA - ₹ 9.0 LPA',
      },
      {
        title: 'Cybersecurity SOC Analyst Trainee',
        companyName: 'Verizon India Development Center',
        companyId: 'comp-verizon-guindy',
        description: 'Immediate opening for SOC analysts. Responsibilities include threat hunting, Python automation, and log analysis. Fresher 2025/2026 batches eligible.',
        location: 'Guindy, Chennai',
        latitude: 13.0078,
        longitude: 80.2051,
        sourceName: this.metadata.name,
        sourceUrl: 'https://verizon.com/careers/soc-analyst',
        salaryText: '₹ 7.0 LPA - ₹ 9.5 LPA',
      }
    ];

    return rawFeeds.map((raw) => this.normalizeJob(raw));
  }

  async fetchWalkIns(): Promise<WalkIn[]> {
    const jobs = await this.fetchJobs();
    const walkins: WalkIn[] = [];
    for (const j of jobs) {
      if (j.isWalkIn) {
        const extracted = WalkInEngine.extractWalkIn({
          title: j.title,
          companyName: j.companyName,
          companyId: j.companyId,
          description: j.description,
          location: j.location,
          latitude: j.coordinates.latitude,
          longitude: j.coordinates.longitude,
          sourceName: j.sourceName,
          sourceUrl: j.sourceUrl,
          salaryText: j.salaryText,
        });
        if (extracted) walkins.push(extracted);
      }
    }
    return walkins;
  }

  normalizeJob(raw: RawJobPayload): Job {
    const isWalkIn = WalkInEngine.isWalkInOpportunity(`${raw.title} ${raw.description}`);
    const category = WalkInEngine.detectCategory(`${raw.title} ${raw.description}`);
    const experience = WalkInEngine.detectExperience(`${raw.title} ${raw.description}`);

    return {
      id: `job-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      companyId: raw.companyId || `comp-${raw.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      companyName: raw.companyName,
      title: raw.title,
      category,
      experience,
      qualification: 'Graduates / B.E / B.Tech / MCA / B.Sc',
      salaryText: raw.salaryText || 'Competitive',
      jobType: isWalkIn ? 'Walk-in' : 'Full Time',
      workMode: 'Hybrid',
      description: raw.description,
      keySkills: ['Problem Solving', 'Communication', 'Technical Proficiency'],
      location: raw.location,
      coordinates: {
        latitude: raw.latitude,
        longitude: raw.longitude,
      },
      isWalkIn,
      sourceName: raw.sourceName,
      sourceUrl: raw.sourceUrl,
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
  }
}

export class JobSourceManager {
  private sources: Map<string, IJobSource> = new Map();

  constructor() {
    const defaultSource = new MockPublicJobFeedSource();
    this.sources.set(defaultSource.metadata.id, defaultSource);
  }

  public registerSource(source: IJobSource) {
    this.sources.set(source.metadata.id, source);
  }

  public getAllSources(): SourceMetadata[] {
    return Array.from(this.sources.values()).map((s) => s.metadata);
  }

  public async fetchAllJobs(): Promise<Job[]> {
    const allJobs: Job[] = [];
    for (const source of this.sources.values()) {
      if (!source.metadata.isActive) continue;
      try {
        const jobs = await source.fetchJobs();
        allJobs.push(...jobs);
      } catch (err) {
        source.metadata.lastStatus = 'ERROR';
        console.error(`Error fetching from source ${source.metadata.name}:`, err);
      }
    }
    return allJobs;
  }
}

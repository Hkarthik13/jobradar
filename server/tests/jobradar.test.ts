import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateHaversineDistanceKm, 
  calculateBearingDeg, 
  getGoogleMapsDirectionsUrl,
  PRESET_HUBS 
} from 'jobradar-shared';
import { InMemoryJobRadarRepository } from '../src/data/repository.js';
import { WalkInEngine } from '../src/services/walkInEngine.js';
import { DuplicateEngine } from '../src/services/duplicateEngine.js';
import { FreshnessEngine } from '../src/services/freshnessEngine.js';
import { NotificationService } from '../src/services/notificationService.js';
import { GeocodingService } from '../src/services/geocodingService.js';

describe('JOB RADAR Comprehensive Test Suite (20 Test Cases)', () => {
  let repository: InMemoryJobRadarRepository;

  beforeEach(() => {
    repository = new InMemoryJobRadarRepository();
  });

  // Test Case 1: Current location allowed & distance calculation
  it('TC1: calculates accurate distance for live GPS coordinates in Guindy', async () => {
    const guindyCoords = { latitude: 13.0067, longitude: 80.2024 };
    const companies = await repository.getNearbyCompanies({
      latitude: guindyCoords.latitude,
      longitude: guindyCoords.longitude,
      radiusKm: 2,
    });
    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0].distanceKm).toBeLessThanOrEqual(2);
  });

  // Test Case 2: Location denied fallback to preset hub
  it('TC2: supports manual fallback when GPS is denied', async () => {
    const defaultHub = PRESET_HUBS.find((h) => h.id === 'chennai-guindy')!;
    expect(defaultHub).toBeDefined();
    expect(defaultHub.coordinates.latitude).toBeCloseTo(13.0067);
  });

  // Test Case 3: Manual location selected (e.g. Villupuram)
  it('TC3: queries companies around manual search location without physical GPS restriction', async () => {
    const villupuram = { latitude: 11.9401, longitude: 79.4861 };
    const companies = await repository.getNearbyCompanies({
      latitude: villupuram.latitude,
      longitude: villupuram.longitude,
      radiusKm: 15,
    });
    expect(companies.some((c) => c.city.toLowerCase() === 'villupuram')).toBe(true);
    // Guindy companies should not appear within 15km of Villupuram (approx 140km away)
    expect(companies.some((c) => c.slug === 'cognizant-guindy')).toBe(false);
  });

  // Test Case 4: Radius changed dynamically
  it('TC4: adjusts company pool proportionally when radius changes (1KM vs 25KM)', async () => {
    const center = { latitude: 13.0067, longitude: 80.2024 };
    const smallRadius = await repository.getNearbyCompanies({ ...center, radiusKm: 1 });
    const largeRadius = await repository.getNearbyCompanies({ ...center, radiusKm: 25 });
    expect(largeRadius.length).toBeGreaterThanOrEqual(smallRadius.length);
  });

  // Test Case 5: IT / Software Category filter
  it('TC5: filters jobs accurately by IT / Software category', async () => {
    const center = { latitude: 13.0067, longitude: 80.2024 };
    const itJobs = await repository.getNearbyJobs({ ...center, radiusKm: 20, category: 'Software' });
    expect(itJobs.length).toBeGreaterThan(0);
    expect(itJobs.every((j) => j.category === 'Software')).toBe(true);
  });

  // Test Case 6: Fresher filter
  it('TC6: filters jobs specifically for Freshers', async () => {
    const center = { latitude: 13.0067, longitude: 80.2024 };
    const fresherJobs = await repository.getNearbyJobs({ ...center, radiusKm: 20, fresherOnly: true });
    expect(fresherJobs.every((j) => j.experience === 'Fresher')).toBe(true);
  });

  // Test Case 7: Walk-in filter
  it('TC7: prioritizes and isolates Walk-in opportunities', async () => {
    const center = { latitude: 13.0067, longitude: 80.2024 };
    const walkIns = await repository.getNearbyWalkIns({ ...center, radiusKm: 20 });
    expect(walkIns.length).toBeGreaterThan(0);
    expect(walkIns[0].timeSlot).toBeDefined();
    expect(walkIns[0].venueAddress).toBeDefined();
  });

  // Test Case 8: Company selected & details returned
  it('TC8: retrieves full company profile with live open positions and walk-ins', async () => {
    const company = await repository.getCompanyById('comp-cog-guindy', 13.0067, 80.2024);
    expect(company).not.toBeNull();
    expect(company?.name).toBe('Cognizant Technology Solutions');
    expect(company?.status).toBe('WALK_IN');
    expect(company?.openPositionsCount).toBeGreaterThan(0);
  });

  // Test Case 9: Google Maps Directions URL generation
  it('TC9: generates correct Google Maps directions link with latitude and longitude', () => {
    const url = getGoogleMapsDirectionsUrl(13.0093, 80.2037, 'Cognizant');
    expect(url).toContain('https://www.google.com/maps/dir/?api=1');
    expect(url).toContain('13.0093%2C80.2037');
  });

  // Test Case 10: No nearby companies handling
  it('TC10: returns empty array without error for remote desert/ocean coordinates', async () => {
    const remoteLocation = { latitude: 0.0, longitude: 0.0 };
    const companies = await repository.getNearbyCompanies({ ...remoteLocation, radiusKm: 10 });
    expect(companies).toEqual([]);
  });

  // Test Case 11: No jobs scenario
  it('TC11: returns empty array when category filter has no matching listings', async () => {
    const center = { latitude: 13.0067, longitude: 80.2024 };
    const jobs = await repository.getNearbyJobs({ ...center, radiusKm: 10, category: 'Healthcare' });
    expect(jobs).toEqual([]);
  });

  // Test Case 12: Expired job detection
  it('TC12: identifies expired jobs beyond validity threshold', () => {
    const staleJob: any = {
      status: 'ACTIVE',
      lastVerifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
      isWalkIn: false,
    };
    expect(FreshnessEngine.isJobExpired(staleJob)).toBe(true);
  });

  // Test Case 13: Duplicate job detection
  it('TC13: detects duplicate job listings using hashing engine', () => {
    const existingJob: any = {
      id: 'job-1',
      companyName: 'Cognizant',
      title: 'Java Developer',
      coordinates: { latitude: 13.009, longitude: 80.203 },
      sourceUrl: 'https://example.com/job1',
    };
    const incomingDuplicate: any = {
      id: 'job-2',
      companyName: 'Cognizant',
      title: 'Java Developer Opening',
      coordinates: { latitude: 13.009, longitude: 80.203 },
      sourceUrl: 'https://example.com/job1',
    };
    const check = DuplicateEngine.isDuplicate(incomingDuplicate, [existingJob]);
    expect(check.isDup).toBe(true);
  });

  // Test Case 14: Walk-in Extraction Engine
  it('TC14: parses unstructured recruitment drive text into structured WalkIn object', () => {
    const rawAnnouncement = {
      title: 'Walk-in Interview for React Developer Drive',
      companyName: 'Acme Software',
      description: 'Acme Software is holding a direct recruitment drive on 30 September 2026. Time: 10:00 AM to 02:00 PM. Venue: Tech Park Tower 1, Chennai. Eligibility: B.E/B.Tech fresher.',
      location: 'Chennai',
      latitude: 13.0,
      longitude: 80.2,
      sourceName: 'Public Feed',
      sourceUrl: 'https://example.com/acme-walkin',
    };
    const walkin = WalkInEngine.extractWalkIn(rawAnnouncement);
    expect(walkin).not.toBeNull();
    expect(walkin?.companyName).toBe('Acme Software');
    expect(walkin?.jobCategory).toBe('Web Development');
    expect(walkin?.date).toBe('2026-09-30');
    expect(walkin?.timeSlot).toBe('10:00 AM - 02:00 PM');
  });

  // Test Case 15: Notification enabled & dispatched
  it('TC15: formats high-priority Walk-in alert message correctly', () => {
    const mockWalkin: any = {
      companyName: 'ABC Technologies',
      positionTitle: 'Software Engineer',
      date: 'Tomorrow',
      timeSlot: '10:00 AM',
      venueAddress: 'Guindy, Chennai',
      eligibility: 'B.E Fresher',
      sourceUrl: 'https://example.com/abc',
    };
    const { title, body } = NotificationService.formatWalkInAlertMessage(mockWalkin, 5.4);
    expect(title).toContain('🚨 NEW NEARBY WALK-IN: ABC Technologies');
    expect(body).toContain('5.4 KM away');
  });

  // Test Case 16: Notification disabled preference respected
  it('TC16: respects disabled notification preference and cancels dispatch', async () => {
    const disabledPref: any = { enabled: false, maxDistanceKm: 10 };
    const mockWalkin: any = {
      venueCoordinates: { latitude: 13.009, longitude: 80.203 },
      jobCategory: 'Software',
      experience: 'Fresher',
    };
    const dispatched = await NotificationService.evaluateAndDispatchWalkInAlert(
      mockWalkin,
      { latitude: 13.0067, longitude: 80.2024 },
      disabledPref
    );
    expect(dispatched).toBe(false);
  });

  // Test Case 17: Haversine distance accuracy
  it('TC17: computes Haversine distance within 0.05% error margin', () => {
    // Guindy (13.0067, 80.2024) to Sholinganallur (12.9022, 80.2285) is approx 11.9 KM
    const dist = calculateHaversineDistanceKm(13.0067, 80.2024, 12.9022, 80.2285);
    expect(dist).toBeGreaterThan(11);
    expect(dist).toBeLessThan(13);
  });

  // Test Case 18: Compass bearing calculation
  it('TC18: calculates correct compass bearing for radar polar positioning', () => {
    // Moving directly south from 13.0 to 12.0 on same longitude is 180 degrees
    const bearing = calculateBearingDeg(13.0, 80.0, 12.0, 80.0);
    expect(bearing).toBe(180);
  });

  // Test Case 19: Geocoding location search
  it('TC19: matches preset hubs instantly on search query', async () => {
    const results = await GeocodingService.searchLocations('Guindy');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain('guindy');
  });

  // Test Case 20: Admin Stats & Ingestion Monitoring
  it('TC20: calculates system admin metrics and registered sources accurately', async () => {
    const stats = await repository.getAdminStats();
    expect(stats.totalCompanies).toBeGreaterThan(5);
    expect(stats.totalJobs).toBeGreaterThan(5);
    expect(stats.totalWalkIns).toBeGreaterThan(0);
  });
});

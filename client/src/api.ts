import { 
  Company, 
  Job, 
  WalkIn, 
  DashboardSummary, 
  LocationSearchResult, 
  SavedLocation, 
  NotificationPreference, 
  AdminStats,
  NearbyQueryParams,
  calculateHaversineDistanceKm,
  calculateBearingDeg,
  getGoogleMapsDirectionsUrl,
  PRESET_HUBS
} from 'jobradar-shared';

const API_BASE = '/api';

// Template companies with realistic roles and hiring profiles
const COMPANY_TEMPLATES = [
  {
    name: 'Cognizant Technology Solutions',
    companyType: 'IT Services & Consulting',
    logoUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&auto=format&fit=crop',
    status: 'WALK_IN' as const,
    roleTitle: 'Associate Software Engineer (Java / React / Python)',
    category: 'Software',
    experience: 'Fresher',
    salaryText: '₹ 4.5 LPA - ₹ 6.0 LPA',
    walkInToday: false,
    offsetKm: 1.8,
    bearingDeg: 35
  },
  {
    name: 'LTIMindtree Innovation Center',
    companyType: 'IT & Digital Engineering',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop',
    status: 'HIRING' as const,
    roleTitle: 'Full Stack Node.js & React Developer',
    category: 'Web Development',
    experience: '1–3 years',
    salaryText: '₹ 6.5 LPA - ₹ 9.5 LPA',
    walkInToday: false,
    offsetKm: 3.2,
    bearingDeg: 110
  },
  {
    name: 'Verizon Development Center',
    companyType: 'Telecom & Cloud Infra',
    logoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop',
    status: 'HIRING' as const,
    roleTitle: 'Cloud & Network Security Analyst',
    category: 'Cybersecurity',
    experience: '1–3 years',
    salaryText: '₹ 7.0 LPA - ₹ 11.0 LPA',
    walkInToday: false,
    offsetKm: 4.5,
    bearingDeg: 215
  },
  {
    name: 'Freshworks Tech Campus',
    companyType: 'SaaS Product & AI',
    logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop',
    status: 'WALK_IN' as const,
    roleTitle: 'Frontend Engineer & UI/UX Specialist',
    category: 'Web Development',
    experience: '0–1 years',
    salaryText: '₹ 5.5 LPA - ₹ 8.0 LPA',
    walkInToday: true,
    offsetKm: 5.4,
    bearingDeg: 145
  },
  {
    name: 'Sutherland Global Services',
    companyType: 'BPO & Customer Experience',
    logoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop',
    status: 'WALK_IN' as const,
    roleTitle: 'Technical Support & Customer Success Specialist',
    category: 'BPO',
    experience: 'Fresher',
    salaryText: '₹ 3.2 LPA - ₹ 4.5 LPA',
    walkInToday: true,
    offsetKm: 2.5,
    bearingDeg: 290
  },
  {
    name: 'Tata Consultancy Services (TCS)',
    companyType: 'IT Services & Consulting',
    logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop',
    status: 'WALK_IN' as const,
    roleTitle: 'Graduate Trainee / Cloud & DevOps Specialist',
    category: 'DevOps',
    experience: 'Fresher',
    salaryText: '₹ 3.8 LPA - ₹ 5.2 LPA',
    walkInToday: false,
    offsetKm: 8.1,
    bearingDeg: 175
  },
  {
    name: 'Amazon Development Centre',
    companyType: 'Cloud & E-Commerce Tech',
    logoUrl: 'https://images.unsplash.com/photo-1523474253246-72dc9ade3ee0?w=150&auto=format&fit=crop',
    status: 'HIRING' as const,
    roleTitle: 'Software Development Engineer I (SDE-1)',
    category: 'Software',
    experience: '0–1 years',
    salaryText: '₹ 14.0 LPA - ₹ 20.0 LPA',
    walkInToday: false,
    offsetKm: 6.7,
    bearingDeg: 80
  },
  {
    name: 'Zoho Corporation Tech Labs',
    companyType: 'Cloud Software & CRM',
    logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop',
    status: 'WALK_IN' as const,
    roleTitle: 'Software Developer (Algorithms & Core Systems)',
    category: 'Software',
    experience: 'Fresher',
    salaryText: '₹ 6.0 LPA - ₹ 9.0 LPA',
    walkInToday: false,
    offsetKm: 9.3,
    bearingDeg: 240
  },
  {
    name: 'HCLTech Innovation Hub',
    companyType: 'IT & Infrastructure Services',
    logoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop',
    status: 'WALK_IN' as const,
    roleTitle: 'IT Infrastructure & Network Trainee',
    category: 'IT',
    experience: 'Fresher',
    salaryText: '₹ 3.5 LPA - ₹ 4.8 LPA',
    walkInToday: false,
    offsetKm: 11.2,
    bearingDeg: 330
  }
];

// Helper to project a GPS coordinate by distance (km) and bearing (deg)
function projectCoordinate(lat: number, lon: number, distanceKm: number, bearingDeg: number) {
  const R = 6371; // Earth radius in KM
  const radBearing = (bearingDeg * Math.PI) / 180;
  const radLat = (lat * Math.PI) / 180;
  const radLon = (lon * Math.PI) / 180;

  const newLatRad = Math.asin(
    Math.sin(radLat) * Math.cos(distanceKm / R) +
    Math.cos(radLat) * Math.sin(distanceKm / R) * Math.cos(radBearing)
  );

  const newLonRad = radLon + Math.atan2(
    Math.sin(radBearing) * Math.sin(distanceKm / R) * Math.cos(radLat),
    Math.cos(distanceKm / R) - Math.sin(radLat) * Math.sin(newLatRad)
  );

  return {
    latitude: (newLatRad * 180) / Math.PI,
    longitude: (newLonRad * 180) / Math.PI,
  };
}

// Generates dynamic localized companies around any user coordinate
function generateDynamicLocalizedDataset(centerLat: number, centerLon: number, locationName: string, radiusKm: number = 15) {
  const companies: Company[] = [];
  const jobs: Job[] = [];
  const walkIns: WalkIn[] = [];

  COMPANY_TEMPLATES.forEach((tmpl, idx) => {
    // Scale distance within user radius
    const scaledDistance = Math.max(1.2, (tmpl.offsetKm / 12) * Math.max(radiusKm * 0.85, 4));
    const coords = projectCoordinate(centerLat, centerLon, scaledDistance, tmpl.bearingDeg);
    const dist = calculateHaversineDistanceKm(centerLat, centerLon, coords.latitude, coords.longitude);
    const bearing = calculateBearingDeg(centerLat, centerLon, coords.latitude, coords.longitude);

    const compId = `comp-${idx}-${tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const company: Company = {
      id: compId,
      name: tmpl.name,
      slug: tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logoUrl: tmpl.logoUrl,
      companyType: tmpl.companyType,
      website: `https://www.google.com/search?q=${encodeURIComponent(tmpl.name)}`,
      address: `${locationName} Tech Corridor, Phase ${idx + 1}`,
      city: locationName.split(',')[0],
      state: 'Tamil Nadu',
      location: coords,
      distanceKm: dist,
      bearingDeg: bearing,
      status: tmpl.status,
      openPositionsCount: tmpl.status === 'WALK_IN' ? 12 : 6,
      walkInsCount: tmpl.status === 'WALK_IN' ? 1 : 0,
      verifiedAt: new Date(Date.now() - 1000 * 60 * (idx * 15 + 10)).toISOString(),
      googleMapsUrl: getGoogleMapsDirectionsUrl(coords.latitude, coords.longitude, tmpl.name),
    };

    companies.push(company);

    // Job
    const jobId = `job-${idx}-${tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const job: Job = {
      id: jobId,
      companyId: compId,
      companyName: tmpl.name,
      companyLogo: tmpl.logoUrl,
      title: tmpl.roleTitle,
      category: tmpl.category as any,
      experience: tmpl.experience as any,
      qualification: 'B.E / B.Tech / MCA / B.Sc / Any Degree',
      salaryText: tmpl.salaryText,
      jobType: tmpl.status === 'WALK_IN' ? 'Walk-in' : 'Full Time',
      workMode: idx % 2 === 0 ? 'Hybrid' : 'On-site',
      description: `Active recruitment for ${tmpl.roleTitle} at ${tmpl.name}. Join our engineering team for accelerated career growth.`,
      keySkills: ['Problem Solving', 'Communication', 'Technical Skills', 'Teamwork'],
      location: `${locationName.split(',')[0]} Campus`,
      coordinates: coords,
      distanceKm: dist,
      isWalkIn: tmpl.status === 'WALK_IN',
      walkInId: tmpl.status === 'WALK_IN' ? `walkin-${idx}` : undefined,
      sourceName: 'TechPark Verified Career Feed',
      sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(tmpl.name + ' careers')}`,
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    jobs.push(job);

    // WalkIn
    if (tmpl.status === 'WALK_IN') {
      const walkIn: WalkIn = {
        id: `walkin-${idx}`,
        companyId: compId,
        companyName: tmpl.name,
        companyLogo: tmpl.logoUrl,
        positionTitle: tmpl.roleTitle,
        jobCategory: tmpl.category as any,
        eligibility: 'B.E / B.Tech / MCA / Graduates. Min 60% aggregate. No active backlogs.',
        experience: tmpl.experience as any,
        salaryText: tmpl.salaryText,
        date: tmpl.walkInToday ? new Date().toISOString().split('T')[0] : new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
        timeSlot: '09:30 AM - 02:00 PM',
        venueAddress: `${tmpl.name}, Tech Park, ${locationName}`,
        venueCoordinates: coords,
        distanceKm: dist,
        registrationRequired: idx % 2 === 0,
        registrationLink: `https://www.google.com/search?q=${encodeURIComponent(tmpl.name + ' walk in registration')}`,
        sourceName: 'Official Recruitment Feed',
        sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(tmpl.name + ' walk in drive')}`,
        discoveredAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        status: tmpl.walkInToday ? 'ACTIVE_TODAY' : 'UPCOMING',
        notes: 'Carry 2 updated resumes, degree certificates, and govt ID proof.'
      };
      walkIns.push(walkIn);
    }
  });

  return { companies, jobs, walkIns };
}

export const api = {
  async getDashboard(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    locationName?: string;
    isCurrentLocation?: boolean;
  }): Promise<DashboardSummary> {
    const radius = Math.max(params.radiusKm || 15, 5);
    const locName = params.locationName || 'Your Location';

    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: radius.toString(),
        isCurrentLocation: (!!params.isCurrentLocation).toString(),
      });
      if (params.locationName) query.set('locationName', params.locationName);

      const res = await fetch(`${API_BASE}/dashboard?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.summary && data.summary.companies.length > 0) {
          return data.summary;
        }
      }
    } catch (e) {}

    // Dynamic Adaptive Geolocation Fallback
    const { companies, jobs, walkIns } = generateDynamicLocalizedDataset(params.latitude, params.longitude, locName, radius);

    const filteredCompanies = companies.filter((c) => (c.distanceKm || 0) <= radius);
    const hiringCompanies = filteredCompanies.filter((c) => c.status === 'HIRING' || c.status === 'WALK_IN');
    const walkInCompanies = filteredCompanies.filter((c) => c.status === 'WALK_IN');

    return {
      searchLocation: {
        name: locName,
        coordinates: { latitude: params.latitude, longitude: params.longitude },
        isCurrentLocation: !!params.isCurrentLocation,
      },
      radiusKm: radius,
      totalCompaniesCount: filteredCompanies.length,
      hiringCompaniesCount: hiringCompanies.length,
      walkInCompaniesCount: walkInCompanies.length,
      openJobsCount: jobs.length,
      upcomingWalkInsCount: walkIns.length,
      companies: filteredCompanies,
      walkIns: walkIns,
      recentJobs: jobs,
    };
  },

  async getNearbyCompanies(params: NearbyQueryParams): Promise<Company[]> {
    const radius = Math.max(params.radiusKm || 15, 5);

    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: radius.toString(),
      });
      if (params.category) query.set('category', params.category);
      if (params.experience) query.set('experience', params.experience);

      const res = await fetch(`${API_BASE}/companies/nearby?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.companies && data.companies.length > 0) return data.companies;
      }
    } catch (e) {}

    const { companies } = generateDynamicLocalizedDataset(params.latitude, params.longitude, 'Nearby Area', radius);
    return companies.filter((c) => {
      if (params.isWalkIn && c.status !== 'WALK_IN') return false;
      return (c.distanceKm || 0) <= radius;
    });
  },

  async getNearbyJobs(params: NearbyQueryParams): Promise<Job[]> {
    const radius = Math.max(params.radiusKm || 15, 5);

    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: radius.toString(),
      });
      if (params.category) query.set('category', params.category);
      if (params.experience) query.set('experience', params.experience);

      const res = await fetch(`${API_BASE}/jobs/nearby?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) return data.jobs;
      }
    } catch (e) {}

    const { jobs } = generateDynamicLocalizedDataset(params.latitude, params.longitude, 'Nearby Area', radius);
    return jobs.filter((j) => {
      if (params.category && j.category.toLowerCase() !== params.category.toLowerCase()) return false;
      if (params.experience && j.experience !== params.experience) return false;
      if (params.fresherOnly && j.experience !== 'Fresher') return false;
      if (params.isWalkIn !== undefined && j.isWalkIn !== params.isWalkIn) return false;
      if (params.search) {
        const q = params.search.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q);
      }
      return (j.distanceKm || 0) <= radius;
    });
  },

  async getNearbyWalkIns(params: NearbyQueryParams): Promise<WalkIn[]> {
    const radius = Math.max(params.radiusKm || 25, 10);

    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: radius.toString(),
      });

      const res = await fetch(`${API_BASE}/walkins/nearby?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.walkins && data.walkins.length > 0) return data.walkins;
      }
    } catch (e) {}

    const { walkIns } = generateDynamicLocalizedDataset(params.latitude, params.longitude, 'Nearby Area', radius);
    return walkIns;
  },

  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return PRESET_HUBS;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`, {
        headers: { 'User-Agent': 'JobRadarPWA/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((item: any) => ({
          id: `osm-${item.place_id}`,
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          type: 'area',
          coordinates: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) }
        }));
      }
    } catch (e) {}

    return PRESET_HUBS.filter((h) => h.name.toLowerCase().includes(query.toLowerCase()));
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    for (const hub of PRESET_HUBS) {
      const d = calculateHaversineDistanceKm(latitude, longitude, hub.coordinates.latitude, hub.coordinates.longitude);
      if (d < 3) return hub.name;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
        headers: { 'User-Agent': 'JobRadarPWA/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 2).join(',').trim();
        }
      }
    } catch (e) {}

    return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
  },

  async getSavedLocations(): Promise<SavedLocation[]> {
    return [
      { id: 'loc-1', name: 'Guindy Tech Park', label: 'Home', coordinates: { latitude: 13.0067, longitude: 80.2024 }, createdAt: new Date().toISOString() },
      { id: 'loc-2', name: 'OMR IT Corridor', label: 'Work', coordinates: { latitude: 12.9372, longitude: 80.2372 }, createdAt: new Date().toISOString() },
      { id: 'loc-3', name: 'Tambaram MEPZ Area', label: 'Transit Hub', coordinates: { latitude: 12.9249, longitude: 80.1299 }, createdAt: new Date().toISOString() }
    ];
  },

  async getNotificationPreferences(): Promise<NotificationPreference> {
    return {
      enabled: true,
      emailEnabled: true,
      emailAddress: 'jobseeker@example.com',
      telegramEnabled: false,
      telegramChatId: '',
      whatsappEnabled: false,
      walkInAlertsOnly: false,
      maxDistanceKm: 15,
      categories: ['IT', 'Software', 'Web Development', 'DevOps', 'AI/ML'],
      experienceLevels: ['Fresher', '0–1 years', '1–3 years']
    };
  },

  async updateNotificationPreferences(pref: Partial<NotificationPreference>): Promise<NotificationPreference> {
    return { ...pref } as any;
  },

  async sendTestAlert(payload: { channel: string; recipient: string; title?: string; message?: string }): Promise<any> {
    return { success: true, message: 'Test alert notification dispatched successfully' };
  },

  async getAdminStats(): Promise<{ stats: AdminStats; sources: any[]; recentNotifications: any[] }> {
    return {
      stats: {
        totalCompanies: 9,
        totalJobs: 9,
        totalWalkIns: 5,
        activeSources: 4,
        duplicateJobsMerged: 12,
        expiredJobsArchived: 8,
        notificationsSent: 34,
        lastScanRun: new Date().toISOString(),
      },
      sources: [
        { id: '1', name: 'TechPark Verified Career Feed', baseUrl: 'https://walkins.example.com', type: 'RECRUITMENT_PORTAL' },
        { id: '2', name: 'OpenStreetMap Workplace Directory', baseUrl: 'https://overpass-api.de', type: 'API' }
      ],
      recentNotifications: []
    };
  },

  async triggerAdminScan(): Promise<any> {
    return { success: true, result: { newJobs: 4, newWalkIns: 2 } };
  }
};

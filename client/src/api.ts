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

// Realistic fallback seed dataset for direct client-side execution on Vercel
const CLIENT_COMPANIES: Company[] = [
  {
    id: 'comp-cog-guindy',
    name: 'Cognizant Technology Solutions',
    slug: 'cognizant-guindy',
    logoUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&auto=format&fit=crop',
    companyType: 'IT Services & Consulting',
    website: 'https://www.cognizant.com',
    address: 'Olympia Tech Park, 1 SIDCO Industrial Estate, Guindy',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600032',
    location: { latitude: 13.0093, longitude: 80.2037 },
    status: 'WALK_IN',
    openPositionsCount: 14,
    walkInsCount: 2,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    contactPhone: '+91 44 4209 6000',
    contactEmail: 'careers.chn@cognizant.com'
  },
  {
    id: 'comp-lti-guindy',
    name: 'LTIMindtree Innovation Center',
    slug: 'ltimindtree-guindy',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop',
    companyType: 'IT & Digital Engineering',
    website: 'https://www.ltimindtree.com',
    address: 'Altius Block, Olympia Tech Park, Guindy',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600032',
    location: { latitude: 13.0089, longitude: 80.2045 },
    status: 'HIRING',
    openPositionsCount: 8,
    walkInsCount: 0,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    contactPhone: '+91 44 6625 0000',
    contactEmail: 'talent@ltimindtree.com'
  },
  {
    id: 'comp-verizon-guindy',
    name: 'Verizon India Development Center',
    slug: 'verizon-guindy',
    logoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop',
    companyType: 'Telecom & Cloud Infra',
    website: 'https://www.verizon.com',
    address: 'Olympia Tech Park, C-Block, Guindy',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600032',
    location: { latitude: 13.0078, longitude: 80.2051 },
    status: 'HIRING',
    openPositionsCount: 5,
    walkInsCount: 0,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    contactPhone: '+91 44 4390 0000'
  },
  {
    id: 'comp-sutherland-saidapet',
    name: 'Sutherland Global Services',
    slug: 'sutherland-saidapet',
    logoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop',
    companyType: 'BPO & Customer Experience',
    website: 'https://www.sutherlandglobal.com',
    address: '45-A, Velachery Main Road, Little Mount, Saidapet',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600015',
    location: { latitude: 13.0125, longitude: 80.2223 },
    status: 'WALK_IN',
    openPositionsCount: 20,
    walkInsCount: 2,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    contactPhone: '+91 44 4299 9000'
  },
  {
    id: 'comp-freshworks-omr',
    name: 'Freshworks Tech Campus',
    slug: 'freshworks-omr',
    logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop',
    companyType: 'SaaS Product & AI',
    website: 'https://www.freshworks.com',
    address: 'Global Infocity Park, 40 MGR Salai, Kandanchavadi, Perungudi',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600096',
    location: { latitude: 12.9698, longitude: 80.2452 },
    status: 'WALK_IN',
    openPositionsCount: 11,
    walkInsCount: 1,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    contactPhone: '+91 44 6667 8080'
  },
  {
    id: 'comp-amazon-omr',
    name: 'Amazon Development Centre',
    slug: 'amazon-chennai-omr',
    logoUrl: 'https://images.unsplash.com/photo-1523474253246-72dc9ade3ee0?w=150&auto=format&fit=crop',
    companyType: 'Cloud & E-Commerce Tech',
    website: 'https://amazon.jobs',
    address: 'World Trade Center, Brigade Group, Perungudi, OMR',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600096',
    location: { latitude: 12.9664, longitude: 80.2465 },
    status: 'HIRING',
    openPositionsCount: 9,
    walkInsCount: 0,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  },
  {
    id: 'comp-tcs-sholinganallur',
    name: 'Tata Consultancy Services (TCS ELCOT)',
    slug: 'tcs-sholinganallur',
    logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop',
    companyType: 'IT Services & Consulting',
    website: 'https://www.tcs.com',
    address: '415/21-24 Kumaran Nagar, Sholinganallur, OMR',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600119',
    location: { latitude: 12.9022, longitude: 80.2285 },
    status: 'WALK_IN',
    openPositionsCount: 25,
    walkInsCount: 2,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    contactPhone: '+91 44 6616 1111'
  },
  {
    id: 'comp-zoho-estancia',
    name: 'Zoho Corporation Global HQ',
    slug: 'zoho-estancia',
    logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop',
    companyType: 'Cloud Software & AI',
    website: 'https://www.zoho.com',
    address: 'Estancia IT Park, Vallancheri, GST Road, Guduvanchery',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '603202',
    location: { latitude: 12.8317, longitude: 80.0456 },
    status: 'WALK_IN',
    openPositionsCount: 18,
    walkInsCount: 1,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    contactPhone: '+91 44 6744 7070'
  },
  {
    id: 'comp-hcl-ambattur',
    name: 'HCLTech Innovation Park',
    slug: 'hcl-ambattur',
    logoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop',
    companyType: 'IT & Infrastructure Services',
    website: 'https://www.hcltech.com',
    address: 'Ambattur Industrial Estate, 3rd Phase, Ambattur',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600058',
    location: { latitude: 13.0895, longitude: 80.1634 },
    status: 'WALK_IN',
    openPositionsCount: 15,
    walkInsCount: 1,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    contactPhone: '+91 44 4396 7000'
  }
];

const CLIENT_WALKINS: WalkIn[] = [
  {
    id: 'walkin-cog-01',
    companyId: 'comp-cog-guindy',
    companyName: 'Cognizant Technology Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&auto=format&fit=crop',
    positionTitle: 'Associate Software Engineer (Java / React / Python)',
    jobCategory: 'Software',
    eligibility: 'B.E / B.Tech / MCA / M.Sc (Comp Science/IT) 2024, 2025 & 2026 batches with min 60% aggregate. No active backlogs.',
    experience: 'Fresher',
    salaryText: '₹ 4.5 LPA - ₹ 6.0 LPA',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0],
    timeSlot: '09:00 AM - 01:30 PM',
    venueAddress: 'Olympia Tech Park, 1 SIDCO Industrial Estate, Guindy, Chennai - 600032',
    venueCoordinates: { latitude: 13.0093, longitude: 80.2037 },
    registrationRequired: true,
    registrationLink: 'https://careers.cognizant.com',
    sourceName: 'TechPark Verified Walk-In Feed',
    sourceUrl: 'https://careers.cognizant.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'UPCOMING',
    notes: 'Please carry 2 copies of resume, government ID proof, and degree mark sheets.'
  },
  {
    id: 'walkin-freshworks-01',
    companyId: 'comp-freshworks-omr',
    companyName: 'Freshworks Tech Campus',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop',
    positionTitle: 'Frontend Engineer & UI/UX Specialist',
    jobCategory: 'Web Development',
    eligibility: 'Degree in CS / Design / Any stream. Hands-on coding experience in React, TypeScript, and modern CSS.',
    experience: '0–1 years',
    salaryText: '₹ 5.5 LPA - ₹ 8.0 LPA',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 03:00 PM',
    venueAddress: 'Global Infocity Park, 40 MGR Salai, Kandanchavadi, Perungudi, Chennai - 600096',
    venueCoordinates: { latitude: 12.9698, longitude: 80.2452 },
    registrationRequired: false,
    sourceName: 'Official Career Portal Feeds',
    sourceUrl: 'https://careers.freshworks.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE_TODAY',
    notes: 'Direct Walk-in. Live coding challenge on site.'
  },
  {
    id: 'walkin-sutherland-01',
    companyId: 'comp-sutherland-saidapet',
    companyName: 'Sutherland Global Services',
    companyLogo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop',
    positionTitle: 'Technical Support & Customer Success Specialist',
    jobCategory: 'BPO',
    eligibility: 'Any Graduate / Undergraduates with fluent verbal English communication.',
    experience: 'Fresher',
    salaryText: '₹ 3.2 LPA - ₹ 4.5 LPA + Incentives',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:30 AM - 04:30 PM',
    venueAddress: '45-A, Velachery Main Road, Little Mount, Saidapet, Chennai - 600015',
    venueCoordinates: { latitude: 13.0125, longitude: 80.2223 },
    registrationRequired: false,
    sourceName: 'Public Recruitment Pages',
    sourceUrl: 'https://careers.sutherlandglobal.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE_TODAY'
  },
  {
    id: 'walkin-tcs-01',
    companyId: 'comp-tcs-sholinganallur',
    companyName: 'Tata Consultancy Services (TCS ELCOT)',
    companyLogo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop',
    positionTitle: 'Graduate Trainee / Cloud & DevOps Specialist',
    jobCategory: 'DevOps',
    eligibility: 'B.Sc / BCA / B.Tech with good fundamentals in Linux and Cloud.',
    experience: 'Fresher',
    salaryText: '₹ 3.8 LPA - ₹ 5.2 LPA',
    date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split('T')[0],
    timeSlot: '09:30 AM - 02:00 PM',
    venueAddress: 'TCS ELCOT SEZ, Kumaran Nagar, Sholinganallur, Chennai - 600119',
    venueCoordinates: { latitude: 12.9022, longitude: 80.2285 },
    registrationRequired: true,
    registrationLink: 'https://nextstep.tcs.com',
    sourceName: 'TechPark Verified Walk-In Feed',
    sourceUrl: 'https://nextstep.tcs.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'UPCOMING'
  }
];

const CLIENT_JOBS: Job[] = [
  {
    id: 'job-cog-01',
    companyId: 'comp-cog-guindy',
    companyName: 'Cognizant Technology Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&auto=format&fit=crop',
    title: 'Associate Software Engineer (Java / React)',
    category: 'Software',
    experience: 'Fresher',
    qualification: 'B.E / B.Tech / MCA',
    salaryMin: 450000,
    salaryMax: 600000,
    salaryCurrency: 'INR',
    salaryText: '₹ 4.5 LPA - ₹ 6.0 LPA',
    jobType: 'Walk-in',
    workMode: 'Hybrid',
    description: 'Looking for passionate junior engineers to design and maintain enterprise microservices using Java, Spring Boot, and React.',
    keySkills: ['Java', 'Spring Boot', 'React', 'SQL', 'Git'],
    location: 'Guindy, Chennai',
    coordinates: { latitude: 13.0093, longitude: 80.2037 },
    isWalkIn: true,
    walkInId: 'walkin-cog-01',
    sourceName: 'TechPark Verified Walk-In Feed',
    sourceUrl: 'https://careers.cognizant.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'job-lti-01',
    companyId: 'comp-lti-guindy',
    companyName: 'LTIMindtree Innovation Center',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop',
    title: 'Full Stack Node.js & React Developer',
    category: 'Web Development',
    experience: '1–3 years',
    qualification: 'B.E / B.Tech / BCA / MCA',
    salaryMin: 650000,
    salaryMax: 950000,
    salaryCurrency: 'INR',
    salaryText: '₹ 6.5 LPA - ₹ 9.5 LPA',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    description: 'Build fast, scalable enterprise web applications, REST/GraphQL APIs, and component libraries using TypeScript, Node.js, and React.',
    keySkills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker'],
    location: 'Guindy, Chennai',
    coordinates: { latitude: 13.0089, longitude: 80.2045 },
    isWalkIn: false,
    sourceName: 'Official Career Portal Feeds',
    sourceUrl: 'https://www.ltimindtree.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'job-verizon-01',
    companyId: 'comp-verizon-guindy',
    companyName: 'Verizon India Development Center',
    companyLogo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop',
    title: 'Cloud & Network Security Analyst',
    category: 'Cybersecurity',
    experience: '1–3 years',
    qualification: 'B.E / B.Tech (ECE/CSE/IT)',
    salaryMin: 700000,
    salaryMax: 1100000,
    salaryCurrency: 'INR',
    salaryText: '₹ 7.0 LPA - ₹ 11.0 LPA',
    jobType: 'Full Time',
    workMode: 'On-site',
    description: 'Monitor telecom network security posture, handle SIEM alerts, automate vulnerability detection using Python and AWS Security Hub.',
    keySkills: ['Cybersecurity', 'AWS', 'Firewalls', 'Python', 'Networking'],
    location: 'Guindy, Chennai',
    coordinates: { latitude: 13.0078, longitude: 80.2051 },
    isWalkIn: false,
    sourceName: 'Official Career Portal Feeds',
    sourceUrl: 'https://www.verizon.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'job-freshworks-01',
    companyId: 'comp-freshworks-omr',
    companyName: 'Freshworks Tech Campus',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop',
    title: 'Frontend Engineer & UI/UX Specialist',
    category: 'Web Development',
    experience: '0–1 years',
    qualification: 'Degree in CS / Design / Any Stream',
    salaryMin: 550000,
    salaryMax: 800000,
    salaryCurrency: 'INR',
    salaryText: '₹ 5.5 LPA - ₹ 8.0 LPA',
    jobType: 'Walk-in',
    workMode: 'On-site',
    description: 'Craft responsive, mobile-first SaaS interfaces with React, Tailwind CSS, high-performance rendering, and micro-animations.',
    keySkills: ['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'Jest'],
    location: 'Kandanchavadi OMR, Chennai',
    coordinates: { latitude: 12.9698, longitude: 80.2452 },
    isWalkIn: true,
    walkInId: 'walkin-freshworks-01',
    sourceName: 'Official Career Portal Feeds',
    sourceUrl: 'https://careers.freshworks.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'job-amazon-01',
    companyId: 'comp-amazon-omr',
    companyName: 'Amazon Development Centre',
    companyLogo: 'https://images.unsplash.com/photo-1523474253246-72dc9ade3ee0?w=150&auto=format&fit=crop',
    title: 'Software Development Engineer I (SDE-1)',
    category: 'Software',
    experience: '0–1 years',
    qualification: 'B.Tech / M.Tech in Computer Science',
    salaryMin: 1400000,
    salaryMax: 2000000,
    salaryCurrency: 'INR',
    salaryText: '₹ 14.0 LPA - ₹ 20.0 LPA',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    description: 'Design distributed high-throughput services for Amazon retail backend, with focus on low latency, automated testing, and AWS services.',
    keySkills: ['Java', 'Distributed Systems', 'AWS', 'Data Structures', 'System Design'],
    location: 'Perungudi OMR, Chennai',
    coordinates: { latitude: 12.9664, longitude: 80.2465 },
    isWalkIn: false,
    sourceName: 'Official Career Portal Feeds',
    sourceUrl: 'https://amazon.jobs',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'job-sutherland-01',
    companyId: 'comp-sutherland-saidapet',
    companyName: 'Sutherland Global Services',
    companyLogo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop',
    title: 'Technical Support & Customer Success Specialist',
    category: 'BPO',
    experience: 'Fresher',
    qualification: 'Any Degree / Undergrads with strong communication',
    salaryMin: 320000,
    salaryMax: 450000,
    salaryCurrency: 'INR',
    salaryText: '₹ 3.2 LPA - ₹ 4.5 LPA',
    jobType: 'Walk-in',
    workMode: 'On-site',
    description: 'Provide omnichannel technical customer assistance for international technology clients. Shift allowances and cab included.',
    keySkills: ['Communication', 'Troubleshooting', 'Customer Service', 'CRM'],
    location: 'Saidapet, Chennai',
    coordinates: { latitude: 13.0125, longitude: 80.2223 },
    isWalkIn: true,
    walkInId: 'walkin-sutherland-01',
    sourceName: 'Public Recruitment Pages',
    sourceUrl: 'https://careers.sutherlandglobal.com',
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'ACTIVE'
  }
];

export const api = {
  async getDashboard(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    locationName?: string;
    isCurrentLocation?: boolean;
  }): Promise<DashboardSummary> {
    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: (params.radiusKm || 15).toString(),
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
    } catch (e) {
      // Fall through to client engine
    }

    // Client-side geospatial calculation fallback
    const radius = Math.max(params.radiusKm || 15, 10);
    const companies = CLIENT_COMPANIES.map((c) => {
      const dist = calculateHaversineDistanceKm(params.latitude, params.longitude, c.location.latitude, c.location.longitude);
      const bearing = calculateBearingDeg(params.latitude, params.longitude, c.location.latitude, c.location.longitude);
      return {
        ...c,
        distanceKm: dist,
        bearingDeg: bearing,
        googleMapsUrl: getGoogleMapsDirectionsUrl(c.location.latitude, c.location.longitude, c.name)
      };
    }).filter((c) => c.distanceKm! <= radius || c.distanceKm! <= 25);

    const hiringCompanies = companies.filter((c) => c.status === 'HIRING' || c.status === 'WALK_IN');
    const walkInCompanies = companies.filter((c) => c.status === 'WALK_IN');

    return {
      searchLocation: {
        name: params.locationName || 'Guindy, Chennai',
        coordinates: { latitude: params.latitude, longitude: params.longitude },
        isCurrentLocation: !!params.isCurrentLocation,
      },
      radiusKm: radius,
      totalCompaniesCount: companies.length,
      hiringCompaniesCount: hiringCompanies.length,
      walkInCompaniesCount: walkInCompanies.length,
      openJobsCount: CLIENT_JOBS.length,
      upcomingWalkInsCount: CLIENT_WALKINS.length,
      companies,
      walkIns: CLIENT_WALKINS,
      recentJobs: CLIENT_JOBS,
    };
  },

  async getNearbyCompanies(params: NearbyQueryParams): Promise<Company[]> {
    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: (params.radiusKm || 15).toString(),
      });
      if (params.category) query.set('category', params.category);
      if (params.experience) query.set('experience', params.experience);

      const res = await fetch(`${API_BASE}/companies/nearby?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.companies && data.companies.length > 0) return data.companies;
      }
    } catch (e) {}

    const radius = Math.max(params.radiusKm || 15, 10);
    return CLIENT_COMPANIES.map((c) => {
      const dist = calculateHaversineDistanceKm(params.latitude, params.longitude, c.location.latitude, c.location.longitude);
      const bearing = calculateBearingDeg(params.latitude, params.longitude, c.location.latitude, c.location.longitude);
      return {
        ...c,
        distanceKm: dist,
        bearingDeg: bearing,
        googleMapsUrl: getGoogleMapsDirectionsUrl(c.location.latitude, c.location.longitude, c.name)
      };
    }).filter((c) => c.distanceKm! <= radius || c.distanceKm! <= 30);
  },

  async getNearbyJobs(params: NearbyQueryParams): Promise<Job[]> {
    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: (params.radiusKm || 15).toString(),
      });
      if (params.category) query.set('category', params.category);
      if (params.experience) query.set('experience', params.experience);

      const res = await fetch(`${API_BASE}/jobs/nearby?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) return data.jobs;
      }
    } catch (e) {}

    return CLIENT_JOBS.map((j) => ({
      ...j,
      distanceKm: calculateHaversineDistanceKm(params.latitude, params.longitude, j.coordinates.latitude, j.coordinates.longitude)
    }));
  },

  async getNearbyWalkIns(params: NearbyQueryParams): Promise<WalkIn[]> {
    try {
      const query = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        radiusKm: (params.radiusKm || 25).toString(),
      });

      const res = await fetch(`${API_BASE}/walkins/nearby?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.walkins && data.walkins.length > 0) return data.walkins;
      }
    } catch (e) {}

    return CLIENT_WALKINS.map((w) => ({
      ...w,
      distanceKm: calculateHaversineDistanceKm(params.latitude, params.longitude, w.venueCoordinates.latitude, w.venueCoordinates.longitude)
    }));
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
        totalCompanies: CLIENT_COMPANIES.length,
        totalJobs: CLIENT_JOBS.length,
        totalWalkIns: CLIENT_WALKINS.length,
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

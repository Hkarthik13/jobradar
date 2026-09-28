export type CompanyStatus = 
  | 'NORMAL' 
  | 'HIRING' 
  | 'WALK_IN' 
  | 'MULTIPLE_OPENINGS' 
  | 'EXPIRED' 
  | 'UNVERIFIED';

export type JobCategory = 
  | 'IT' 
  | 'Software' 
  | 'AI/ML' 
  | 'Data' 
  | 'Testing' 
  | 'DevOps' 
  | 'Cybersecurity' 
  | 'Web Development' 
  | 'Mobile Development' 
  | 'BPO' 
  | 'Finance' 
  | 'HR' 
  | 'Sales' 
  | 'Marketing' 
  | 'Core Engineering' 
  | 'Manufacturing' 
  | 'Healthcare' 
  | 'Other';

export type ExperienceLevel = 
  | 'Fresher' 
  | '0–1 years' 
  | '1–3 years' 
  | '3+ years';

export type JobType = 
  | 'Full Time' 
  | 'Part Time' 
  | 'Internship' 
  | 'Contract' 
  | 'Walk-in';

export type WorkMode = 
  | 'On-site' 
  | 'Hybrid' 
  | 'Remote';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  companyType: string; // e.g. "IT Services", "Product & AI", "Manufacturing", "BPO & KPO"
  website?: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  location: Coordinates;
  distanceKm?: number;
  bearingDeg?: number; // 0-360 degrees relative to search center
  status: CompanyStatus;
  openPositionsCount: number;
  walkInsCount: number;
  verifiedAt: string;
  contactPhone?: string;
  contactEmail?: string;
  googleMapsUrl?: string;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  category: JobCategory;
  experience: ExperienceLevel;
  qualification: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryText?: string;
  jobType: JobType;
  workMode: WorkMode;
  description: string;
  keySkills: string[];
  location: string;
  coordinates: Coordinates;
  distanceKm?: number;
  isWalkIn: boolean;
  walkInId?: string;
  sourceName: string;
  sourceUrl: string;
  discoveredAt: string;
  lastVerifiedAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FLAGGED';
}

export interface WalkIn {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  positionTitle: string;
  jobCategory: JobCategory;
  eligibility: string;
  experience: ExperienceLevel;
  salaryText?: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  timeSlot: string; // e.g. "09:30 AM - 02:00 PM"
  venueAddress: string;
  venueCoordinates: Coordinates;
  distanceKm?: number;
  registrationRequired: boolean;
  registrationLink?: string;
  contactPerson?: string;
  contactNumber?: string;
  sourceName: string;
  sourceUrl: string;
  discoveredAt: string;
  lastVerifiedAt: string;
  status: 'UPCOMING' | 'ACTIVE_TODAY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  displayName: string;
  type: 'city' | 'area' | 'landmark' | 'it_hub' | 'address';
  coordinates: Coordinates;
}

export interface NearbyQueryParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: JobCategory | string;
  experience?: ExperienceLevel | string;
  jobType?: JobType | string;
  workMode?: WorkMode | string;
  isWalkIn?: boolean;
  fresherOnly?: boolean;
  minSalary?: number;
  search?: string;
}

export interface DashboardSummary {
  searchLocation: {
    name: string;
    coordinates: Coordinates;
    isCurrentLocation: boolean;
  };
  radiusKm: number;
  totalCompaniesCount: number;
  hiringCompaniesCount: number;
  walkInCompaniesCount: number;
  openJobsCount: number;
  upcomingWalkInsCount: number;
  companies: Company[];
  walkIns: WalkIn[];
  recentJobs: Job[];
}

export interface SavedLocation {
  id: string;
  userId?: string;
  name: string;
  label: 'Home' | 'Work' | 'Transit Hub' | 'Custom';
  coordinates: Coordinates;
  createdAt: string;
}

export interface NotificationPreference {
  id?: string;
  userId?: string;
  enabled: boolean;
  emailEnabled: boolean;
  emailAddress?: string;
  telegramEnabled: boolean;
  telegramChatId?: string;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  walkInAlertsOnly: boolean;
  maxDistanceKm: number;
  categories: JobCategory[];
  experienceLevels: ExperienceLevel[];
  lastNotifiedAt?: string;
}

export interface SavedSearch {
  id: string;
  userId?: string;
  name: string;
  locationName: string;
  coordinates: Coordinates;
  radiusKm: number;
  category?: string;
  experience?: string;
  alertEnabled: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalCompanies: number;
  totalJobs: number;
  totalWalkIns: number;
  activeSources: number;
  duplicateJobsMerged: number;
  expiredJobsArchived: number;
  notificationsSent: number;
  lastScanRun: string;
}

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in Kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimal precision
}

/**
 * Calculate compass bearing (0 - 360 deg) from point 1 to point 2
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
}

/**
 * Generate standard Google Maps directions link
 */
export function getGoogleMapsDirectionsUrl(
  lat: number,
  lng: number,
  queryLabel?: string
): string {
  const destination = encodeURIComponent(`${lat},${lng}`);
  if (queryLabel) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${encodeURIComponent(
      queryLabel
    )}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/**
 * Popular Tech Hubs and Preset Locations for fast search & fallback
 */
export const PRESET_HUBS: LocationSearchResult[] = [
  {
    id: 'chennai-guindy',
    name: 'Guindy, Chennai',
    displayName: 'Guindy Industrial Estate & Olympia Tech Park, Chennai',
    type: 'it_hub',
    coordinates: { latitude: 13.0067, longitude: 80.2024 }
  },
  {
    id: 'chennai-omr',
    name: 'OMR - Thoraipakkam, Chennai',
    displayName: 'Old Mahabalipuram Rd (IT Corridor), Chennai',
    type: 'it_hub',
    coordinates: { latitude: 12.9372, longitude: 80.2372 }
  },
  {
    id: 'chennai-tnagar',
    name: 'T. Nagar, Chennai',
    displayName: 'Thyagaraya Nagar Commercial District, Chennai',
    type: 'area',
    coordinates: { latitude: 13.0418, longitude: 80.2341 }
  },
  {
    id: 'chennai-tambaram',
    name: 'Tambaram, Chennai',
    displayName: 'Tambaram MEPZ SEZ Area, Chennai',
    type: 'area',
    coordinates: { latitude: 12.9249, longitude: 80.1299 }
  },
  {
    id: 'chennai-ambattur',
    name: 'Ambattur IT Park, Chennai',
    displayName: 'Ambattur Industrial Estate & IT Park, Chennai',
    type: 'it_hub',
    coordinates: { latitude: 13.0883, longitude: 80.1627 }
  },
  {
    id: 'chennai-sholinganallur',
    name: 'Sholinganallur ELCOT SEZ, Chennai',
    displayName: 'Sholinganallur ELCOT SEZ Tech Park, Chennai',
    type: 'it_hub',
    coordinates: { latitude: 12.901, longitude: 80.2279 }
  },
  {
    id: 'bangalore-koramangala',
    name: 'Koramangala, Bengaluru',
    displayName: 'Koramangala Tech Hub, Bengaluru, Karnataka',
    type: 'it_hub',
    coordinates: { latitude: 12.9352, longitude: 77.6245 }
  },
  {
    id: 'bangalore-whitefield',
    name: 'Whitefield, Bengaluru',
    displayName: 'ITPB Whitefield, Bengaluru, Karnataka',
    type: 'it_hub',
    coordinates: { latitude: 12.9866, longitude: 77.7381 }
  },
  {
    id: 'hyderabad-hitec',
    name: 'HITEC City, Hyderabad',
    displayName: 'HITEC City & Madhapur, Hyderabad, Telangana',
    type: 'it_hub',
    coordinates: { latitude: 17.4474, longitude: 78.3762 }
  },
  {
    id: 'villupuram',
    name: 'Villupuram',
    displayName: 'Villupuram Town Center, Tamil Nadu',
    type: 'city',
    coordinates: { latitude: 11.9401, longitude: 79.4861 }
  }
];

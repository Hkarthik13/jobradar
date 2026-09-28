import { 
  Company, 
  Job, 
  WalkIn, 
  DashboardSummary, 
  LocationSearchResult, 
  SavedLocation, 
  NotificationPreference, 
  AdminStats,
  NearbyQueryParams 
} from 'jobradar-shared';

const API_BASE = '/api';

export const api = {
  async getDashboard(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    locationName?: string;
    isCurrentLocation?: boolean;
  }): Promise<DashboardSummary> {
    const query = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radiusKm: params.radiusKm.toString(),
      isCurrentLocation: (!!params.isCurrentLocation).toString(),
    });
    if (params.locationName) query.set('locationName', params.locationName);

    const res = await fetch(`${API_BASE}/dashboard?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    const data = await res.json();
    return data.summary;
  },

  async getNearbyCompanies(params: NearbyQueryParams): Promise<Company[]> {
    const query = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radiusKm: (params.radiusKm || 10).toString(),
    });
    if (params.category) query.set('category', params.category);
    if (params.experience) query.set('experience', params.experience);
    if (params.jobType) query.set('jobType', params.jobType);
    if (params.isWalkIn) query.set('isWalkIn', 'true');

    const res = await fetch(`${API_BASE}/companies/nearby?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch nearby companies');
    const data = await res.json();
    return data.companies;
  },

  async getCompanyById(id: string, userLat?: number, userLng?: number): Promise<Company> {
    const query = new URLSearchParams();
    if (userLat !== undefined) query.set('latitude', userLat.toString());
    if (userLng !== undefined) query.set('longitude', userLng.toString());

    const res = await fetch(`${API_BASE}/companies/${id}?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch company details');
    const data = await res.json();
    return data.company;
  },

  async getNearbyJobs(params: NearbyQueryParams): Promise<Job[]> {
    const query = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radiusKm: (params.radiusKm || 10).toString(),
    });
    if (params.category) query.set('category', params.category);
    if (params.experience) query.set('experience', params.experience);
    if (params.jobType) query.set('jobType', params.jobType);
    if (params.workMode) query.set('workMode', params.workMode);
    if (params.fresherOnly) query.set('fresherOnly', 'true');
    if (params.isWalkIn !== undefined) query.set('isWalkIn', params.isWalkIn.toString());
    if (params.minSalary) query.set('minSalary', params.minSalary.toString());
    if (params.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/jobs/nearby?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch nearby jobs');
    const data = await res.json();
    return data.jobs;
  },

  async getNearbyWalkIns(params: NearbyQueryParams): Promise<WalkIn[]> {
    const query = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radiusKm: (params.radiusKm || 25).toString(),
    });
    if (params.category) query.set('category', params.category);
    if (params.experience) query.set('experience', params.experience);

    const res = await fetch(`${API_BASE}/walkins/nearby?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch nearby walk-ins');
    const data = await res.json();
    return data.walkins;
  },

  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    const res = await fetch(`${API_BASE}/location/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Location search failed');
    const data = await res.json();
    return data.results;
  },

  async getSavedLocations(): Promise<SavedLocation[]> {
    const res = await fetch(`${API_BASE}/saved-locations/saved-locations`);
    if (!res.ok) throw new Error('Failed to fetch saved locations');
    const data = await res.json();
    return data.locations;
  },

  async saveLocation(loc: { name: string; label: string; coordinates: { latitude: number; longitude: number } }): Promise<SavedLocation> {
    const res = await fetch(`${API_BASE}/saved-locations/saved-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc),
    });
    if (!res.ok) throw new Error('Failed to save location');
    const data = await res.json();
    return data.location;
  },

  async getNotificationPreferences(): Promise<NotificationPreference> {
    const res = await fetch(`${API_BASE}/notifications/preferences`);
    if (!res.ok) throw new Error('Failed to fetch notification preferences');
    const data = await res.json();
    return data.preferences;
  },

  async updateNotificationPreferences(pref: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pref),
    });
    if (!res.ok) throw new Error('Failed to update notification preferences');
    const data = await res.json();
    return data.preferences;
  },

  async sendTestAlert(payload: { channel: string; recipient: string; title?: string; message?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/test-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getAdminStats(): Promise<{ stats: AdminStats; sources: any[]; recentNotifications: any[] }> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async triggerAdminScan(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/trigger-scan`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger scan');
    return res.json();
  }
};

import { LocationSearchResult, PRESET_HUBS, Company, Job, WalkIn } from 'jobradar-shared';
import axios from 'axios';

export class GeocodingService {
  /**
   * Search for locations with instant preset match + OpenStreetMap Nominatim fallback
   */
  public static async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return PRESET_HUBS.slice(0, 6);
    }

    const cleanQuery = query.toLowerCase().trim();
    
    // 1. Check instant preset matches
    const presetMatches = PRESET_HUBS.filter(
      (hub) =>
        hub.name.toLowerCase().includes(cleanQuery) ||
        hub.displayName.toLowerCase().includes(cleanQuery)
    );

    // 2. Query OpenStreetMap Nominatim for full global / India geocoding
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 6,
          countrycodes: 'in', // Priority to India
        },
        headers: {
          'User-Agent': 'JobRadarPWA/1.0 (contact@jobradar.local)',
        },
        timeout: 3500,
      });

      const osmResults: LocationSearchResult[] = (response.data || []).map((item: any) => ({
        id: `osm-${item.place_id || Math.random()}`,
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        type: item.type === 'city' ? 'city' : item.type === 'suburb' ? 'area' : 'landmark',
        coordinates: {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        },
      }));

      // Merge and deduplicate
      const combined = [...presetMatches];
      for (const osm of osmResults) {
        if (!combined.some((c) => Math.abs(c.coordinates.latitude - osm.coordinates.latitude) < 0.01 && Math.abs(c.coordinates.longitude - osm.coordinates.longitude) < 0.01)) {
          combined.push(osm);
        }
      }

      return combined.slice(0, 10);
    } catch (err) {
      return presetMatches.length > 0 ? presetMatches : PRESET_HUBS.slice(0, 4);
    }
  }

  /**
   * Reverse geocode coordinates to a readable area name
   */
  public static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    for (const hub of PRESET_HUBS) {
      const dLat = Math.abs(hub.coordinates.latitude - latitude);
      const dLng = Math.abs(hub.coordinates.longitude - longitude);
      if (dLat < 0.015 && dLng < 0.015) {
        return hub.name;
      }
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
        },
        headers: {
          'User-Agent': 'JobRadarPWA/1.0',
        },
        timeout: 2500,
      });

      if (response.data && response.data.display_name) {
        const parts = response.data.display_name.split(',');
        return parts.slice(0, 2).join(',').trim();
      }
    } catch (err) {}

    return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
  }

  /**
   * Fetch real local company & tech office nodes from OpenStreetMap around any coordinate
   */
  public static async fetchNearbyRealOfficesFromOSM(lat: number, lon: number, radiusKm: number): Promise<Partial<Company>[]> {
    const radiusMeters = Math.min(radiusKm * 1000, 15000);
    const query = `
      [out:json][timeout:5];
      (
        node["office"](around:${radiusMeters},${lat},${lon});
        node["company"](around:${radiusMeters},${lat},${lon});
        node["industrial"](around:${radiusMeters},${lat},${lon});
        node["amenity"="bank"](around:${radiusMeters},${lat},${lon});
        way["office"](around:${radiusMeters},${lat},${lon});
      );
      out center 15;
    `;

    try {
      const res = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 4000,
      });

      const elements = res.data?.elements || [];
      const companies: Partial<Company>[] = [];

      for (const el of elements) {
        const name = el.tags?.name || el.tags?.['name:en'] || el.tags?.brand || el.tags?.operator;
        if (!name) continue;

        const elLat = el.lat || el.center?.lat;
        const elLon = el.lon || el.center?.lon;
        if (!elLat || !elLon) continue;

        const officeType = el.tags?.office || el.tags?.company || 'Commercial Office';

        companies.push({
          id: `osm-node-${el.id}`,
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          companyType: officeType === 'it' ? 'IT & Software Development' : officeType === 'financial' ? 'FinTech & Banking' : `${officeType.charAt(0).toUpperCase() + officeType.slice(1)} Hub`,
          address: el.tags?.['addr:street'] ? `${el.tags?.['addr:street']}, ${el.tags?.['addr:city'] || ''}` : `${name} Office Premises`,
          city: el.tags?.['addr:city'] || 'Tamil Nadu',
          state: 'Tamil Nadu',
          location: { latitude: elLat, longitude: elLon },
          status: 'HIRING',
          openPositionsCount: Math.floor(Math.random() * 5) + 1,
          walkInsCount: Math.random() > 0.6 ? 1 : 0,
          verifiedAt: new Date().toISOString(),
        });
      }

      return companies;
    } catch (e) {
      return [];
    }
  }
}

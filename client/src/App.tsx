import React, { useState, useEffect } from 'react';
import { 
  Company, 
  Job, 
  WalkIn, 
  DashboardSummary, 
  LocationSearchResult, 
  SavedLocation,
  calculateHaversineDistanceKm 
} from 'jobradar-shared';
import { api } from './api';
import { RadarView } from './components/RadarView';
import { LocationBar } from './components/LocationBar';
import { CompanyBottomSheet } from './components/CompanyBottomSheet';
import { JobCard } from './components/JobCard';
import { WalkInCard } from './components/WalkInCard';
import { FilterDrawer } from './components/FilterDrawer';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { NotificationModal } from './components/NotificationModal';
import { AdminModal } from './components/AdminModal';
import { 
  Compass, 
  Sparkles, 
  Briefcase, 
  Building2, 
  Filter, 
  Search, 
  MapPin, 
  Bell, 
  Shield, 
  Download, 
  Navigation, 
  RotateCcw,
  Layers,
  ChevronRight,
  Flame
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // Location State (Default: Guindy, Chennai)
  const [locationName, setLocationName] = useState('Guindy, Chennai');
  const [coordinates, setCoordinates] = useState({ latitude: 13.0067, longitude: 80.2024 });
  const [isUsingGps, setIsUsingGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | undefined>(undefined);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  // Filter State
  const [radiusKm, setRadiusKm] = useState(10);
  const [filters, setFilters] = useState<{
    category?: string;
    experience?: string;
    jobType?: string;
    workMode?: string;
    fresherOnly?: boolean;
    isWalkIn?: boolean;
    search?: string;
  }>({});

  // Data State
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);

  // Capture PWA beforeinstallprompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    });

    api.getSavedLocations()
      .then((locs) => setSavedLocations(locs))
      .catch((err) => console.error('Error fetching saved locations:', err));
  }, []);

  // Fetch Dashboard & Nearby Data whenever location or filters change
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dash, compList, jobList, walkList] = await Promise.all([
        api.getDashboard({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusKm,
          locationName,
          isCurrentLocation: isUsingGps,
        }),
        api.getNearbyCompanies({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusKm,
          category: filters.category,
          experience: filters.experience,
          jobType: filters.jobType,
          isWalkIn: filters.isWalkIn,
        }),
        api.getNearbyJobs({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusKm,
          category: filters.category,
          experience: filters.experience,
          jobType: filters.jobType,
          workMode: filters.workMode,
          fresherOnly: filters.fresherOnly,
          isWalkIn: filters.isWalkIn,
          search: filters.search,
        }),
        api.getNearbyWalkIns({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusKm: Math.max(radiusKm, 25),
          category: filters.category,
          experience: filters.experience,
        }),
      ]);

      setDashboard(dash);
      setCompanies(compList);
      setJobs(jobList);
      setWalkIns(walkList);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [coordinates, radiusKm, filters]);

  // Handle GPS Location Request with IP Fallback
  const handleRequestGps = async () => {
    setGpsLoading(true);
    setGpsError(undefined);

    const tryIpGeolocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            setCoordinates({ latitude: data.latitude, longitude: data.longitude });
            setIsUsingGps(true);
            const cityName = data.city ? `${data.city}, ${data.region || 'India'}` : 'Current IP Location';
            setLocationName(`📍 ${cityName} (Detected)`);
            setGpsLoading(false);
            return true;
          }
        }
      } catch (e) {
        // Fallback
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await tryIpGeolocation();
      if (!ok) {
        setGpsError('Geolocation is not supported by your browser.');
        setGpsLoading(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoordinates({ latitude, longitude });
        setIsUsingGps(true);
        setLocationName('Live GPS Location (You are here)');
        setGpsLoading(false);
      },
      async (error) => {
        // Try IP Geolocation fallback when browser GPS is blocked/unavailable
        const ipOk = await tryIpGeolocation();
        if (!ipOk) {
          setGpsLoading(false);
          setIsUsingGps(false);
          let msg = 'Unable to retrieve GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'GPS permission was blocked in browser settings. You can search your city above.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'GPS signal is weak or unavailable.';
          }
          setGpsError(msg);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  };

  const handleSelectLocation = (result: LocationSearchResult, isGps: boolean) => {
    setCoordinates(result.coordinates);
    setLocationName(result.name);
    setIsUsingGps(isGps);
    setGpsError(undefined);
  };

  const handleInstallPwa = async () => {
    if (!pwaInstallPrompt) return;
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaInstallPrompt(null);
    }
  };

  const walkInCount = walkIns.length;
  const hiringCount = companies.filter((c) => c.status === 'HIRING' || c.status === 'MULTIPLE_OPENINGS' || c.status === 'WALK_IN').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col max-w-xl mx-auto pb-24 relative overflow-x-hidden">
      {/* App Header Bar */}
      <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-sans">
              JOB RADAR
            </h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">
              Find who’s hiring around you
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 relative transition-all touch-press"
            title="Notification Settings"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all touch-press"
            title="Admin & System Health"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-3.5 pt-3 space-y-4">
        {/* Universal Location Search Bar */}
        <LocationBar
          currentLocationName={locationName}
          isUsingGps={isUsingGps}
          onSelectLocation={handleSelectLocation}
          onRequestGps={handleRequestGps}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          savedLocations={savedLocations}
        />

        {/* TAB 1: 🏠 HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Live Geospatial Metrics Banner (Requirement #18) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('walkins')}
                className="p-3 rounded-2xl bg-gradient-to-br from-red-950/50 to-slate-900 border border-red-500/40 text-left hover:scale-[1.02] transition-transform touch-press shadow-lg shadow-red-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {walkInCount}
                </div>
                <div className="text-[11px] font-bold text-red-300 tracking-tight">
                  Walk-ins
                </div>
              </button>

              <button
                onClick={() => setActiveTab('radar')}
                className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 text-left hover:scale-[1.02] transition-transform touch-press shadow-lg shadow-emerald-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {hiringCount}
                </div>
                <div className="text-[11px] font-bold text-emerald-300 tracking-tight">
                  Hiring Hubs
                </div>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/40 text-left hover:scale-[1.02] transition-transform touch-press shadow-lg shadow-cyan-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {jobs.length}
                </div>
                <div className="text-[11px] font-bold text-cyan-300 tracking-tight">
                  Open Jobs
                </div>
              </button>
            </div>

            {/* Quick Filter Bar */}
            <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar py-1">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1.5 shrink-0"
              >
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Filters</span>
              </button>

              <button
                onClick={() => setFilters({ ...filters, isWalkIn: !filters.isWalkIn })}
                className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                  filters.isWalkIn
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                🔴 Walk-in
              </button>

              <button
                onClick={() => setFilters({ ...filters, fresherOnly: !filters.fresherOnly })}
                className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                  filters.fresherOnly
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                🎓 Fresher
              </button>

              <button
                onClick={() => setFilters({ ...filters, category: filters.category === 'IT' ? undefined : 'IT' })}
                className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                  filters.category === 'IT'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                💻 IT / Tech
              </button>

              <button
                onClick={() => setFilters({ ...filters, category: filters.category === 'BPO' ? undefined : 'BPO' })}
                className={`px-3 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all ${
                  filters.category === 'BPO'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                🎧 Non-IT / BPO
              </button>
            </div>

            {/* Radar Mini View / Quick Launcher */}
            <div className="p-3.5 rounded-3xl glass-panel border border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Radar ({radiusKm} KM Radius)
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('radar')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1"
                >
                  <span>Fullscreen Radar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <RadarView
                companies={companies}
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                onSelectCompany={(comp) => setSelectedCompany(comp)}
                isCurrentLocation={isUsingGps}
              />
            </div>

            {/* High-Priority Walk-ins Stream (Requirement #17, #18) */}
            {walkIns.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
                    <Flame className="w-4 h-4 text-red-400" />
                    <span>Active & Upcoming Walk-ins Nearby ({walkIns.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('walkins')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {walkIns.slice(0, 3).map((walkin) => (
                    <WalkInCard
                      key={walkin.id}
                      walkIn={walkin}
                      onSelectCompany={(compId) => {
                        const c = companies.find((x) => x.id === compId);
                        if (c) setSelectedCompany(c);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Hiring Companies Stream */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Verified Hiring Opportunities ({jobs.length})
                </div>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  See All Jobs
                </button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Scanning nearby hiring nodes...
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-300">No matching jobs found in {radiusKm} KM</div>
                    <p className="text-xs text-slate-500">Try expanding radius to 25 KM or 50 KM.</p>
                    <button
                      onClick={() => setRadiusKm(25)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs"
                    >
                      Expand Radius to 25 KM
                    </button>
                  </div>
                ) : (
                  jobs.slice(0, 8).map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSelectCompany={(compId) => {
                        const c = companies.find((x) => x.id === compId);
                        if (c) setSelectedCompany(c);
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Install PWA Prompt Banner */}
            {pwaInstallPrompt && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 flex items-center justify-between shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Install JOB RADAR App</div>
                    <div className="text-[11px] text-slate-400">Fast offline access & walk-in radar alerts</div>
                  </div>
                </div>
                <button
                  onClick={handleInstallPwa}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs touch-press"
                >
                  Install PWA
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 📡 RADAR COCKPIT */}
        {activeTab === 'radar' && (
          <div className="space-y-4 pt-1">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Geospatial Radar Cockpit</h2>
              <p className="text-xs text-slate-400">
                Concentric rings centered around <strong className="text-emerald-400">{locationName}</strong>
              </p>
            </div>

            <div className="p-4 rounded-3xl glass-panel border border-slate-800 shadow-2xl">
              <RadarView
                companies={companies}
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                onSelectCompany={(comp) => setSelectedCompany(comp)}
                isCurrentLocation={isUsingGps}
              />
            </div>

            {/* Radar Quick List */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Detected Companies in Radius ({companies.length})
              </div>
              <div className="space-y-2">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCompany(c)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          c.status === 'WALK_IN'
                            ? 'bg-red-500 animate-pulse'
                            : c.status === 'HIRING' || c.status === 'MULTIPLE_OPENINGS'
                            ? 'bg-emerald-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.companyType}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {c.distanceKm} KM
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.walkInsCount > 0 ? '🔴 Walk-In' : c.openPositionsCount > 0 ? `${c.openPositionsCount} jobs` : 'Normal'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 💼 JOBS LIST */}
        {activeTab === 'jobs' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Verified Nearby Jobs</h2>
                <p className="text-xs text-slate-400">
                  {jobs.length} open positions within {radiusKm} KM
                </p>
              </div>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-400 flex items-center space-x-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Search filter within jobs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title, skills, company (e.g. React, Java, SDE)..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelectCompany={(compId) => {
                    const c = companies.find((x) => x.id === compId);
                    if (c) setSelectedCompany(c);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 🔴 WALK-INS */}
        {activeTab === 'walkins' && (
          <div className="space-y-3.5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Nearby Walk-In Drives</span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct interviews and spot hiring drives with venue coordinates
              </p>
            </div>

            <div className="space-y-3">
              {walkIns.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  No upcoming walk-in interviews scheduled within the current scan zone. Check back soon or widen radius.
                </div>
              ) : (
                walkIns.map((walkin) => (
                  <WalkInCard
                    key={walkin.id}
                    walkIn={walkin}
                    onSelectCompany={(compId) => {
                      const c = companies.find((x) => x.id === compId);
                      if (c) setSelectedCompany(c);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ⚙️ SETTINGS & PREFERENCES */}
        {activeTab === 'settings' && (
          <div className="space-y-4 pt-1">
            <h2 className="text-base font-bold text-white">App Settings & Profile</h2>

            {/* Notification Setup Card */}
            <div className="p-4 rounded-2xl glass-card border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Walk-in Alert Dispatcher</div>
                    <div className="text-xs text-slate-400">Email & Telegram Bot notifications</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotifModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Saved Locations */}
            <div className="p-4 rounded-2xl glass-card border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Saved Quick Locations
                </div>
              </div>

              <div className="space-y-2">
                {savedLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setCoordinates(loc.coordinates);
                      setLocationName(loc.name);
                      setIsUsingGps(false);
                      setActiveTab('home');
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between text-xs text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-white">{loc.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono">{loc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Portal Launcher */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase font-mono">System & Ingestion Admin</span>
                </div>
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  Open Dashboard
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Inspect active sources, trigger ingestion runs, verify jobs, and view dispatch logs.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        walkInCount={walkInCount}
        jobsCount={jobs.length}
      />

      {/* Company Bottom Sheet Detail Modal */}
      <CompanyBottomSheet
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={{ ...filters, radiusKm }}
        onChangeFilters={(f) => {
          setRadiusKm(f.radiusKm);
          setFilters({
            ...filters,
            category: f.category,
            experience: f.experience,
            jobType: f.jobType,
            workMode: f.workMode,
            fresherOnly: f.fresherOnly,
            isWalkIn: f.isWalkIn,
          });
        }}
        onReset={() => {
          setFilters({});
          setRadiusKm(10);
        }}
        totalMatchesCount={jobs.length}
      />

      {/* Notification Settings Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      {/* Admin Operations Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};

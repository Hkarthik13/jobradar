import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, X, History, Sparkles, AlertCircle, Compass } from 'lucide-react';
import { LocationSearchResult, PRESET_HUBS, SavedLocation } from 'jobradar-shared';
import { api } from '../api';

interface LocationBarProps {
  currentLocationName: string;
  isUsingGps: boolean;
  onSelectLocation: (result: LocationSearchResult, isGps: boolean) => void;
  onRequestGps: () => void;
  gpsLoading: boolean;
  gpsError?: string;
  savedLocations: SavedLocation[];
}

export const LocationBar: React.FC<LocationBarProps> = ({
  currentLocationName,
  isUsingGps,
  onSelectLocation,
  onRequestGps,
  gpsLoading,
  gpsError,
  savedLocations,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>(PRESET_HUBS);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await api.searchLocation(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(PRESET_HUBS);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePickLocation = (hub: LocationSearchResult) => {
    onSelectLocation(hub, false);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      {/* Top Location Bar Pill */}
      <div className="flex items-center space-x-2 p-2 rounded-2xl glass-panel border border-slate-800 shadow-xl">
        {/* Search Location Input Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/60 text-left transition-all group"
        >
          <div className={`p-1.5 rounded-lg ${isUsingGps ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isUsingGps ? <Compass className="w-4 h-4 animate-spin-slow" /> : <MapPin className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              {isUsingGps ? 'Live GPS Location' : 'Search Location Hub'}
            </div>
            <div className="text-sm font-bold text-white truncate group-hover:text-emerald-300">
              {currentLocationName || 'Select search area...'}
            </div>
          </div>
          <Search className="w-4 h-4 text-slate-400 group-hover:text-white mr-1" />
        </button>

        {/* GPS "Use My Location" Quick Action */}
        <button
          onClick={onRequestGps}
          disabled={gpsLoading}
          className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all touch-press ${
            isUsingGps
              ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/20'
              : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-600/30'
          }`}
          title="Detect Current GPS Location"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{gpsLoading ? 'Detecting...' : isUsingGps ? 'GPS Active' : 'My Location'}</span>
          <span className="sm:hidden">{gpsLoading ? '...' : 'GPS'}</span>
        </button>
      </div>

      {/* Mode B Clear Status Banner if searching away from current location */}
      {!isUsingGps && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">
              Search Area: <strong className="text-white font-semibold">{currentLocationName}</strong>
            </span>
          </div>
          <button
            onClick={onRequestGps}
            className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-2 whitespace-nowrap"
          >
            Use My GPS
          </button>
        </div>
      )}

      {/* GPS Error Alert Notice */}
      {gpsError && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span>{gpsError}</span>
          </div>
        </div>
      )}

      {/* Location Search Modal Sheet */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Search Job Radar Location</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type city, area (e.g. Guindy, T Nagar, OMR, Bangalore)..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action: Use GPS Location */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/40">
              <button
                onClick={() => {
                  onRequestGps();
                  setIsSearchOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Use Current Live GPS Coordinates</span>
              </button>
            </div>

            {/* Search Results / Preset Hubs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                {searchQuery.trim() ? 'Matching Locations' : 'Popular Tech & Industrial Hubs'}
              </div>

              {isSearching ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Searching locations...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching locations found. Try searching for a major city or district.
                </div>
              ) : (
                searchResults.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => handlePickLocation(hub)}
                    className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/40 flex items-start space-x-3 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
                        {hub.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {hub.displayName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        Lat: {hub.coordinates.latitude.toFixed(4)}, Lng: {hub.coordinates.longitude.toFixed(4)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

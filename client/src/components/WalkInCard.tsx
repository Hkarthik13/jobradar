import React from 'react';
import { WalkIn, getGoogleMapsDirectionsUrl } from 'jobradar-shared';
import { Calendar, Clock, MapPin, Navigation, ExternalLink, Sparkles, Building2, UserCheck } from 'lucide-react';

interface WalkInCardProps {
  walkIn: WalkIn;
  onSelectCompany?: (companyId: string) => void;
}

export const WalkInCard: React.FC<WalkInCardProps> = ({ walkIn, onSelectCompany }) => {
  const isToday = walkIn.status === 'ACTIVE_TODAY';

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleMapsDirectionsUrl(
      walkIn.venueCoordinates.latitude,
      walkIn.venueCoordinates.longitude,
      walkIn.companyName
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/30 border border-red-500/40 hover:border-red-500/80 shadow-xl shadow-red-950/20 space-y-3.5 relative overflow-hidden transition-all group">
      {/* Top Banner & Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 min-w-0">
          <img
            src={walkIn.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop'}
            alt={walkIn.companyName}
            className="w-12 h-12 rounded-xl object-cover border border-red-500/30 bg-slate-800 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors leading-tight">
              {walkIn.positionTitle}
            </h3>
            <button
              onClick={() => onSelectCompany && onSelectCompany(walkIn.companyId)}
              className="text-xs text-slate-400 hover:text-white font-medium flex items-center space-x-1 mt-0.5"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{walkIn.companyName}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 space-y-1">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center space-x-1 ${
              isToday
                ? 'bg-red-500 text-white shadow-md shadow-red-500/40 animate-pulse'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isToday ? 'TODAY' : 'UPCOMING'}</span>
          </span>

          {walkIn.distanceKm !== undefined && (
            <span className="text-xs font-mono font-bold text-emerald-400">
              📍 {walkIn.distanceKm} KM
            </span>
          )}
        </div>
      </div>

      {/* Date, Time, & Category Chips */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-red-500/20 text-xs">
        <div className="flex items-center space-x-2 text-slate-200">
          <Calendar className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-semibold">{walkIn.date}</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-200">
          <Clock className="w-4 h-4 text-red-400 shrink-0" />
          <span>{walkIn.timeSlot}</span>
        </div>
      </div>

      {/* Venue & Eligibility */}
      <div className="space-y-1.5 text-xs">
        <div className="text-slate-300">
          <strong className="text-red-300">Venue:</strong> {walkIn.venueAddress}
        </div>
        <div className="text-slate-300">
          <strong className="text-red-300">Eligibility:</strong> {walkIn.eligibility}
        </div>
        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
          <span>Experience: <strong className="text-slate-200">{walkIn.experience}</strong></span>
          <span>•</span>
          <span>Salary: <strong className="text-emerald-400">{walkIn.salaryText || 'Not specified'}</strong></span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs">
        <span className="text-[11px] text-slate-500">Source: {walkIn.sourceName}</span>

        <div className="flex items-center space-x-2">
          {walkIn.registrationRequired && walkIn.registrationLink && (
            <a
              href={walkIn.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center space-x-1 font-semibold touch-press"
            >
              <span>Register</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={handleDirections}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/30 touch-press"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Get Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

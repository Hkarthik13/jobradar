import React from 'react';
import { Job, getGoogleMapsDirectionsUrl } from 'jobradar-shared';
import { MapPin, Navigation, ExternalLink, ShieldCheck, Sparkles, Clock } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onSelectJob?: (job: Job) => void;
  onSelectCompany?: (companyId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob, onSelectCompany }) => {
  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleMapsDirectionsUrl(
      job.coordinates.latitude,
      job.coordinates.longitude,
      job.companyName
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={() => onSelectJob && onSelectJob(job)}
      className="p-4 rounded-2xl glass-card hover:bg-slate-850/80 border border-slate-750 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3 relative group"
    >
      {/* Top Header: Company + Walk-In / Verified Tag */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 min-w-0">
          <img
            src={job.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop'}
            alt={job.companyName}
            className="w-11 h-11 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
              {job.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectCompany && onSelectCompany(job.companyId);
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 font-medium truncate block text-left"
            >
              {job.companyName}
            </button>
          </div>
        </div>

        {job.isWalkIn ? (
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-[10px] tracking-wider uppercase shrink-0 flex items-center space-x-1 animate-pulse">
            <span>🔴 WALK-IN</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px] tracking-wide shrink-0">
            🟢 HIRING
          </span>
        )}
      </div>

      {/* Badges / Metrics */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-medium">
          {job.category}
        </span>
        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-emerald-500/30 text-emerald-400 font-medium">
          {job.experience}
        </span>
        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 font-medium">
          {job.workMode}
        </span>
        {job.salaryText && (
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-300 font-mono font-medium">
            💰 {job.salaryText}
          </span>
        )}
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      {/* Footer: Distance, Verification, and Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          {job.distanceKm !== undefined && (
            <span className="font-mono text-emerald-400 font-bold flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{job.distanceKm} KM</span>
            </span>
          )}
          <span className="text-[11px] text-slate-500">• {job.location}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDirections}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center space-x-1 text-xs font-semibold touch-press"
          >
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>Directions</span>
          </button>
          {job.sourceUrl && (
            <button
              onClick={handleApply}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center space-x-1 text-xs font-bold touch-press"
            >
              <span>View Job</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

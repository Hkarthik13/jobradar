import React, { useEffect, useState } from 'react';
import { Company, Job, WalkIn } from 'jobradar-shared';
import { 
  X, 
  MapPin, 
  Navigation, 
  Briefcase, 
  Calendar, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  DollarSign, 
  Layers, 
  Sparkles,
  Phone,
  Mail,
  Share2
} from 'lucide-react';
import { api } from '../api';

interface CompanyBottomSheetProps {
  company: Company | null;
  onClose: () => void;
  onOpenJob?: (job: Job) => void;
}

export const CompanyBottomSheet: React.FC<CompanyBottomSheetProps> = ({
  company,
  onClose,
  onOpenJob,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getNearbyJobs({
        latitude: company.location.latitude,
        longitude: company.location.longitude,
        radiusKm: 1,
      }),
      api.getNearbyWalkIns({
        latitude: company.location.latitude,
        longitude: company.location.longitude,
        radiusKm: 1,
      }),
    ])
      .then(([allJobs, allWalkIns]) => {
        if (!isMounted) return;
        setJobs(allJobs.filter((j) => j.companyId === company.id));
        setWalkIns(allWalkIns.filter((w) => w.companyId === company.id));
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [company]);

  if (!company) return null;

  const isWalkIn = company.status === 'WALK_IN' || walkIns.length > 0;
  const isHiring = company.status === 'HIRING' || company.status === 'MULTIPLE_OPENINGS' || jobs.length > 0;

  // Google Maps Directions trigger
  const handleGetDirections = () => {
    const lat = company.location.latitude;
    const lng = company.location.longitude;
    const url = company.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${company.name} on JOB RADAR`,
        text: `Check out job openings & walk-ins at ${company.name} (${company.distanceKm} KM away)`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-auto bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle & Close Bar */}
        <div className="relative pt-3 pb-2 px-4 border-b border-slate-800 flex items-center justify-between">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-700"></div>
          
          <div className="flex items-center space-x-2 mt-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center space-x-1 ${
                isWalkIn
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                  : isHiring
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWalkIn ? 'bg-red-500 animate-pulse' : isHiring ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
              <span>{isWalkIn ? '🔴 Walk-In Interview' : isHiring ? '🟢 Hiring' : '⚪ Company Info'}</span>
            </span>

            {company.distanceKm !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
                📍 {company.distanceKm} KM
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 mt-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Company Profile Header */}
          <div className="flex items-start space-x-3.5">
            <img
              src={company.logoUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop'}
              alt={company.name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0 bg-slate-800"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight">
                {company.name}
              </h2>
              <div className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{company.companyType}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-start space-x-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                <span className="leading-snug">{company.address}, {company.city}</span>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Source: <strong className="text-slate-200">TechPark Official Feed</strong></span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {new Date(company.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* High-Priority Walk-In Section (Requirement #17) */}
          {walkIns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
                <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Active / Upcoming Walk-In Drive</span>
              </div>

              {walkIns.map((walkin) => (
                <div
                  key={walkin.id}
                  className="p-3.5 rounded-2xl bg-red-950/30 border-2 border-red-500/50 shadow-lg shadow-red-950/40 space-y-2.5 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {walkin.positionTitle}
                      </div>
                      <div className="text-xs text-red-300 font-semibold mt-0.5">
                        {walkin.jobCategory} • {walkin.experience}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider animate-pulse">
                      {walkin.status === 'ACTIVE_TODAY' ? 'TODAY' : 'UPCOMING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-red-500/20">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{walkin.date}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{walkin.timeSlot}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-red-500/20 space-y-1">
                    <div><strong className="text-red-300">🏛️ Venue:</strong> {walkin.venueAddress}</div>
                    <div><strong className="text-red-300">🎓 Eligibility:</strong> {walkin.eligibility}</div>
                    <div><strong className="text-red-300">💰 Salary:</strong> {walkin.salaryText || 'Not specified'}</div>
                    {walkin.notes && <div className="text-slate-400 italic text-[11px]">Note: {walkin.notes}</div>}
                  </div>

                  {walkin.registrationRequired && walkin.registrationLink && (
                    <a
                      href={walkin.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-300 hover:text-white underline underline-offset-2"
                    >
                      <span>Registration Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Job Openings Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Current Openings ({jobs.length})
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading verified openings...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center text-xs text-slate-400">
                No active openings verified at this moment. You can still visit company career site or reach out directly.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-white">
                      {job.title}
                    </h4>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {job.salaryText || 'Competitive'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] font-medium border border-slate-700">
                      {job.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 text-[11px] font-medium border border-emerald-500/30">
                      {job.experience}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-400 text-[11px] font-medium border border-cyan-500/30">
                      {job.workMode}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[11px] font-medium border border-slate-700">
                      {job.jobType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 pt-1">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>Source: {job.sourceName}</span>
                    {job.sourceUrl && (
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
                      >
                        <span>Apply Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Fixed Action Buttons (Requirements #7, #8) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center space-x-2.5">
          <button
            onClick={handleGetDirections}
            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 touch-press"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Get Directions in Google Maps</span>
          </button>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all touch-press"
              title="Open Official Website"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

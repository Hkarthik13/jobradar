import React from 'react';
import { X, Filter, RotateCcw, Check, Sparkles } from 'lucide-react';
import { JobCategory, ExperienceLevel, JobType, WorkMode } from 'jobradar-shared';

interface FilterState {
  category?: string;
  experience?: string;
  jobType?: string;
  workMode?: string;
  fresherOnly?: boolean;
  isWalkIn?: boolean;
  radiusKm: number;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  onReset: () => void;
  totalMatchesCount?: number;
}

const CATEGORIES: JobCategory[] = [
  'IT', 'Software', 'AI/ML', 'Data', 'Testing', 'DevOps',
  'Cybersecurity', 'Web Development', 'Mobile Development',
  'BPO', 'Finance', 'HR', 'Sales', 'Marketing', 'Core Engineering'
];

const EXPERIENCES: ExperienceLevel[] = ['Fresher', '0–1 years', '1–3 years', '3+ years'];
const JOB_TYPES: JobType[] = ['Full Time', 'Part Time', 'Internship', 'Contract', 'Walk-in'];
const WORK_MODES: WorkMode[] = ['On-site', 'Hybrid', 'Remote'];
const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onReset,
  totalMatchesCount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Filter Opportunities</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onReset}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Quick Toggles (Fresher / Walk-In) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onChangeFilters({ ...filters, isWalkIn: !filters.isWalkIn })}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                filters.isWalkIn
                  ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                  : 'bg-slate-850 border-slate-700/80 text-slate-300'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Walk-ins Only</span>
              </span>
              {filters.isWalkIn && <Check className="w-4 h-4 text-red-400" />}
            </button>

            <button
              onClick={() => onChangeFilters({ ...filters, fresherOnly: !filters.fresherOnly })}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                filters.fresherOnly
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-850 border-slate-700/80 text-slate-300'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Freshers Only</span>
              </span>
              {filters.fresherOnly && <Check className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Distance Radius */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400 uppercase font-mono">Scan Radius</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{filters.radiusKm} KM</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => onChangeFilters({ ...filters, radiusKm: r })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    filters.radiusKm === r
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {r} KM
                </button>
              ))}
            </div>
          </div>

          {/* Job Categories */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase font-mono">Job Category</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onChangeFilters({ ...filters, category: filters.category === cat ? undefined : cat })}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    filters.category === cat
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase font-mono">Experience</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {EXPERIENCES.map((exp) => (
                <button
                  key={exp}
                  onClick={() => onChangeFilters({ ...filters, experience: filters.experience === exp ? undefined : exp })}
                  className={`py-2 px-2 text-center text-xs font-medium rounded-xl border transition-all ${
                    filters.experience === exp
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Work Mode */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase font-mono">Work Mode</div>
            <div className="grid grid-cols-3 gap-2">
              {WORK_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangeFilters({ ...filters, workMode: filters.workMode === mode ? undefined : mode })}
                  className={`py-2 text-center text-xs font-medium rounded-xl border transition-all ${
                    filters.workMode === mode
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 touch-press"
          >
            Apply Filters {totalMatchesCount !== undefined ? `(${totalMatchesCount} matches)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

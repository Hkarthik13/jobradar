import React, { useState, useEffect, useRef } from 'react';
import { Company } from 'jobradar-shared';
import { Volume2, VolumeX, Eye, Sparkles, Navigation } from 'lucide-react';

interface RadarViewProps {
  companies: Company[];
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  onSelectCompany: (company: Company) => void;
  selectedCompanyId?: string;
  isCurrentLocation?: boolean;
}

const RADIUS_PRESETS = [1, 2, 5, 10, 25, 50];

export const RadarView: React.FC<RadarViewProps> = ({
  companies,
  radiusKm,
  onRadiusChange,
  onSelectCompany,
  selectedCompanyId,
  isCurrentLocation = true,
}) => {
  const [isSweeping, setIsSweeping] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play subtle radar ping on marker detection if audio is enabled
  const playRadarPing = () => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context may be blocked by browser policy
    }
  };

  const handleBlipClick = (company: Company) => {
    playRadarPing();
    onSelectCompany(company);
  };

  // Convert distance (km) and bearing (deg) to SVG X/Y relative to center (200, 200)
  const getMarkerCoordinates = (distanceKm?: number, bearingDeg: number = 0) => {
    const center = 200;
    const maxRadiusPx = 175; // outer ring boundary

    if (distanceKm === undefined) return { x: center, y: center };

    // Ratio of distance relative to current radius scale
    const distRatio = Math.min(distanceKm / radiusKm, 1);
    const rPx = distRatio * maxRadiusPx;

    // Convert bearing (0 deg = North, 90 = East) to radians (-90 deg offset for math coords)
    const angleRad = ((bearingDeg - 90) * Math.PI) / 180;
    const x = center + rPx * Math.cos(angleRad);
    const y = center + rPx * Math.sin(angleRad);

    return { x, y };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto select-none">
      {/* Top Radar Toolbar */}
      <div className="flex items-center justify-between w-full px-4 mb-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 font-mono">
            Active Radar Scan
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-lg border text-xs flex items-center transition-all ${
              audioEnabled
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Radar Audio Ping"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsSweeping(!isSweeping)}
            className={`px-2 py-1 rounded-lg border text-xs font-mono transition-all ${
              isSweeping
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isSweeping ? 'SWEEP: ON' : 'SWEEP: OFF'}
          </button>
        </div>
      </div>

      {/* Main Radar Screen Container */}
      <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
        {/* Outer Glow Halo */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-xl pointer-events-none"></div>

        {/* SVG Canvas for Rings, Crosshairs, and Marker Pins */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full relative z-10 drop-shadow-2xl overflow-visible"
        >
          <defs>
            <radialGradient id="radarGlass" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f1a2e" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#0b1322" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#060a12" stopOpacity="1" />
            </radialGradient>

            <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="crimsonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base Radar Glass */}
          <circle cx="200" cy="200" r="185" fill="url(#radarGlass)" stroke="#1e293b" strokeWidth="3" />

          {/* Concentric Distance Rings */}
          <circle cx="200" cy="200" r="175" stroke="#10b981" strokeWidth="1" strokeOpacity="0.35" fill="none" />
          <circle cx="200" cy="200" r="130" stroke="#10b981" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="5 5" fill="none" />
          <circle cx="200" cy="200" r="85" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" fill="none" />
          <circle cx="200" cy="200" r="40" stroke="#10b981" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" fill="none" />

          {/* Crosshairs */}
          <line x1="200" y1="15" x2="200" y2="385" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" />
          <line x1="15" y1="200" x2="385" y2="200" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" />

          {/* Cardinal Directions */}
          <text x="200" y="28" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">N</text>
          <text x="375" y="204" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">E</text>
          <text x="200" y="378" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">S</text>
          <text x="25" y="204" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">W</text>

          {/* Ring Distance Label Badges */}
          <text x="200" y="70" fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.75" fontWeight="bold">
            {radiusKm} KM
          </text>
          <text x="200" y="115" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.5">
            {Math.round(radiusKm * 0.7)} KM
          </text>
          <text x="200" y="158" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.5">
            {Math.round(radiusKm * 0.45)} KM
          </text>

          {/* Center User/Search Location Indicator */}
          <g>
            <circle cx="200" cy="200" r="16" fill="#06b6d4" fillOpacity="0.2" className="animate-ping" />
            <circle cx="200" cy="200" r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" filter="url(#emeraldGlow)" />
          </g>

          {/* Company Markers Layer */}
          {companies.map((company) => {
            const { x, y } = getMarkerCoordinates(company.distanceKm, company.bearingDeg);
            const isWalkIn = company.status === 'WALK_IN';
            const isHiring = company.status === 'HIRING' || company.status === 'MULTIPLE_OPENINGS';
            const isSelected = selectedCompanyId === company.id;

            return (
              <g
                key={company.id}
                className="cursor-pointer transition-transform duration-200 hover:scale-125"
                onClick={() => handleBlipClick(company)}
                onMouseEnter={() => setHoveredCompany(company)}
                onMouseLeave={() => setHoveredCompany(null)}
              >
                {/* Selection Ripple */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="18"
                    fill="none"
                    stroke={isWalkIn ? '#ef4444' : '#10b981'}
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="animate-spin"
                  />
                )}

                {/* Priority Walk-In Pulse Aura */}
                {isWalkIn && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="#ef4444"
                    fillOpacity="0.3"
                    className="animate-pulse-fast"
                  />
                )}

                {/* Main Blip Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isWalkIn ? 7.5 : isHiring ? 6 : 4.5}
                  fill={isWalkIn ? '#ef4444' : isHiring ? '#10b981' : '#94a3b8'}
                  stroke={isSelected ? '#ffffff' : isWalkIn ? '#fca5a5' : isHiring ? '#a7f3d0' : '#475569'}
                  strokeWidth={isWalkIn ? 2 : 1.5}
                  filter={isWalkIn ? 'url(#crimsonGlow)' : isHiring ? 'url(#emeraldGlow)' : undefined}
                />

                {/* Mini Company Name Tag for Walk-ins or Selected */}
                {(isWalkIn || isSelected) && (
                  <text
                    x={x}
                    y={y - 12}
                    fill={isWalkIn ? '#f87171' : '#34d399'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {company.name.split(' ')[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Rotating Radar Sweep Cone Overlay */}
        {isSweeping && (
          <div
            className="absolute inset-[15px] pointer-events-none rounded-full radar-sweep-beam animate-radar-sweep opacity-75"
            style={{ transformOrigin: 'center center' }}
          ></div>
        )}

        {/* Center Tooltip on Hover */}
        {hoveredCompany && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-2xl pointer-events-none flex items-center space-x-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredCompany.status === 'WALK_IN'
                  ? 'bg-red-500'
                  : hoveredCompany.status === 'HIRING'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-white truncate max-w-[160px]">
              {hoveredCompany.name}
            </span>
            <span className="text-emerald-400 font-mono">
              {hoveredCompany.distanceKm} km
            </span>
          </div>
        )}
      </div>

      {/* Interactive Radius Pill Selector */}
      <div className="w-full mt-4 px-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Radar Radius: <strong className="text-emerald-400 font-mono text-sm">{radiusKm} KM</strong>
          </span>
          <span className="text-xs text-slate-500">
            Showing {companies.length} companies
          </span>
        </div>

        {/* Quick Radius Buttons */}
        <div className="grid grid-cols-6 gap-1.5">
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onRadiusChange(preset)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition-all touch-press ${
                radiusKm === preset
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset}K
            </button>
          ))}
        </div>
      </div>

      {/* Radar Visual Legend */}
      <div className="w-full mt-4 px-4 py-2.5 rounded-xl glass-card grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse"></span>
          <span className="text-slate-200 font-medium">🔴 Walk-in Interview</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
          <span className="text-slate-200 font-medium">🟢 Active Hiring</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span className="text-slate-400">⚪ Normal / No Openings</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 border border-white"></span>
          <span className="text-cyan-300 font-medium">📍 {isCurrentLocation ? 'You are here' : 'Search Center'}</span>
        </div>
      </div>
    </div>
  );
};

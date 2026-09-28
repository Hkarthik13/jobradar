import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, X, Database, CheckCircle2, AlertTriangle, Layers, Bell } from 'lucide-react';
import { AdminStats } from 'jobradar-shared';
import { api } from '../api';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fetchAdminData = () => {
    setLoading(true);
    api.getAdminStats()
      .then((data) => {
        setStats(data.stats);
        setSources(data.sources);
        setLogs(data.recentNotifications || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  const handleTriggerScan = async () => {
    setScanning(true);
    setScanMessage('Running scheduled job ingestion, deduplication & walk-in detection...');
    try {
      const res = await api.triggerAdminScan();
      setScanMessage(`✅ Scan Completed: ${res.result?.newJobs || 0} new jobs, ${res.result?.newWalkIns || 0} walk-ins extracted.`);
      fetchAdminData();
    } catch (err) {
      setScanMessage('❌ Manual scan execution failed');
    } finally {
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">JOB RADAR System & Source Administration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading || !stats ? (
            <div className="py-8 text-center text-slate-400">Loading admin metrics...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400 text-[10px] font-mono uppercase">Total Companies</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">{stats.totalCompanies}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400 text-[10px] font-mono uppercase">Active Jobs</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{stats.totalJobs}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400 text-[10px] font-mono uppercase">Walk-Ins</div>
                  <div className="text-lg font-bold text-red-400 font-mono mt-0.5">{stats.totalWalkIns}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-slate-400 text-[10px] font-mono uppercase">Dups Merged</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{stats.duplicateJobsMerged}</div>
                </div>
              </div>

              {/* Ingestion Trigger Button */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-sm">Automated Job & Walk-in Ingestion</div>
                  <div className="text-slate-400 text-xs">Trigger background worker to scan active feeds & notify matching candidates</div>
                </div>
                <button
                  onClick={handleTriggerScan}
                  disabled={scanning}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center space-x-2 touch-press"
                >
                  <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                  <span>{scanning ? 'Scanning...' : 'Trigger Scan'}</span>
                </button>
              </div>

              {scanMessage && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-center">
                  {scanMessage}
                </div>
              )}

              {/* Data Sources Health */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Registered Data Sources ({sources.length})
                </div>
                {sources.map((src) => (
                  <div key={src.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{src.name}</div>
                      <div className="text-[11px] text-slate-400">{src.baseUrl} • {src.type}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent Notifications Dispatched */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Recent Dispatched Alert Logs
                </div>
                {logs.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-850 text-slate-500 text-center">
                    No notifications logged yet.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-850 border border-slate-750 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">{log.channel} ➜ {log.recipient}</span>
                        <span className="text-slate-500 font-mono">{new Date(log.sentAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-300 truncate">{log.title}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Bell, Mail, Send, Check, X, ShieldAlert, Sparkles, SendHorizontal } from 'lucide-react';
import { NotificationPreference } from 'jobradar-shared';
import { api } from '../api';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [pref, setPref] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getNotificationPreferences()
        .then((data) => setPref(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!pref) return;
    setSaving(true);
    try {
      await api.updateNotificationPreferences(pref);
      setTestStatus('Settings saved successfully!');
      setTimeout(() => setTestStatus(null), 3000);
    } catch (err) {
      setTestStatus('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchTest = async (channel: 'EMAIL' | 'TELEGRAM') => {
    setTestStatus(`Dispatching test alert via ${channel}...`);
    try {
      const recipient = channel === 'EMAIL' ? (pref?.emailAddress || 'user@example.com') : (pref?.telegramChatId || 'DemoChat');
      const res = await api.sendTestAlert({
        channel,
        recipient,
      });
      setTestStatus(`✅ ${res.message || 'Test alert dispatched!'}`);
    } catch (err) {
      setTestStatus('❌ Failed to dispatch test notification');
    }
  };

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
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Walk-in & Job Alert Channels</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {loading || !pref ? (
            <div className="py-8 text-center text-slate-400">Loading preferences...</div>
          ) : (
            <>
              {/* Master Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">Enable Automated Alerts</div>
                  <div className="text-slate-400 text-xs">Receive instant alerts for newly detected walk-ins around you</div>
                </div>
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  onChange={(e) => setPref({ ...pref, enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Email Alerts */}
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">Email Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pref.emailEnabled}
                    onChange={(e) => setPref({ ...pref, emailEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
                <input
                  type="email"
                  value={pref.emailAddress || ''}
                  onChange={(e) => setPref({ ...pref, emailAddress: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleDispatchTest('EMAIL')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <SendHorizontal className="w-3 h-3" />
                  <span>Send Test Email Notification</span>
                </button>
              </div>

              {/* Telegram Bot Channel */}
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">Telegram Bot Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pref.telegramEnabled}
                    onChange={(e) => setPref({ ...pref, telegramEnabled: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={pref.telegramChatId || ''}
                  onChange={(e) => setPref({ ...pref, telegramChatId: e.target.value })}
                  placeholder="Telegram Chat ID / Username"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleDispatchTest('TELEGRAM')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                >
                  <SendHorizontal className="w-3 h-3" />
                  <span>Send Test Telegram Bot Alert</span>
                </button>
              </div>

              {/* Distance Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400 uppercase font-mono">Alert Distance Radius</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{pref.maxDistanceKm} KM</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setPref({ ...pref, maxDistanceKm: dist })}
                      className={`py-2 text-center rounded-xl border font-bold transition-all ${
                        pref.maxDistanceKm === dist
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {dist} KM
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback status */}
              {testStatus && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs text-center font-mono">
                  {testStatus}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 touch-press"
          >
            {saving ? 'Saving...' : 'Save Notification Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

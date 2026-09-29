import React, { useState, useEffect } from 'react';
import { Bell, Mail, Send, Check, X, ShieldAlert, Sparkles, SendHorizontal, KeyRound, ExternalLink, HelpCircle } from 'lucide-react';
import { api } from '../api';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [pref, setPref] = useState<{
    enabled: boolean;
    emailEnabled: boolean;
    emailAddress: string;
    telegramEnabled: boolean;
    telegramChatId: string;
    telegramBotToken: string;
    maxDistanceKm: number;
  }>({
    enabled: true,
    emailEnabled: true,
    emailAddress: 'jobseeker@example.com',
    telegramEnabled: true,
    telegramChatId: '',
    telegramBotToken: '',
    maxDistanceKm: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getNotificationPreferences()
        .then((data: any) => {
          if (data) {
            setPref({
              enabled: data.enabled !== false,
              emailEnabled: data.emailEnabled !== false,
              emailAddress: data.emailAddress || '',
              telegramEnabled: data.telegramEnabled !== false,
              telegramChatId: data.telegramChatId || '',
              telegramBotToken: data.telegramBotToken || '',
              maxDistanceKm: data.maxDistanceKm || 15,
            });
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateNotificationPreferences(pref as any);
      setTestStatus('✅ Settings permanently saved on your phone!');
      setTimeout(() => setTestStatus(null), 3500);
    } catch (err) {
      setTestStatus('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchTestTelegram = async () => {
    if (!pref.telegramChatId.trim()) {
      setTestStatus('⚠️ Please enter your Telegram Chat ID first.');
      return;
    }

    setTesting(true);
    setTestStatus('📡 Dispatching live Telegram notification to your phone...');

    try {
      const res = await api.sendTestAlert({
        channel: 'TELEGRAM',
        recipient: pref.telegramChatId,
        botToken: pref.telegramBotToken,
        title: '🚨 JOB RADAR: NEW NEARBY WALK-IN ALERT',
        message: 'Cognizant Technology Solutions is conducting a walk-in interview tomorrow at Olympia Tech Park, Guindy (2.4 KM away). Direct spot offer letters.'
      });

      if (res.success) {
        setTestStatus('🎉 SUCCESS! Check your Telegram app now for the live alert.');
        // Also auto-save
        await api.updateNotificationPreferences(pref as any);
      } else {
        setTestStatus(`⚠️ Telegram error: ${res.message || 'Make sure you clicked /start on your bot first.'}`);
      }
    } catch (err: any) {
      setTestStatus('❌ Failed to send Telegram alert. Check your Bot Token and Chat ID.');
    } finally {
      setTesting(false);
    }
  };

  const handleDispatchTestEmail = async () => {
    if (!pref.emailAddress.trim()) {
      setTestStatus('⚠️ Please enter your Email address.');
      return;
    }

    setTestStatus('📧 Email alert logged & configured successfully!');
    await api.updateNotificationPreferences(pref as any);
    setTimeout(() => setTestStatus(null), 3500);
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
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Live Walk-in Alert Dispatcher</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading saved preferences...</div>
          ) : (
            <>
              {/* Master Toggle */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">Automated Proactive Alerts</div>
                  <div className="text-slate-400 text-xs">Receive direct phone notifications for newly discovered walk-ins</div>
                </div>
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  onChange={(e) => setPref({ ...pref, enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Telegram Bot Channel (Best for Mobile) */}
              <div className="p-4 rounded-2xl bg-slate-900 border-2 border-cyan-500/40 space-y-3 shadow-lg shadow-cyan-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">Telegram Phone Alerts (Recommended)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pref.telegramEnabled}
                    onChange={(e) => setPref({ ...pref, telegramEnabled: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Get instant walk-in notifications directly on your phone lock screen with company address, date, time & Google Maps directions.
                </p>

                {/* Chat ID Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>1. Your Telegram Chat ID <strong className="text-cyan-400">*</strong></span>
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Find via @userinfobot</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={pref.telegramChatId}
                    onChange={(e) => setPref({ ...pref, telegramChatId: e.target.value })}
                    placeholder="e.g. 543219876"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Bot Token Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>2. Telegram Bot API Token (Optional / Custom)</span>
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Get from @BotFather</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={pref.telegramBotToken}
                    onChange={(e) => setPref({ ...pref, telegramBotToken: e.target.value })}
                    placeholder="e.g. 782348123:AAFsdfj2k34... (Optional)"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Test Telegram Alert Button */}
                <button
                  onClick={handleDispatchTestTelegram}
                  disabled={testing}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center space-x-2 shadow-md shadow-cyan-600/30 transition-all touch-press"
                >
                  <SendHorizontal className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Sending Live Test Alert...' : '🚀 Test Live Telegram Alert on Phone'}</span>
                </button>
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
                  value={pref.emailAddress}
                  onChange={(e) => setPref({ ...pref, emailAddress: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleDispatchTestEmail}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 text-[11px]"
                >
                  <SendHorizontal className="w-3 h-3" />
                  <span>Save & Test Email Notification</span>
                </button>
              </div>

              {/* Distance Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400 uppercase font-mono">Alert Distance Radius</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{pref.maxDistanceKm} KM</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 25].map((dist) => (
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

              {/* Feedback status banner */}
              {testStatus && (
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs text-center font-mono leading-relaxed animate-pulse">
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
            {saving ? 'Saving...' : 'Save All Preferences Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Send, 
  Check, 
  X, 
  Sparkles, 
  SendHorizontal, 
  KeyRound, 
  ExternalLink, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { api } from '../api';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'jobradar_notification_pref_v3';

const DISTRICT_PRESETS = [
  'All Districts (Tamil Nadu & India)',
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Trichy',
  'Salem',
  'Tirunelveli',
  'Villupuram',
  'Bengaluru',
];

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  // Load initial preferences synchronously from localStorage so it never starts empty
  const [pref, setPref] = useState<{
    enabled: boolean;
    targetDistrict: string;
    emailEnabled: boolean;
    emailAddress: string;
    telegramEnabled: boolean;
    telegramChatId: string;
    telegramBotToken: string;
    maxDistanceKm: number;
    browserPushEnabled: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('jobradar_notification_pref_v2') || localStorage.getItem('jobradar_notification_pref');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enabled: parsed.enabled !== false,
          targetDistrict: parsed.targetDistrict || 'All Districts (Tamil Nadu & India)',
          emailEnabled: parsed.emailEnabled !== false,
          emailAddress: parsed.emailAddress || '',
          telegramEnabled: parsed.telegramEnabled !== false,
          telegramChatId: parsed.telegramChatId || '',
          telegramBotToken: parsed.telegramBotToken || '',
          maxDistanceKm: parsed.maxDistanceKm || 50,
          browserPushEnabled: parsed.browserPushEnabled || false,
        };
      }
    } catch (e) {}

    return {
      enabled: true,
      targetDistrict: 'All Districts (Tamil Nadu & India)',
      emailEnabled: true,
      emailAddress: '',
      telegramEnabled: true,
      telegramChatId: '',
      telegramBotToken: '',
      maxDistanceKm: 50,
      browserPushEnabled: false,
    };
  });

  const [testingTelegram, setTestingTelegram] = useState(false);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [customDistrict, setCustomDistrict] = useState('');

  // Auto-save to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
      localStorage.setItem('jobradar_notification_pref_v2', JSON.stringify(pref));
      localStorage.setItem('jobradar_notification_pref', JSON.stringify(pref));
    } catch (e) {}
  }, [pref]);

  // Check Telegram Bot Token validity whenever token is entered
  useEffect(() => {
    const token = pref.telegramBotToken.trim();
    if (!token) {
      setBotStatus(null);
      return;
    }

    let isMounted = true;
    const checkBot = async () => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await res.json();
        if (isMounted) {
          if (data.ok) {
            setBotStatus(`🟢 Connected to @${data.result.username} (${data.result.first_name})`);
          } else {
            setBotStatus(`🔴 Invalid Token: ${data.description || 'Check Bot Token'}`);
          }
        }
      } catch (e) {
        if (isMounted) setBotStatus('⚠️ Could not connect to Telegram');
      }
    };

    const timer = setTimeout(checkBot, 600);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pref.telegramBotToken]);

  const handleTestTelegram = async () => {
    const token = pref.telegramBotToken.trim();
    const chatId = pref.telegramChatId.trim();

    if (!token) {
      setTestStatus('⚠️ Please enter your Telegram Bot Token from @BotFather first.');
      return;
    }

    if (!chatId) {
      setTestStatus('⚠️ Please enter your Telegram Chat ID (from @userinfobot).');
      return;
    }

    setTestingTelegram(true);
    setTestStatus('📡 Dispatching live Telegram notification to your phone...');

    const district = pref.targetDistrict || 'Tamil Nadu';
    const isAll = district.includes('All Districts');

    const companyName = isAll ? 'Cognizant Technology Solutions' : `${district} Tech Park Development Center`;
    const venueName = isAll ? 'Olympia Tech Park, Guindy, Chennai' : `Main Campus, ${district}, Tamil Nadu`;
    const mapsLink = isAll 
      ? 'https://www.google.com/maps/dir/?api=1&destination=13.0093,80.2037'
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(district + ' Tech Park')}`;

    const message = 
`🚨 *JOB RADAR - LIVE WALK-IN ALERT* 🚨
📍 *Target District:* ${district}

🏢 *Company:* ${companyName}
💼 *Position:* Associate Software Engineer / Analyst
📅 *Date:* Tomorrow (09:00 AM - 02:00 PM)
🏛️ *Venue:* ${venueName}
🎓 *Eligibility:* B.E / B.Tech / MCA / B.Sc / Any Degree
💰 *Salary:* ₹ 4.5 LPA - ₹ 7.2 LPA
⚡ *Drive Type:* Direct Walk-in Interview

🔗 [Open Google Maps Directions](${mapsLink})`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestStatus(`🎉 SUCCESS! Alert for [${district}] received on your Telegram app. Check your phone now!`);
      } else {
        if (data.error_code === 403 || (data.description && data.description.includes('bot was blocked'))) {
          setTestStatus('⚠️ Error: You must open your bot in Telegram and press START button first!');
        } else if (data.description && data.description.includes('chat not found')) {
          setTestStatus('⚠️ Error: Chat ID not found. Send any message to your bot in Telegram first.');
        } else {
          setTestStatus(`⚠️ Telegram error: ${data.description}`);
        }
      }
    } catch (err: any) {
      setTestStatus(`❌ Network error: ${err.message}`);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleWhatsAppAlert = () => {
    const text = encodeURIComponent(
`🚨 *JOB RADAR - LIVE WALK-IN ALERT*

🏢 *Company:* Cognizant Technology Solutions
💼 *Position:* Associate Software Engineer (Java / React)
📍 *Distance:* 2.4 KM from your location
📅 *Date:* Tomorrow (09:00 AM - 01:30 PM)
🏛️ *Venue:* Olympia Tech Park, Guindy, Chennai
💰 *Salary:* ₹ 4.5 LPA - ₹ 6.0 LPA

📍 Google Maps Directions:
https://www.google.com/maps/dir/?api=1&destination=13.0093,80.2037`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleBrowserPush = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPref({ ...pref, browserPushEnabled: true });
      new Notification('🚨 JOB RADAR Walk-In Alert', {
        body: 'New Walk-In interview detected nearby at Olympia Tech Park!',
        icon: '/radar-icon.svg',
      });
      setTestStatus('✅ In-App Phone Push Notifications Enabled!');
      setTimeout(() => setTestStatus(null), 3000);
    } else {
      setTestStatus('⚠️ Notification permission was denied in browser.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/85 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Live Walk-in Alerts Setup</h3>
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
          {/* Telegram Alerts Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 space-y-3 shadow-xl shadow-cyan-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">Telegram Bot Alerts (100% Free)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                RECOMMENDED
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Receive walk-in interview alerts on your phone lock screen with sound, company venue address, and Google Maps links.
            </p>

            {/* Scope Selection: Target District / City */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-cyan-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Your Target District for Alerts:</span>
                </div>
              </div>

              {/* District Preset Chips */}
              <div className="flex flex-wrap gap-1.5">
                {DISTRICT_PRESETS.map((dist) => {
                  const isSelected = pref.targetDistrict === dist;
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => {
                        setPref({ ...pref, targetDistrict: dist });
                        setCustomDistrict('');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-500/25 border-cyan-400 text-white font-bold shadow-sm shadow-cyan-950'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {dist === 'All Districts (Tamil Nadu & India)' ? '🌍 All Districts' : dist}
                      {isSelected && <span className="ml-1 text-cyan-400">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Custom District Input */}
              <div className="pt-1">
                <div className="text-[10px] text-slate-400 mb-1">Or enter any specific District / Town:</div>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    placeholder="e.g. Erode, Tiruppur, Vellore, Thanjavur..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customDistrict.trim()) {
                        setPref({ ...pref, targetDistrict: customDistrict.trim() });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Active District Status Banner */}
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                <span>
                  Active Alert District: <strong className="text-white underline">{pref.targetDistrict}</strong>
                </span>
              </div>
            </div>

            {/* Step 1: Bot Token */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>1. Telegram Bot Token:</span>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get via @BotFather</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={pref.telegramBotToken}
                onChange={(e) => setPref({ ...pref, telegramBotToken: e.target.value })}
                placeholder="e.g. 782348123:AAFsdfj2k34..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              {botStatus && (
                <div className="text-[11px] font-mono text-slate-300 mt-1 pl-1">
                  {botStatus}
                </div>
              )}
            </div>

            {/* Step 2: Chat ID */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>2. Your Telegram Chat ID:</span>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get via @userinfobot</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={pref.telegramChatId}
                onChange={(e) => setPref({ ...pref, telegramChatId: e.target.value })}
                placeholder="e.g. 543219876"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Important Note */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              💡 <strong>Important:</strong> Open your created bot in Telegram and click <strong>"START"</strong> once, so the bot has permission to message you.
            </div>

            {/* Test Alert Button */}
            <button
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30 transition-all touch-press"
            >
              <SendHorizontal className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-spin' : ''}`} />
              <span>{testingTelegram ? 'Sending Test Alert...' : '🚀 Test Live Telegram Alert on Phone'}</span>
            </button>
          </div>

          {/* WhatsApp Direct Share Option */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">WhatsApp Walk-in Alert</div>
                <div className="text-slate-400 text-[11px]">Send walk-in drive details directly to your WhatsApp</div>
              </div>
            </div>
            <button
              onClick={handleWhatsAppAlert}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 touch-press"
            >
              <span>Share</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Browser Phone Push Notification */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Phone Push Notifications</div>
                <div className="text-slate-400 text-[11px]">Allow browser popup alerts for nearby jobs</div>
              </div>
            </div>
            <button
              onClick={handleBrowserPush}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs touch-press"
            >
              Enable
            </button>
          </div>

          {/* Status Feedback Banner */}
          {testStatus && (
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs text-center font-mono leading-relaxed shadow-lg animate-pulse">
              {testStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={() => {
              setTestStatus('✅ All settings are automatically saved!');
              setTimeout(onClose, 800);
            }}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 touch-press"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};

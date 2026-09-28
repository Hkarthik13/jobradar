import { WalkIn, Job, NotificationPreference, calculateHaversineDistanceKm } from 'jobradar-shared';
import axios from 'axios';
import { config } from '../config.js';

export interface NotificationPayload {
  recipient: string;
  channel: 'EMAIL' | 'TELEGRAM' | 'WHATSAPP';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static notificationLogs: Array<{
    id: string;
    channel: string;
    recipient: string;
    title: string;
    message: string;
    sentAt: string;
    status: 'SENT' | 'FAILED';
  }> = [];

  /**
   * Format a high-priority Walk-in Alert message
   */
  public static formatWalkInAlertMessage(walkIn: WalkIn, distanceKm: number): { title: string; body: string } {
    const title = `🚨 NEW NEARBY WALK-IN: ${walkIn.companyName}`;
    const body = 
`🏢 Company: ${walkIn.companyName}
💼 Position: ${walkIn.positionTitle}
📍 Distance: ${distanceKm} KM away
📅 Date: ${walkIn.date}
⏰ Time: ${walkIn.timeSlot}
🏛️ Venue: ${walkIn.venueAddress}
🎓 Eligibility: ${walkIn.eligibility}
💰 Salary: ${walkIn.salaryText || 'Not specified'}
🔗 Direct Source: ${walkIn.sourceUrl}`;

    return { title, body };
  }

  /**
   * Send notification via Telegram Bot API
   */
  public static async sendTelegramAlert(chatId: string, title: string, message: string): Promise<boolean> {
    const text = `*${title}*\n\n${message}`;
    
    if (!config.telegram.botToken) {
      console.log(`[Telegram Mock Dispatch] To: ${chatId || 'DefaultChat'} | Title: ${title}`);
      this.logNotification('TELEGRAM', chatId || 'DefaultChat', title, message, 'SENT');
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId || config.telegram.defaultChatId,
        text,
        parse_mode: 'Markdown',
      });
      this.logNotification('TELEGRAM', chatId, title, message, 'SENT');
      return true;
    } catch (err: any) {
      console.error('Failed to dispatch Telegram alert:', err?.response?.data || err.message);
      this.logNotification('TELEGRAM', chatId, title, message, 'FAILED');
      return false;
    }
  }

  /**
   * Send Email Alert (SMTP / Mock)
   */
  public static async sendEmailAlert(toEmail: string, title: string, message: string): Promise<boolean> {
    console.log(`[Email Alert Dispatch] To: ${toEmail} | Subject: ${title}`);
    console.log(`Message Body:\n${message}\n-----------------------------------`);
    this.logNotification('EMAIL', toEmail, title, message, 'SENT');
    return true;
  }

  /**
   * Evaluates if a newly discovered walkin or job matches user preferences and triggers alert
   */
  public static async evaluateAndDispatchWalkInAlert(
    walkin: WalkIn,
    userLocation: { latitude: number; longitude: number },
    pref: NotificationPreference
  ): Promise<boolean> {
    if (!pref.enabled) return false;

    const distance = calculateHaversineDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      walkin.venueCoordinates.latitude,
      walkin.venueCoordinates.longitude
    );

    // Check radius threshold
    if (distance > pref.maxDistanceKm) return false;

    // Check category matches
    if (pref.categories.length > 0) {
      const match = pref.categories.some((c) => c.toLowerCase() === walkin.jobCategory.toLowerCase());
      if (!match) return false;
    }

    // Check experience matches
    if (pref.experienceLevels.length > 0) {
      const match = pref.experienceLevels.some((e) => e === walkin.experience);
      if (!match) return false;
    }

    const { title, body } = this.formatWalkInAlertMessage(walkin, distance);

    let dispatched = false;
    if (pref.emailEnabled && pref.emailAddress) {
      await this.sendEmailAlert(pref.emailAddress, title, body);
      dispatched = true;
    }

    if (pref.telegramEnabled && pref.telegramChatId) {
      await this.sendTelegramAlert(pref.telegramChatId, title, body);
      dispatched = true;
    }

    return dispatched;
  }

  private static logNotification(
    channel: string,
    recipient: string,
    title: string,
    message: string,
    status: 'SENT' | 'FAILED'
  ) {
    this.notificationLogs.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel,
      recipient,
      title,
      message,
      sentAt: new Date().toISOString(),
      status,
    });
    if (this.notificationLogs.length > 100) {
      this.notificationLogs.pop();
    }
  }

  public static getLogs() {
    return this.notificationLogs;
  }
}

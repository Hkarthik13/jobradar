import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'jobradar-super-secret-production-key-2026',
  
  // Database / PostGIS (Optional - automatically falls back to in-memory PostGIS simulator)
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Notifications
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    defaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || '',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromAddress: process.env.EMAIL_FROM || 'alerts@jobradar.local',
  },
  
  // Scanner
  scannerCron: process.env.SCANNER_CRON || '0 */6 * * *', // Every 6 hours
  autoScanOnStartup: process.env.AUTO_SCAN_ON_STARTUP === 'true' || true,
};

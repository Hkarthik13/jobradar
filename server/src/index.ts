import { createApp } from './app.js';
import { config } from './config.js';

const { app, scanner } = createApp();

// Start Background Scheduled Scanner
scanner.start();

app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`📡 JOB RADAR API Server listening on port ${config.port}`);
  console.log(`🚀 API Base URL: http://localhost:${config.port}/api`);
  console.log(`🛡️ Environment: ${config.nodeEnv}`);
  console.log(`📍 Geospatial Engine: Haversine + PostGIS Ready`);
  console.log(`=======================================================`);
});

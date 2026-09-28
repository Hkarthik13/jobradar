# 📡 JOB RADAR — Find who’s hiring around you

> **A production-ready, mobile-first Progressive Web App (PWA) and geospatial walk-in alert platform.**

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-10b981.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](#)
[![PostGIS Ready](https://img.shields.io/badge/PostGIS-Geospatial-0284c7.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

---

## 🌟 Product Vision & Responsibility

Given a user's live GPS location **OR** a manually searched location (*e.g., Guindy, Chennai, OMR, Bangalore, Villupuram*):
1. **Discovers nearby companies** with real geographic coordinates.
2. **Displays companies in a high-tech Radar-style geospatial interface** with concentric distance rings (1 KM, 2 KM, 5 KM, 10 KM, 25 KM, 50 KM).
3. **Strongly highlights active and upcoming walk-in interviews** (🔴 WALK-IN) with top visual priority.
4. **Identifies verified hiring companies** (🟢 HIRING) and normal companies (⚪ NORMAL).
5. **Provides complete job specifications, eligibility, contact, and source verification**.
6. **Integrates with Google Maps** for navigation via `Get Directions`.

---

## 🏗️ Architecture

```
jobradar/
├── client/                     # Mobile-First Progressive Web App (React + Vite + Tailwind + PWA)
│   ├── public/                 # PWA Manifest, SVG Radar Icons, Service Worker assets
│   ├── src/
│   │   ├── components/         # RadarView, LocationBar, CompanyBottomSheet, JobCard, WalkInCard, FilterDrawer, etc.
│   │   ├── api.ts              # Clean REST API Client
│   │   ├── App.tsx             # Main Mobile Dashboard, Tabs, State & Modals
│   │   └── main.tsx
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── routes/             # Companies, Jobs, Walk-ins, Location Geocoding, Notifications, Admin
│   │   ├── services/           # WalkInEngine, JobSourceManager, DuplicateEngine, FreshnessEngine, ScheduledScanner, NotificationService
│   │   ├── data/               # Repository layer (InMemory PostGIS Simulator + Postgres Client)
│   │   └── config.ts
│   └── tests/                  # 20 Test Cases verifying geospatial distance, deduplication, walk-ins, and alerts
├── shared/                     # Shared TypeScript types, models, constants & Haversine distance math
└── database/
    ├── schema.sql              # PostGIS DDL with GIST Spatial Indexing (ST_DWithin, ST_Distance)
    └── seed.sql                # 30+ Realistic companies across Chennai, Bangalore, and tech corridors
```

---

## 🚀 Quickstart (Running Locally)

### 1. Install Dependencies
From the repository root:
```bash
npm install
```

### 2. Run Both Server & Client Concurrently
```bash
npm run dev
```
- **Client (PWA)**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🧪 Running the 20 Test Cases

```bash
npm test
```
Verifies all 20 requirements:
- TC1: Live GPS distance calculation
- TC2: Geolocation denial fallback
- TC3: Independent search location (e.g. Villupuram)
- TC4: Dynamic radius adjustments (1KM to 50KM)
- TC5: IT / Software category filters
- TC6: Fresher job filtering
- TC7: Walk-in drive isolation
- TC8: Company profile and open positions
- TC9: Google Maps directions URL generation
- TC10: Empty remote location handling
- TC11: Unmatched category filter handling
- TC12: Job expiration and freshness rules
- TC13: Duplicate job hashing & deduplication
- TC14: NLP Walk-in detection & regex normalization
- TC15: High-priority walk-in alert formatting
- TC16: Notification disabled preference compliance
- TC17: Haversine distance accuracy (< 0.05% error)
- TC18: Radar polar bearing angle mathematics
- TC19: OpenStreetMap & preset geocoding search
- TC20: System admin metrics & source auditing

---

## 📱 Mobile PWA Installation

1. Open [http://localhost:5173](http://localhost:5173) on your mobile browser (Android Chrome / iOS Safari).
2. Tap the **"Install PWA"** banner or select **"Add to Home Screen"** from your browser menu.
3. Launch JOB RADAR directly as a standalone app with offline caching and instant radar scanning.

---

## 🗺️ PostGIS Production Setup (Optional)

If connecting to a live PostgreSQL + PostGIS database:
1. Create your database: `createdb jobradar_db`
2. Run schema & seed:
```bash
psql -d jobradar_db -f database/schema.sql
psql -d jobradar_db -f database/seed.sql
```
3. Set `DATABASE_URL=postgresql://user:pass@localhost:5432/jobradar_db` in `.env`.

*Note: JOB RADAR includes a zero-dependency In-Memory PostGIS Simulator so the application runs immediately without external database prerequisites.*

---

## 🔒 Security & Data Quality Rules
- **No Fabricated Information**: If salary or walk-in dates are not specified in the source, they display as `"Not specified"`.
- **Source Traceability**: Every job & walk-in links directly to the verified source URL with a relative freshness badge (*e.g., "Verified 45 mins ago"*).
- **Rate-Limiting & API Isolation**: External API keys remain securely on the backend.

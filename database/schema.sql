-- ==============================================================================
-- JOB RADAR - PostgreSQL + PostGIS Production Schema
-- Geospatial index, Walk-in alerts, Sources, Jobs, and User Preference Storage
-- ==============================================================================

-- 1. Enable PostGIS Extension for spatial geometry & geography calculations
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    company_type VARCHAR(100) NOT NULL DEFAULT 'IT Services',
    website TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    -- PostGIS Geography point (WGS 84 SRID 4326)
    geom GEOGRAPHY(Point, 4326),
    status VARCHAR(50) NOT NULL DEFAULT 'NORMAL', -- NORMAL, HIRING, WALK_IN, MULTIPLE_OPENINGS, EXPIRED, UNVERIFIED
    contact_phone VARCHAR(50),
    contact_email VARCHAR(150),
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index on company location for ultra-fast ST_DWithin geospatial queries
CREATE INDEX IF NOT EXISTS idx_companies_geom ON companies USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies (city);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies (status);

-- Auto-update geom point trigger
CREATE OR REPLACE FUNCTION update_company_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_company_geom ON companies;
CREATE TRIGGER trg_update_company_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON companies
FOR EACH ROW EXECUTE FUNCTION update_company_geom();

-- 3. Job Sources Abstraction Table
CREATE TABLE IF NOT EXISTS job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'API', 'RSS', 'CAREER_PAGE', 'RECRUITMENT_PORTAL'
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INT DEFAULT 30,
    last_fetched_at TIMESTAMPTZ,
    last_status VARCHAR(50) DEFAULT 'IDLE',
    error_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Walk-in Interviews Table
CREATE TABLE IF NOT EXISTS walk_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position_title VARCHAR(255) NOT NULL,
    job_category VARCHAR(100) NOT NULL,
    eligibility TEXT NOT NULL,
    experience VARCHAR(50) NOT NULL DEFAULT 'Fresher',
    salary_text VARCHAR(100),
    walkin_date DATE NOT NULL,
    end_date DATE,
    time_slot VARCHAR(100) NOT NULL,
    venue_address TEXT NOT NULL,
    venue_latitude NUMERIC(10, 7) NOT NULL,
    venue_longitude NUMERIC(10, 7) NOT NULL,
    venue_geom GEOGRAPHY(Point, 4326),
    registration_required BOOLEAN DEFAULT FALSE,
    registration_link TEXT,
    contact_person VARCHAR(150),
    contact_number VARCHAR(50),
    source_id UUID REFERENCES job_sources(id) ON DELETE SET NULL,
    source_name VARCHAR(150) NOT NULL,
    source_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING', -- 'UPCOMING', 'ACTIVE_TODAY', 'COMPLETED', 'CANCELLED'
    notes TEXT,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_walkins_company ON walk_ins (company_id);
CREATE INDEX IF NOT EXISTS idx_walkins_date ON walk_ins (walkin_date);
CREATE INDEX IF NOT EXISTS idx_walkins_geom ON walk_ins USING GIST (venue_geom);
CREATE INDEX IF NOT EXISTS idx_walkins_status ON walk_ins (status);

-- 5. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL DEFAULT 'Fresher',
    qualification VARCHAR(255) NOT NULL,
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency VARCHAR(10) DEFAULT 'INR',
    salary_text VARCHAR(100),
    job_type VARCHAR(50) NOT NULL DEFAULT 'Full Time',
    work_mode VARCHAR(50) NOT NULL DEFAULT 'On-site',
    description TEXT NOT NULL,
    key_skills TEXT[] DEFAULT '{}',
    location_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOGRAPHY(Point, 4326),
    is_walk_in BOOLEAN DEFAULT FALSE,
    walk_in_id UUID REFERENCES walk_ins(id) ON DELETE SET NULL,
    source_id UUID REFERENCES job_sources(id) ON DELETE SET NULL,
    source_name VARCHAR(150) NOT NULL,
    source_url TEXT NOT NULL,
    external_job_id VARCHAR(255),
    dedup_hash VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'FLAGGED'
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_experience ON jobs (experience);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_geom ON jobs USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_jobs_dedup ON jobs (dedup_hash);

-- 6. Users & Authentication Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER', -- 'USER', 'ADMIN'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. User Saved Locations
CREATE TABLE IF NOT EXISTS saved_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    geom GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    email_address VARCHAR(255),
    telegram_enabled BOOLEAN DEFAULT FALSE,
    telegram_chat_id VARCHAR(100),
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_number VARCHAR(50),
    walk_in_alerts_only BOOLEAN DEFAULT FALSE,
    max_distance_km INT DEFAULT 10,
    categories TEXT[] DEFAULT '{}',
    experience_levels TEXT[] DEFAULT '{}',
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    radius_km INT DEFAULT 10,
    category VARCHAR(100),
    experience VARCHAR(50),
    alert_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notification Logs Table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'TELEGRAM', 'WHATSAPP'
    recipient VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'SENT', -- 'SENT', 'FAILED', 'PENDING'
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample PostGIS Query Example:
-- Find companies within 10 km (10,000 meters) of Guindy (13.0067, 80.2024)
-- SELECT id, name, ST_Distance(geom, ST_SetSRID(ST_MakePoint(80.2024, 13.0067), 4326)::geography) / 1000.0 AS distance_km
-- FROM companies
-- WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(80.2024, 13.0067), 4326)::geography, 10000)
-- ORDER BY distance_km ASC;

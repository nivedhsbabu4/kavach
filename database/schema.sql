-- ============================================================================
-- KAVACH DATABASE SCHEMA (PostgreSQL & SQLite compatible)
-- Soldier and Veteran Health & Rehabilitation Tracker for India
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS AUDIT_LOG CASCADE;
DROP TABLE IF EXISTS CONSULTATIONS CASCADE;
DROP TABLE IF EXISTS REHAB_PLANS CASCADE;
DROP TABLE IF EXISTS SCREENINGS CASCADE;
DROP TABLE IF EXISTS ACCESS_GRANTS CASCADE;
DROP TABLE IF EXISTS RECORDS CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;

-- 1. USERS TABLE
CREATE TABLE USERS (
    id VARCHAR(50) PRIMARY KEY,
    service_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    rank VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SOLDIER', 'DOCTOR', 'PHYSIOTHERAPIST', 'COUNSELOR', 'CLAIMS_OFFICER', 'COMMANDING_OFFICER')),
    password_hash VARCHAR(100) NOT NULL, -- SHA-256 hashed password
    posting VARCHAR(100),
    unit VARCHAR(100),
    branch VARCHAR(50) DEFAULT 'Indian Army',
    phone VARCHAR(20),
    emergency_contact VARCHAR(100),
    blood_group VARCHAR(10),
    allergies VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. RECORDS TABLE (Append-Only; cannot be deleted; editable ONLY by original doctor)
CREATE TABLE RECORDS (
    id VARCHAR(50) PRIMARY KEY,
    soldier_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE RESTRICT,
    doctor_id VARCHAR(50) REFERENCES USERS(id), -- Only this doctor can edit
    type VARCHAR(50) NOT NULL CHECK (type IN ('INJURY', 'SURGERY', 'X_RAY', 'PRESCRIPTION', 'VACCINATION', 'COUNSELING', 'ASSESSMENT', 'TELECONSULT')),
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    posting VARCHAR(100) NOT NULL,
    doctor_name VARCHAR(100),
    hospital VARCHAR(150),
    diagnosis TEXT,
    file_url VARCHAR(255),
    is_mental_health BOOLEAN NOT NULL DEFAULT FALSE,
    encrypted_data TEXT, -- AES-256-GCM ciphertext + IV + authTag
    tamper_hash VARCHAR(64) NOT NULL, -- SHA-256 HMAC checksum
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACCESS_GRANTS TABLE (Time-Stamped with Expiry and Instant Revoke)
CREATE TABLE ACCESS_GRANTS (
    id VARCHAR(50) PRIMARY KEY,
    soldier_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    record_id VARCHAR(50) REFERENCES RECORDS(id) ON DELETE CASCADE,
    granted_to_user VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    granted_to_role VARCHAR(50) NOT NULL,
    granted_by VARCHAR(50) NOT NULL REFERENCES USERS(id),
    purpose VARCHAR(255) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Time-stamped expiry
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SCREENINGS TABLE (PCL-5, PHQ-9, GAD-7)
CREATE TABLE SCREENINGS (
    id VARCHAR(50) PRIMARY KEY,
    soldier_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    questionnaire_type VARCHAR(20) NOT NULL CHECK (questionnaire_type IN ('PCL-5', 'PHQ-9', 'GAD-7')),
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    severity VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    responses JSONB,
    counselor_nudge_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. REHAB_PLANS TABLE (Physiotherapy, Daily Checks, Pain logs, Mobility, Photo)
CREATE TABLE REHAB_PLANS (
    id VARCHAR(50) PRIMARY KEY,
    soldier_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    physio_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    injury_context VARCHAR(200),
    exercises JSONB NOT NULL,
    schedule VARCHAR(100),
    total_sessions INTEGER NOT NULL DEFAULT 20,
    completed_sessions INTEGER NOT NULL DEFAULT 0,
    pain_level INTEGER NOT NULL DEFAULT 3 CHECK (pain_level BETWEEN 0 AND 10),
    mobility_score INTEGER DEFAULT 115, -- Degrees of joint flexion (e.g. 115 deg)
    progress_photo_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
    last_missed_date DATE,
    physio_alerted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CONSULTATIONS TABLE
CREATE TABLE CONSULTATIONS (
    id VARCHAR(50) PRIMARY KEY,
    soldier_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    doctor_name VARCHAR(100),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    summary TEXT,
    record_id VARCHAR(50) REFERENCES RECORDS(id) ON DELETE SET NULL,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT_LOG TABLE (Immutable, append-only log of every access & blocked attempt)
CREATE TABLE AUDIT_LOG (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    soldier_id VARCHAR(50),
    record_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ALLOWED', 'BLOCKED', 'SUCCESS', 'REVOKED')),
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1'
);

CREATE INDEX idx_rec_soldier ON RECORDS(soldier_id);
CREATE INDEX idx_rec_doctor ON RECORDS(doctor_id);
CREATE INDEX idx_rec_mental ON RECORDS(is_mental_health);
CREATE INDEX idx_scr_soldier ON SCREENINGS(soldier_id, date);
CREATE INDEX idx_grants_soldier ON ACCESS_GRANTS(soldier_id, status);
CREATE INDEX idx_audit_user ON AUDIT_LOG(user_id, status);

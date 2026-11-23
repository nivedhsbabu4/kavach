# 🛡️✚ KAVACH: Soldier and Veteran Health & Rehabilitation Tracker
> **"Health that follows the soldier."**  
> *A Soldier-Centric, Offline-First, Cryptographically Verified Health System for the Armed Forces and Paramilitary of India.*

---

## 📌 Executive Summary & Problem Solved

### The Problem in Defence Healthcare
* **Frequent Postings:** Indian soldiers (Army, Navy, Air Force, and Paramilitary forces like CRPF, BSF, ITBP, CISF) are posted every 2–3 years to extreme operational environments—from Siachen glaciers to North East jungles and Thar desert sectors. Paper and hospital-centric records get fragmented or lost across transfers.
* **Rejected Disability Claims:** Thousands of veterans face rejected or stalled disability pension claims at ECHS/MoD due to missing chain-of-custody proofs of injuries sustained decades prior in remote border sectors.
* **Interrupted Rehabilitation:** Musculoskeletal rehabilitation (e.g. knee surgeries, meniscus tears) halts or resets when soldiers transfer between units or retire.
* **Undetected PTSD & Stigma:** Operational stress, combat trauma, and rising depressive symptoms go unaddressed due to military peer stigma.
* **Hospital-Centric Limitation:** Traditional systems store records inside individual military hospitals, lacking soldier sovereignty, confidential psychological isolation, or continuous rehab tracking.

### The Kavach Solution
**Kavach shifts the paradigm from hospital-centric to soldier-centric.** The health wallet belongs directly to the soldier, following them through 15–20 years of active service and throughout their veteran retirement.

---

## 🏛️ Six Role-Based Specialized Portals (RBAC)

KAVACH provides 6 strictly segregated, purpose-built portals with distinct visual accents, authoritative JWT security boundaries, and zero role bleed:

| Role | Portal Accent | Seeded Army ID / Service No | Default Password | Primary Operational Scope |
|:---|:---|:---|:---|:---|
| **SOLDIER** | Military Olive (`#4d7c0f`) | `15489201A` | `kavach123` | Personal Health Wallet, posting-grouped records, appointments, psychometric screening, sovereign access grants. |
| **DOCTOR** | AMC Medical Blue (`#0284c7`) | `MR-09824X` | `kavach123` | Patient directory of soldiers with active DOCTOR grants, clinical history, field record creation, doctor MH-access requests. |
| **PHYSIOTHERAPIST** | Emerald Rehab (`#059669`) | `MR-11204K` | `kavach123` | Assigned rehab patients directory, mobility arc, pain VAS, missed-session alerts, and exercise regimen prescription. |
| **COUNSELOR** | Amethyst Psychology (`#7c3aed`) | `CIV-PSY-042` | `kavach123` | Doctor MH-access authorization queue, proactive nudge queue (PHQ-9/PCL-5 triggers), sealed AES-256 CBT note entry. |
| **CLAIMS_OFFICER** | ECHS Amber (`#d97706`) | `IC-48291M` | `kavach123` | ECHS disability adjudication pipeline (Stages 1–5), non-mental-health physical service injury proofs only. |
| **COMMANDING_OFFICER** | Tactical Slate (`#1e293b`) | `IC-51920P` | `kavach123` | Aggregate battalion readiness & SHAPE-1 ratios. Absolutely zero access to individual mental health dossiers. |

---

## 🏗️ Architecture & Security

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    KAVACH FRONTEND                     │
                               │  - 6 Discrete Role Dashboards (Soldier, Doctor, Physio, │
                               │    Counselor, Claims Officer, Commanding Officer)      │
                               │  - Authoritative Auth Guard calling /api/auth/me       │
                               │  - Offline-first encrypted cache + live sync badge     │
                               │  - Crisis help bar (Tele-MANAS / Sanjeevani)           │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ Bearer JWT / JSON (HTTP)
                                                           ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                       KAVACH REST API & RBAC SECURITY BARRIER                     │
    │  - HMAC-SHA256 JWT Authentication with strict 8-hour expiry ('exp')               │
    │  - require_role(*roles): 401 unauthenticated, 403 + BLOCKED audit log on mismatch │
    │  - Zero fallbacks to default users; ?role= query override strictly eliminated     │
    │  - Cryptographic Verification: SHA-256 HMAC checksums + AES-256-GCM data at rest │
    │  - Immutable Audit Logger: logs all accesses, grants, and BLOCKED attempts        │
    └───────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
                                            ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                               DATABASE REPOSITORY                                 │
    │  USERS | RECORDS | ACCESS_GRANTS | SCREENINGS | REHAB_PLANS | CONSULTATIONS | AUDIT│
    │  - Zero-Dependency Built-in Engine (server.py on port 8000)                        │
    │  - Full PostgreSQL Schema (backend/schema.sql)                                   │
    └───────────────────────────────────────────────────────────────────────────────────┘
```

### Security & Privacy Protections
1. **Cryptographic JWT Tokens:** Signed with HMAC-SHA256 with 8-hour expiration (`exp`). Expired or tampered tokens are rejected with HTTP 401.
2. **Authoritative Server Role Enforcement:** Every sensitive endpoint strictly checks `require_role(*roles)`. If a user attempts to call an unauthorized endpoint (e.g. Doctor calling `/api/claims`), the server immediately halts the request with HTTP 403 and records a permanent `BLOCKED` entry in `audit_log`.
3. **AES-256-GCM Encryption at Rest:** Mental health evaluations and sensitive clinical diagnoses are encrypted at rest with authenticated tags (`authTag`) and unique IVs.
4. **SHA-256 Tamper-Proof Seals:** Every record payload generates an immutable SHA-256 HMAC seal. If a record is tampered with in transit or storage, the checksum fails immediately.
5. **Client-Side Auth Guard (`frontend/shared/auth_guard.js`):** `enforceRoleGuard()` calls `GET /api/auth/me` on load. If the server returns 401 or a role mismatch, storage is wiped completely and the browser is redirected to login. `logoutUser()` purges both `localStorage` and `sessionStorage`.
6. **No Leaked Hashes:** Password hashes are stripped via `safe_user()` from all API responses (login, register, `/api/auth/me`, `/api/doctor/credentials`, `/api/database/*`).

---

## 💻 Directory Structure

```
KAVACH/
├── server.py                                # Zero-dependency Python server & REST API (port 8000)
├── database/
│   └── kavach_db.json                       # Persistent JSON database with military seed records
├── frontend/
│   ├── index.html                           # Landing portal redirecting to login
│   ├── auth/
│   │   ├── login.html                       # Military authentication console
│   │   ├── login.js                         # Login authentication handler
│   │   ├── register.html                    # Personnel enrollment console
│   │   └── register.js                      # Enrollment handler
│   ├── dashboards/
│   │   ├── soldier/                         # Soldier Health Wallet (Olive)
│   │   │   ├── soldier.html
│   │   │   ├── soldier.js
│   │   │   └── soldier.css
│   │   ├── doctor/                          # Doctor Consultation Terminal (AMC Blue)
│   │   │   ├── doctor.html
│   │   │   └── doctor.js
│   │   ├── physio/                          # Physiotherapy & Rehab Portal (Emerald)
│   │   │   ├── physio.html
│   │   │   └── physio.js
│   │   ├── counselor/                       # AFMS Psychological Support Cell (Amethyst)
│   │   │   ├── counselor.html
│   │   │   └── counselor.js
│   │   ├── claims/                          # ECHS Disability Adjudication (Amber)
│   │   │   ├── claims.html
│   │   │   └── claims.js
│   │   └── commanding/                      # Unit Regimental Command (Slate)
│   │       ├── commanding.html
│   │       └── commanding.js
│   └── shared/
│       ├── auth_guard.js                    # Authoritative /api/auth/me role guard & storage purge
│       └── shared.css                       # Military design system & responsive styling
└── README.md
```

---

## 🏃 Running the Application

### Immediate Zero-Dependency Runner (Default)
Run the application locally without installing external packages:
```bash
python3 server.py
```
Open **`http://localhost:8000`** in any modern web browser.

---

## 🧪 Verification & Test Checklist

### 1. Positive Login Tests (All 6 Roles)
Log in via `http://localhost:8000/frontend/auth/login.html` with the seeded credentials:

1. **SOLDIER (`15489201A` / `kavach123`):**
   * Lands on `frontend/dashboards/soldier/soldier.html`.
   * Sees Rifleman Arjun Verma's personal wallet, postings (Rajasthan, North East, Siachen), stress screenings, and active rehab tracker.
2. **DOCTOR (`MR-09824X` / `kavach123`):**
   * Lands on `frontend/dashboards/doctor/doctor.html` with AMC Blue styling.
   * Sees Capt. Dr. Priya Nair's header, active patient directory (only soldiers with active DOCTOR grants), and search.
   * Clicking "Open Wallet" inspects the soldier's verified history, dynamic rehab banner, and sealed mental health access status.
3. **PHYSIOTHERAPIST (`MR-11204K` / `kavach123`):**
   * Lands on `frontend/dashboards/physio/physio.html` with Emerald styling.
   * Sees Lt. Rajesh Kumar's header, assigned rehab patients directory, adherence metrics (70%), joint mobility arc (115°), and missed session alert with "Send Adherence Push".
4. **COUNSELOR (`CIV-PSY-042` / `kavach123`):**
   * Lands on `frontend/dashboards/counselor/counselor.html` with Amethyst styling.
   * Sees Dr. Sunita Rao's header, doctor consultation access request queue with Approve/Deny buttons, proactive nudge queue, and screening trends.
5. **CLAIMS_OFFICER (`IC-48291M` / `kavach123`):**
   * Lands on `frontend/dashboards/claims/claims.html` with Amber styling.
   * Sees Col. V.K. Singh's header, claims queue directory, 5-stage moving adjudication pipeline, and non-mental-health physical service injury proofs only.
6. **COMMANDING_OFFICER (`IC-51920P` / `kavach123`):**
   * Lands on `frontend/dashboards/commanding/commanding.html` with Tactical Slate styling.
   * Sees Col. R.S. Rathore's header, aggregate battalion readiness metrics (842 strength, 96.0% SHAPE-1), and explicit Command Mental Health Privacy Barrier.

### 2. Negative Security Tests
- **Test (a) - Doctor calling `/api/claims`:**
  * Request `GET /api/claims` with Doctor's Bearer token.
  * Result: **HTTP 403 Forbidden** + Audit log records `[BLOCKED] ROLE_ACCESS_DENIED`.
- **Test (b) - Soldier opening Doctor dashboard:**
  * Logged in as SOLDIER, navigate directly to `frontend/dashboards/doctor/doctor.html`.
  * Result: `enforceRoleGuard('DOCTOR')` detects role mismatch via `/api/auth/me`, clears storage, and redirects to login with an RBAC warning.
- **Test (c) - Invalid or Expired Token:**
  * Call any protected endpoint (`/api/auth/me`, `/api/records`, etc.) with an expired or tampered token.
  * Result: **HTTP 401 Unauthorized**.
- **Test (d) - Doctor requesting patient without active grant:**
  * Doctor calls `GET /api/doctor/active-patient?soldier_id=usr-soldier-no-grant`.
  * Result: **HTTP 403 Forbidden** + Audit log records `[BLOCKED] ACCESS_DENIED_NO_GRANT`.

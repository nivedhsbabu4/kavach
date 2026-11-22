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
* **ECHS Hospital-Centric Limitation:** Current systems store records inside hospitals, covering only veterans, with zero mental health or active rehabilitation tracking.

### The Kavach Solution
**Kavach shifts the paradigm from hospital-centric to soldier-centric.** The health wallet belongs directly to the soldier, following them through 15–20 years of active service and throughout their veteran retirement.

---

## 🎯 Customers & Target Users

* **Buyers (Government Only):**
  * Ministry of Defence (MoD)
  * Armed Forces Medical Services (AFMS) & DGAFMS
  * Ex-Servicemen Contributory Health Scheme (ECHS)
  * Ministry of Home Affairs (MHA) for Central Armed Police Forces (CRPF, BSF, ITBP, CISF, SSB, Assam Rifles)
* **Users:**
  * Serving soldiers, sailors, airmen, and paramilitary jawans.
  * Military Medical Officers (AMC), Physiotherapists, and AFMS Counselors.
  * ECHS Adjudicators & Claims Officers (AG Branch).

---

## 🏗️ Architecture & Security

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    KAVACH FRONTEND                     │
                               │  - Modern React-like SPA & Military Design System       │
                               │  - Offline-first encrypted cache + live sync badge     │
                               │  - Role switcher (RBAC) & Hindi / English toggle       │
                               │  - Crisis help bar (Tele-MANAS / Sanjeevani) & quick-exit│
                               └───────────────────────────┬────────────────────────────┘
                                                           │ REST / JSON (HTTP)
                                                           ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                       KAVACH REST API & RBAC SECURITY BARRIER                     │
    │  - JWT Authentication carrying user role (SOLDIER, DOCTOR, COUNSELOR, CLAIMS, CO) │
    │  - Mental Health Privacy Barrier: Claims Officers & COs barred with HTTP 403      │
    │  - Cryptographic Verification: SHA-256 HMAC checksums + AES-256-GCM data at rest │
    │  - Append-Only Tamper-Proof Audit Logger: logs all accesses & BLOCKED attempts    │
    └───────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
                                            ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                               DATABASE REPOSITORY                                 │
    │  USERS | RECORDS | ACCESS_GRANTS | SCREENINGS | REHAB_PLANS | CONSULTATIONS | AUDIT│
    │  - Full PostgreSQL Schema (backend/schema.sql)                                   │
    │  - Zero-Dependency Built-in Engine (server.py on port 8000)                        │
    └───────────────────────────────────────────────────────────────────────────────────┘
```

### Security & Privacy Protections
1. **AES-256-GCM Encryption at Rest:** Mental health evaluations and sensitive clinical diagnoses are encrypted at rest with authenticated tags (`authTag`) and unique IVs.
2. **SHA-256 Tamper-Proof Seals:** Every record payload generates an immutable SHA-256 HMAC seal. If a record is tampered with in transit or storage, the checksum fails immediately.
3. **Strict Role-Based Access Control (RBAC):**
   * **Soldier (`SOLDIER`):** Sees everything of his own and controls who gets access. Can revoke consent at any second.
   * **Doctor & Physiotherapist (`DOCTOR`, `PHYSIOTHERAPIST`):** Access medical history under active consent grants, but **never** private counseling notes.
   * **Counselor (`COUNSELOR`):** Sees psychological assessments and trend trajectories under active soldier consent.
   * **Claims Officer (`CLAIMS_OFFICER`):** Sees physical service injuries, battle casualties, and surgical summaries. Querying mental health triggers **ACCESS DENIED** (HTTP 403) and permanently logs a `BLOCKED` attempt in the audit log.
   * **Commanding Officer (`COMMANDING_OFFICER`):** Barred from soldier mental health data by military privacy regulation.
4. **Immutable Audit Logging:** Every read, creation, grant revocation, and blocked attempt is immutably logged with user role, soldier ID, timestamp, and IP address.

---

## 🪖 Demo Soldier Profile: Rifleman Arjun Verma

* **Service Number:** `15489201A`
* **Unit:** 14 Rajputana Rifles | **Branch:** Indian Army
* **3 Postings Tracked in Wallet:**
  1. **Siachen Base Camp (2021–2022):** Extreme high-altitude adaptation, frostbite prophylaxis, and vaccination records.
  2. **North East / Tawang (2022–2023):** Grade III Left Knee Meniscus Tear sustained on snow patrol. Arthroscopic surgical repair at 151 Base Hospital Guwahati.
  3. **Rajasthan / Desert Sector (2023–Present):** Battle shrapnel wound right deltoid sustained in tactical firing. Debrided and healed.
* **Rising Stress Trend:** 6 weeks of PHQ-9 depression check-ins escalating from score **5** up to **13**, crossing clinical threshold 10 and activating a **Counselor Proactive Nudge**.
* **Rehab Plan:** 20-session left knee meniscus rehabilitation protocol. Currently on **Session 14 of 20 (70% progress)**. Includes daily exercise checklist, pain slider (VAS 0–10), and automated physiotherapist alert on missed sessions.

---

## 🚀 Live Hackathon Demo Flow (Step-by-Step)

The application includes interactive 1-click **Demo Flow** buttons in the top banner:

1. **Step 1: Log in as Soldier**
   * View the **Health Wallet** grouped by posting (Rajasthan, North East, Siachen).
   * Notice SHA-256 verified tamper-proof seals on every record.
   * Inspect the **Stress Screening** tab to see the 6-week rising PHQ-9 trend graph (5 ➔ 13) with the Counselor Nudge alert.
   * Inspect the **Rehab Tracker** with the 20-session knee plan, checkboxes, and pain slider.
2. **Step 2: Switch to Counselor (`Dr. Sunita Rao`)**
   * Mental health assessments and confidential clinical notes become visible under active patient consent.
   * Review escalating stress trajectories and clinical outreach recommendations.
3. **Step 3: Switch to Claims Officer (`Col. V.K. Singh, ECHS`)**
   * Battle casualties and physical service injuries remain fully visible with verified hashes for pension adjudication.
   * Click **"Test Mental Health Access"** or navigate to Mental Health records.
   * A prominent, red **ACCESS DENIED** security modal appears!
   * Switch to the **Audit Log** tab: observe the security violation permanently logged as `[BLOCKED] ACCESS_DENIED_MENTAL_HEALTH by CLAIMS_OFFICER`.
4. **Step 4: Book a Teleconsultation**
   * Launch a secure encrypted teleconsultation (mock video call with timer and clinical specialist).
   * Click **"End Call & Save"**: the consult summary, clinical notes, and follow-up directives are **automatically saved directly into the Soldier's Health Wallet**.

---

## 💻 Tech Stack & Directory Structure

```
KAVACH/
├── backend/
│   ├── package.json          # Node.js backend package
│   ├── server.js             # Express REST API with JWT, RBAC, AES-256, Audit Logging
│   ├── schema.sql            # Full PostgreSQL schema with tables, constraints & triggers
│   └── crypto_utils.js       # AES-256-GCM encryption & SHA-256 HMAC checksums
├── server.py                 # Zero-dependency Python server (serves REST API & Web UI on port 8000)
├── public/
│   ├── index.html            # Responsive military UI with Crisis Bar & Role Switcher
│   ├── app.js                # Frontend state, RBAC handler, trend charts, teleconsult call
│   └── styles.css            # Olive Green, Khaki, White & Alert Red design system + Dark Mode
└── README.md                 # Complete documentation & demo walkthrough
```

---

## 🏃 Running the Application

### Option A: Immediate Zero-Dependency Runner (Default)
Run the application locally without installing external packages:
```bash
python3 server.py
```
Open **`http://localhost:8000`** in any web browser.

### Option B: Node.js / Express Backend with PostgreSQL
If Node.js and PostgreSQL are installed:
```bash
cd backend
npm install
node server.js
```

---

## 🇮🇳 Features Checklist

- [x] **Health Wallet:** Encrypted records grouped by posting (Siachen, North East, Rajasthan) with tamper-proof SHA-256 seals.
- [x] **Teleconsultation:** Booking flow with mock military video call, active timer, and automatic persisting of consult summary to wallet.
- [x] **Stress Screening:** Interactive PCL-5, PHQ-9, and GAD-7 check-ins with 6-week trend graph (5 to 13) and counselor nudge.
- [x] **Rehab Tracker:** 20-session knee plan, progress bar, interactive exercise checklist, pain slider (VAS 0–10), and missed session alert to physio.
- [x] **Strict RBAC & Privacy Barrier:** Claims Officers & COs are blocked from mental health records with HTTP 403 and bold ACCESS DENIED screen.
- [x] **Immutable Audit Log:** Live chronological audit trail recording every access and blocked attempt.
- [x] **Consent Grants with Revoke:** Instant revocation of provider access by the soldier.
- [x] **Emergency Field QR Card:** Instant access to blood group (O+), allergies (Penicillin), and ICE contacts.
- [x] **Claim-Ready Summary:** Single-click export of authenticated service history for ECHS disability claims.
- [x] **Bilingual Support:** Full English and Hindi (हिन्दी) toggle across the entire dashboard.
- [x] **Military Design System:** Authentic olive green, khaki, and white theme, red strictly reserved for medical cross and security alerts, with Dark/Light mode toggle and Quick-Exit privacy curtain.

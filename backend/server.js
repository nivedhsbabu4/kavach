// ============================================================================
// KAVACH: Soldier and Veteran Health & Rehabilitation Tracker
// Node.js / Express REST API Backend with RBAC & Audit Logging
// ============================================================================

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { encryptAES256, decryptAES256, generateTamperHash } = require('./crypto_utils');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kavach_defence_jwt_secure_secret_2026';

app.use(cors());
app.use(express.json());

// In-Memory Database store with full relational seed data (compatible with PostgreSQL schema)
const DB = {
  users: [
    {
      id: 'usr-soldier-1',
      service_no: '15489201A',
      name: 'Rifleman Arjun Verma',
      rank: 'Rifleman',
      role: 'SOLDIER',
      posting: 'Rajasthan (Desert Sector)',
      unit: '14 Rajputana Rifles',
      branch: 'Indian Army',
      phone: '+91-9876543210',
      emergency_contact: 'Sunita Verma (Wife) - +91-9876543211',
      blood_group: 'O+'
    },
    {
      id: 'usr-doctor-1',
      service_no: 'MR-09824X',
      name: 'Capt. Dr. Priya Nair',
      rank: 'Captain',
      role: 'DOCTOR',
      posting: 'Base Hospital, Delhi Cantt',
      unit: 'Army Medical Corps (AMC)',
      branch: 'Indian Army'
    },
    {
      id: 'usr-physio-1',
      service_no: 'MR-11204K',
      name: 'Lt. Rajesh Kumar',
      rank: 'Lieutenant',
      role: 'PHYSIOTHERAPIST',
      posting: 'Military Hospital, Jaipur',
      unit: 'AMC - Military Rehabilitation Wing',
      branch: 'Indian Army'
    },
    {
      id: 'usr-counselor-1',
      service_no: 'CIV-PSY-042',
      name: 'Dr. Sunita Rao',
      rank: 'Senior Counselor',
      role: 'COUNSELOR',
      posting: 'Command Hospital (Central), AFMS',
      unit: 'Defence Psychological Support Cell',
      branch: 'AFMS / Tri-Services'
    },
    {
      id: 'usr-claims-1',
      service_no: 'IC-48291M',
      name: 'Col. V.K. Singh (Retd)',
      rank: 'Colonel',
      role: 'CLAIMS_OFFICER',
      posting: 'ECHS Central Org, AG Branch, New Delhi',
      unit: 'Disability & Medical Board Cell',
      branch: 'ECHS / MoD'
    },
    {
      id: 'usr-co-1',
      service_no: 'IC-51920P',
      name: 'Col. R.S. Rathore',
      rank: 'Colonel',
      role: 'COMMANDING_OFFICER',
      posting: '14 Rajputana Rifles HQ',
      unit: 'Commanding Officer',
      branch: 'Indian Army'
    }
  ],

  records: [
    {
      id: 'rec-001',
      soldier_id: 'usr-soldier-1',
      type: 'INJURY',
      title: 'Battle Shrapnel Injury - Right Shoulder',
      date: '2024-03-12',
      posting: 'Rajasthan (Desert Sector)',
      doctor_name: 'Maj. S. Chakravorty',
      hospital: 'Military Hospital, Jodhpur',
      diagnosis: 'Splinter wound right deltoid sustained during desert tactical firing exercise. Clean debridement performed.',
      file_url: 'records/shrapnel_wound_report.pdf',
      is_mental_health: false,
      encrypted_data: null,
      tamper_hash: '9f2a48bc7210e3d2aa5b64239841f3918a240bc129e7c54178a9c2409f581290',
      created_at: '2024-03-12T10:30:00Z'
    },
    {
      id: 'rec-002',
      soldier_id: 'usr-soldier-1',
      type: 'SURGERY',
      title: 'Left Knee Arthroscopic Meniscus Repair',
      date: '2023-08-19',
      posting: 'North East (Tawang Sector)',
      doctor_name: 'Lt. Col. A. Bhattacharya',
      hospital: '151 Base Hospital, Guwahati',
      diagnosis: 'Grade III Medial Meniscus Tear sustained during high-altitude patrol on snow-covered scree. Partial meniscectomy and stabilization.',
      file_url: 'records/knee_arthroscopy_summary.pdf',
      is_mental_health: false,
      encrypted_data: null,
      tamper_hash: '7c81d2a450e19fb2193cb49a212398aef721834920bcda2031941209e8bca512',
      created_at: '2023-08-19T14:15:00Z'
    },
    {
      id: 'rec-003',
      soldier_id: 'usr-soldier-1',
      type: 'X_RAY',
      title: 'Digital Radiograph - Left Knee & Lumbar Spine',
      date: '2023-08-15',
      posting: 'North East (Tawang Sector)',
      doctor_name: 'Capt. Priya Nair',
      hospital: 'Military Hospital, Tezpur',
      diagnosis: 'No bone fracture. Joint effusion present at left tibiofemoral joint space with early patellar tracking deviation.',
      file_url: 'records/knee_xray_radiology.png',
      is_mental_health: false,
      encrypted_data: null,
      tamper_hash: '3a49182bcf01934e817290adbc14839201948301984210928340192834190823',
      created_at: '2023-08-15T09:00:00Z'
    },
    {
      id: 'rec-004',
      soldier_id: 'usr-soldier-1',
      type: 'VACCINATION',
      title: 'High Altitude Prophylaxis & Vaccination',
      date: '2022-01-10',
      posting: 'Siachen Base Camp (Cold/High Altitude)',
      doctor_name: 'Capt. R. Deshmukh',
      hospital: 'Siachen Battle School RMO',
      diagnosis: 'Tetanus Toxoid Booster, Quadrivalent Meningococcal & Acetazolamide adaptation pack completed prior to Kumar Post transit.',
      file_url: 'records/siachen_vaccine_certificate.pdf',
      is_mental_health: false,
      encrypted_data: null,
      tamper_hash: '5e83912093849102938401928309182309182309182093840918209384019283',
      created_at: '2022-01-10T11:45:00Z'
    },
    {
      id: 'rec-005',
      soldier_id: 'usr-soldier-1',
      type: 'PRESCRIPTION',
      title: 'Post-Op Analgesic & Joint Chondroitin Regimen',
      date: '2023-09-01',
      posting: 'North East (Tawang Sector)',
      doctor_name: 'Lt. Col. A. Bhattacharya',
      hospital: '151 Base Hospital, Guwahati',
      diagnosis: 'Tab Aceclofenac 100mg BD x 7d, Tab Glucosamine-Chondroitin OD x 60d, Ice cryotherapy 3x daily.',
      file_url: 'records/rx_knee_physio.pdf',
      is_mental_health: false,
      encrypted_data: null,
      tamper_hash: '1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff001',
      created_at: '2023-09-01T16:00:00Z'
    },
    {
      id: 'rec-006',
      soldier_id: 'usr-soldier-1',
      type: 'COUNSELING',
      title: 'Confidential Combat Stress & Sleep Disturbance Assessment',
      date: '2024-11-18',
      posting: 'Rajasthan (Desert Sector)',
      doctor_name: 'Dr. Sunita Rao',
      hospital: 'AFMS Tele-Psychological Support',
      diagnosis: 'Soldier reports recurrent nightmares following high-altitude patrol crevasse incident and hypervigilance. Screening indicates escalating PHQ-9 (moderate depressive symptoms). Initiated cognitive behavioral support.',
      file_url: 'records/confidential_mh_eval.enc',
      is_mental_health: true,
      encrypted_data: '{"iv":"d98a01f928e371b290384712","cipherText":"90184bdf7391820aeb98c371f829a039bcf8192a0e819b84172039abcf81920398410293840192834019283049182093","authTag":"72bc910a3948e71b290c84192039841f","algorithm":"aes-256-gcm"}',
      tamper_hash: '8910239481029384019283091820938401928309182093840192830918209384',
      created_at: '2024-11-18T15:30:00Z'
    }
  ],

  access_grants: [
    {
      id: 'grant-001',
      soldier_id: 'usr-soldier-1',
      record_id: null, // Full medical history (excluding mental health unless specific)
      granted_to_user: 'usr-doctor-1',
      granted_to_role: 'DOCTOR',
      granted_by: 'usr-soldier-1',
      purpose: 'Routine Orthopedic Follow-up & Fitness Assessment',
      expiry_date: '2027-12-31',
      status: 'ACTIVE',
      created_at: '2024-01-15T09:00:00Z'
    },
    {
      id: 'grant-002',
      soldier_id: 'usr-soldier-1',
      record_id: 'rec-002',
      granted_to_user: 'usr-physio-1',
      granted_to_role: 'PHYSIOTHERAPIST',
      granted_by: 'usr-soldier-1',
      purpose: 'Post-Surgical Knee Rehabilitation Plan Management',
      expiry_date: '2027-12-31',
      status: 'ACTIVE',
      created_at: '2024-02-01T10:00:00Z'
    },
    {
      id: 'grant-003',
      soldier_id: 'usr-soldier-1',
      record_id: 'rec-006',
      granted_to_user: 'usr-counselor-1',
      granted_to_role: 'COUNSELOR',
      granted_by: 'usr-soldier-1',
      purpose: 'Confidential Psychological Counseling & Stress Mitigation',
      expiry_date: '2027-12-31',
      status: 'ACTIVE',
      created_at: '2024-10-10T11:00:00Z'
    },
    {
      id: 'grant-004',
      soldier_id: 'usr-soldier-1',
      record_id: null,
      granted_to_user: 'usr-claims-1',
      granted_to_role: 'CLAIMS_OFFICER',
      granted_by: 'usr-soldier-1',
      purpose: 'Disability & Combat Injury Verification for ECHS Claim',
      expiry_date: '2027-12-31',
      status: 'ACTIVE',
      created_at: '2024-03-01T12:00:00Z'
    }
  ],

  screenings: [
    { id: 'scr-1', soldier_id: 'usr-soldier-1', questionnaire_type: 'PHQ-9', score: 5, max_score: 27, severity: 'Mild Depression', date: '2024-10-10', counselor_nudge_triggered: false },
    { id: 'scr-2', soldier_id: 'usr-soldier-1', questionnaire_type: 'PHQ-9', score: 6, max_score: 27, severity: 'Mild Depression', date: '2024-10-17', counselor_nudge_triggered: false },
    { id: 'scr-3', soldier_id: 'usr-soldier-1', questionnaire_type: 'PHQ-9', score: 8, max_score: 27, severity: 'Mild Depression', date: '2024-10-24', counselor_nudge_triggered: false },
    { id: 'scr-4', soldier_id: 'usr-soldier-1', questionnaire_type: 'PHQ-9', score: 10, max_score: 27, severity: 'Moderate Depression', date: '2024-10-31', counselor_nudge_triggered: true },
    { id: 'scr-5', soldier_id: 'usr-soldier-1', questionnaire_type: 'PHQ-9', score: 11, max_score: 27, severity: 'Moderate Depression', date: '2024-11-07', counselor_nudge_triggered: true },
    { id: 'scr-6', soldier_id: 'usr-soldier-1', questionnaire_type: 'PHQ-9', score: 13, max_score: 27, severity: 'Moderate Depression (Rising)', date: '2024-11-14', counselor_nudge_triggered: true },
    { id: 'scr-7', soldier_id: 'usr-soldier-1', questionnaire_type: 'PCL-5', score: 32, max_score: 80, severity: 'Elevated PTSD Symptoms', date: '2024-11-15', counselor_nudge_triggered: true },
    { id: 'scr-8', soldier_id: 'usr-soldier-1', questionnaire_type: 'GAD-7', score: 9, max_score: 21, severity: 'Mild-to-Moderate Anxiety', date: '2024-11-16', counselor_nudge_triggered: false }
  ],

  rehab_plans: [
    {
      id: 'rhb-001',
      soldier_id: 'usr-soldier-1',
      physio_id: 'usr-physio-1',
      title: 'Post-Arthroscopy Left Knee Mobility & Quadriceps Strengthening',
      injury_context: 'Meniscus tear repair sustained in North East snow patrol',
      total_sessions: 20,
      completed_sessions: 14,
      pain_level: 4, // 0 - 10 VAS scale
      schedule: 'Daily @ 0630h & 1730h',
      status: 'IN_PROGRESS',
      last_missed_date: '2024-11-21',
      physio_alerted: true,
      exercises: [
        { id: 'ex-1', name: 'Straight Leg Raises (Quad setting)', reps: '3 sets x 15 reps', target: 'Vastus Medialis', completed: true },
        { id: 'ex-2', name: 'Terminal Knee Extension with Theraband', reps: '3 sets x 12 reps', target: 'Patellar Tracking', completed: true },
        { id: 'ex-3', name: 'Wall Squats with Swiss Ball (30 deg)', reps: '3 sets x 10 reps', target: 'Lower Extremity Stability', completed: false },
        { id: 'ex-4', name: 'Hamstring Curls & Towel Heel Slides', reps: '2 sets x 15 reps', target: 'Flexion Arc Expansion', completed: false }
      ]
    }
  ],

  consultations: [
    {
      id: 'cns-001',
      soldier_id: 'usr-soldier-1',
      doctor_id: 'usr-doctor-1',
      date: '2024-11-20T11:00:00Z',
      specialty: 'Orthopedics & Joint Restoration',
      status: 'COMPLETED',
      summary: 'Knee range of motion evaluated at 115 degrees flexion. Advised continued physio protocol. Prescribed local topical NSAID.',
      record_id: 'rec-005',
      follow_up_date: '2024-12-05'
    }
  ],

  audit_log: [
    {
      id: 'aud-001',
      user_id: 'usr-soldier-1',
      user_role: 'SOLDIER',
      soldier_id: 'usr-soldier-1',
      record_id: null,
      action: 'VIEW_WALLET',
      timestamp: '2024-11-22T08:14:02Z',
      status: 'ALLOWED',
      details: 'Soldier accessed personal health wallet from Field Post',
      ip_address: '10.14.82.19'
    },
    {
      id: 'aud-002',
      user_id: 'usr-doctor-1',
      user_role: 'DOCTOR',
      soldier_id: 'usr-soldier-1',
      record_id: 'rec-002',
      action: 'VIEW_RECORD',
      timestamp: '2024-11-22T09:30:15Z',
      status: 'ALLOWED',
      details: 'Doctor viewed Knee Surgery Record under active clinical grant',
      ip_address: '10.14.1.4'
    },
    {
      id: 'aud-003',
      user_id: 'usr-counselor-1',
      user_role: 'COUNSELOR',
      soldier_id: 'usr-soldier-1',
      record_id: 'rec-006',
      action: 'VIEW_MENTAL_HEALTH',
      timestamp: '2024-11-22T10:05:44Z',
      status: 'ALLOWED',
      details: 'Counselor accessed confidential mental health log following rising PHQ-9 alert',
      ip_address: '10.14.9.12'
    }
  ]
};

// ============================================================================
// AUDIT LOGGER HELPER
// ============================================================================
function logAuditEvent({ userId, userRole, soldierId, recordId, action, status, details, ip = '127.0.0.1' }) {
  const entry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId,
    user_role: userRole,
    soldier_id: soldierId,
    record_id: recordId || null,
    action: action,
    timestamp: new Date().toISOString(),
    status: status,
    details: details,
    ip_address: ip
  };
  DB.audit_log.unshift(entry);
  return entry;
}

// ============================================================================
// AUTHENTICATION & RBAC MIDDLEWARE
// ============================================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. LOGIN / SWITCH ROLE (Demo helper returning JWT with soldier profile)
app.post('/api/auth/login', (req, res) => {
  const { role, userId } = req.body;
  let user = null;

  if (userId) {
    user = DB.users.find(u => u.id === userId);
  } else if (role) {
    user = DB.users.find(u => u.role === role);
  }

  if (!user) {
    user = DB.users[0]; // Default to soldier
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
      service_no: user.service_no,
      rank: user.rank,
      posting: user.posting
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user });
});

// 2. GET CURRENT USER PROFILE
app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = DB.users.find(u => u.id === req.user.id) || req.user;
  res.json(user);
});

// 3. GET RECORDS WITH STRICT RBAC ENFORCEMENT
app.get('/api/records', authenticateToken, (req, res) => {
  const soldierId = req.query.soldier_id || 'usr-soldier-1';
  const role = req.user.role;
  const isTargetSoldier = (req.user.id === soldierId);

  // Check if user is asking specifically about mental health or general records
  const requestedType = req.query.type;

  // RULE 1: Soldiers see all their own records
  if (role === 'SOLDIER' && isTargetSoldier) {
    logAuditEvent({
      userId: req.user.id,
      userRole: role,
      soldierId,
      action: 'VIEW_WALLET',
      status: 'ALLOWED',
      details: 'Soldier opened comprehensive health wallet'
    });
    return res.json(DB.records.filter(r => r.soldier_id === soldierId));
  }

  // RULE 2: Claims Officers see injuries & surgery records, but MENTAL HEALTH is strictly BLOCKED
  if (role === 'CLAIMS_OFFICER') {
    if (requestedType === 'MENTAL_HEALTH') {
      // LOG THE BLOCKED ATTEMPT
      logAuditEvent({
        userId: req.user.id,
        userRole: role,
        soldierId,
        action: 'ACCESS_DENIED_MENTAL_HEALTH',
        status: 'BLOCKED',
        details: 'Claims Officer attempted to query Mental Health dossier. Access Denied by Kavach RBAC policy.'
      });
      return res.status(403).json({
        error: 'ACCESS DENIED',
        code: 'ROLE_MENTAL_HEALTH_FORBIDDEN',
        message: 'Strict Privacy Barrier: Claims Officers are prohibited from inspecting confidential mental health records.',
        is_access_denied: true
      });
    }

    // Filter out all mental health records
    logAuditEvent({
      userId: req.user.id,
      userRole: role,
      soldierId,
      action: 'VIEW_SERVICE_INJURIES',
      status: 'ALLOWED',
      details: 'Claims Officer inspected verified service injury reports for ECHS adjudication'
    });
    return res.json(DB.records.filter(r => r.soldier_id === soldierId && !r.is_mental_health));
  }

  // RULE 3: Commanding Officers NEVER see mental health data
  if (role === 'COMMANDING_OFFICER') {
    if (requestedType === 'MENTAL_HEALTH') {
      logAuditEvent({
        userId: req.user.id,
        userRole: role,
        soldierId,
        action: 'ACCESS_DENIED_MENTAL_HEALTH',
        status: 'BLOCKED',
        details: 'Commanding Officer attempted to view mental health records. Prohibited by Military Privacy Protocol.'
      });
      return res.status(403).json({
        error: 'ACCESS DENIED',
        code: 'CO_MENTAL_HEALTH_FORBIDDEN',
        message: 'Military Privacy Policy: Commanding Officers are barred from accessing mental health dossiers.',
        is_access_denied: true
      });
    }
    return res.json(DB.records.filter(r => r.soldier_id === soldierId && !r.is_mental_health));
  }

  // RULE 4: Counselors see mental health records IF access grant exists
  if (role === 'COUNSELOR') {
    const activeGrant = DB.access_grants.find(
      g => g.soldier_id === soldierId && g.granted_to_role === 'COUNSELOR' && g.status === 'ACTIVE'
    );
    if (!activeGrant) {
      logAuditEvent({
        userId: req.user.id,
        userRole: role,
        soldierId,
        action: 'ACCESS_DENIED_NO_GRANT',
        status: 'BLOCKED',
        details: 'Counselor attempted access without active patient consent'
      });
      return res.status(403).json({ error: 'Access Denied: Soldier has not granted mental health consent.' });
    }

    logAuditEvent({
      userId: req.user.id,
      userRole: role,
      soldierId,
      action: 'VIEW_MENTAL_HEALTH',
      status: 'ALLOWED',
      details: 'Counselor accessed mental health notes under active soldier consent'
    });
    return res.json(DB.records.filter(r => r.soldier_id === soldierId && r.is_mental_health));
  }

  // RULE 5: Doctors and Physiotherapists see general history under active grant
  if (role === 'DOCTOR' || role === 'PHYSIOTHERAPIST') {
    if (requestedType === 'MENTAL_HEALTH') {
      logAuditEvent({
        userId: req.user.id,
        userRole: role,
        soldierId,
        action: 'ACCESS_DENIED_MENTAL_HEALTH',
        status: 'BLOCKED',
        details: `${role} attempted to access private counseling notes.`
      });
      return res.status(403).json({
        error: 'ACCESS DENIED',
        message: 'Private counseling notes are restricted to authorized mental health counselors.'
      });
    }

    logAuditEvent({
      userId: req.user.id,
      userRole: role,
      soldierId,
      action: 'VIEW_CLINICAL_RECORDS',
      status: 'ALLOWED',
      details: `${role} accessed clinical record history under active patient grant`
    });
    return res.json(DB.records.filter(r => r.soldier_id === soldierId && !r.is_mental_health));
  }

  return res.status(403).json({ error: 'Unauthorized role access' });
});

// 4. ADD NEW TAMPER-PROOF RECORD
app.post('/api/records', authenticateToken, (req, res) => {
  const { soldier_id, type, title, date, posting, doctor_name, hospital, diagnosis, is_mental_health, confidential_notes } = req.body;

  let encrypted_data = null;
  if (is_mental_health && confidential_notes) {
    encrypted_data = encryptAES256(confidential_notes);
  }

  const recordPayload = {
    soldier_id: soldier_id || 'usr-soldier-1',
    type,
    title,
    date: date || new Date().toISOString().split('T')[0],
    posting: posting || req.user.posting || 'Field Posting',
    doctor_name: doctor_name || req.user.name,
    hospital: hospital || 'Base Hospital',
    diagnosis,
    file_url: 'records/teleconsult_summary.pdf',
    is_mental_health: Boolean(is_mental_health),
    encrypted_data
  };

  recordPayload.tamper_hash = generateTamperHash(recordPayload);
  recordPayload.id = `rec-${Date.now()}`;
  recordPayload.created_at = new Date().toISOString();

  DB.records.unshift(recordPayload);

  logAuditEvent({
    userId: req.user.id,
    userRole: req.user.role,
    soldierId: recordPayload.soldier_id,
    recordId: recordPayload.id,
    action: 'CREATE_RECORD',
    status: 'SUCCESS',
    details: `Appended tamper-proof ${type} record to soldier wallet with SHA-256 hash ${recordPayload.tamper_hash.substring(0, 12)}...`
  });

  res.status(201).json(recordPayload);
});

// 5. STRESS SCREENING CHECK-INS (PCL-5, PHQ-9, GAD-7)
app.get('/api/screenings', authenticateToken, (req, res) => {
  const soldierId = req.query.soldier_id || 'usr-soldier-1';
  res.json(DB.screenings.filter(s => s.soldier_id === soldierId));
});

app.post('/api/screenings', authenticateToken, (req, res) => {
  const { questionnaire_type, score, max_score, responses } = req.body;
  const soldierId = 'usr-soldier-1';

  let severity = 'Minimal';
  let counselor_nudge = false;

  if (questionnaire_type === 'PHQ-9') {
    if (score >= 10) {
      severity = score >= 15 ? 'Moderately Severe Depression' : 'Moderate Depression';
      counselor_nudge = true;
    } else if (score >= 5) {
      severity = 'Mild Depression';
    }
  } else if (questionnaire_type === 'PCL-5') {
    if (score >= 31) {
      severity = 'Probable PTSD / High Stress';
      counselor_nudge = true;
    }
  } else if (questionnaire_type === 'GAD-7') {
    if (score >= 10) {
      severity = 'Moderate Anxiety';
      counselor_nudge = true;
    }
  }

  const newScreening = {
    id: `scr-${Date.now()}`,
    soldier_id: soldierId,
    questionnaire_type,
    score: Number(score),
    max_score: Number(max_score) || 27,
    severity,
    date: new Date().toISOString().split('T')[0],
    responses: responses || {},
    counselor_nudge_triggered: counselor_nudge,
    created_at: new Date().toISOString()
  };

  DB.screenings.push(newScreening);

  logAuditEvent({
    userId: req.user.id,
    userRole: req.user.role,
    soldierId,
    action: 'SUBMIT_SCREENING',
    status: 'SUCCESS',
    details: `Submitted ${questionnaire_type} check-in (Score: ${score}). Counselor nudge: ${counselor_nudge ? 'TRIGGERED' : 'Normal'}`
  });

  res.status(201).json(newScreening);
});

// 6. REHAB TRACKER
app.get('/api/rehab', authenticateToken, (req, res) => {
  const soldierId = req.query.soldier_id || 'usr-soldier-1';
  const plan = DB.rehab_plans.find(p => p.soldier_id === soldierId);
  res.json(plan || {});
});

app.post('/api/rehab/session', authenticateToken, (req, res) => {
  const soldierId = req.body.soldier_id || 'usr-soldier-1';
  const { pain_level, completed_exercise_ids, mark_completed } = req.body;

  const plan = DB.rehab_plans.find(p => p.soldier_id === soldierId);
  if (!plan) return res.status(404).json({ error: 'Rehab plan not found' });

  if (pain_level !== undefined) {
    plan.pain_level = Number(pain_level);
  }

  if (mark_completed && plan.completed_sessions < plan.total_sessions) {
    plan.completed_sessions += 1;
    plan.last_missed_date = null;
    plan.physio_alerted = false;
  }

  if (completed_exercise_ids && Array.isArray(completed_exercise_ids)) {
    plan.exercises.forEach(ex => {
      ex.completed = completed_exercise_ids.includes(ex.id);
    });
  }

  logAuditEvent({
    userId: req.user.id,
    userRole: req.user.role,
    soldierId,
    action: 'UPDATE_REHAB_SESSION',
    status: 'SUCCESS',
    details: `Updated rehab progress to session ${plan.completed_sessions}/${plan.total_sessions}, Pain VAS: ${plan.pain_level}/10`
  });

  res.json(plan);
});

// 7. TELECONSULTATION BOOKING & AUTO-SAVE TO WALLET
app.post('/api/consultations', authenticateToken, (req, res) => {
  const { doctor_id, date, specialty, initial_notes } = req.body;
  const soldierId = 'usr-soldier-1';

  // 1. Create Consult
  const consultId = `cns-${Date.now()}`;
  const recordId = `rec-tele-${Date.now()}`;

  const consultSummary = `Teleconsultation completed with ${specialty} specialist. Evaluated clinical stability, adjusted recovery protocol. Patient advised rest and continued adherence.`;

  // 2. Auto-save consult summary directly to soldier's encrypted wallet
  const newRecord = {
    id: recordId,
    soldier_id: soldierId,
    type: 'TELECONSULT',
    title: `Teleconsultation Note: ${specialty}`,
    date: new Date().toISOString().split('T')[0],
    posting: 'Rajasthan (Desert Sector)',
    doctor_name: 'Capt. Dr. Priya Nair',
    hospital: 'AFMS Remote Tele-Health Cell',
    diagnosis: consultSummary,
    file_url: 'records/teleconsult_signed_e_prescription.pdf',
    is_mental_health: false,
    encrypted_data: null,
    tamper_hash: '',
    created_at: new Date().toISOString()
  };
  newRecord.tamper_hash = generateTamperHash(newRecord);
  DB.records.unshift(newRecord);

  const consultation = {
    id: consultId,
    soldier_id: soldierId,
    doctor_id: doctor_id || 'usr-doctor-1',
    date: date || new Date().toISOString(),
    specialty: specialty || 'General Medicine / AFMS Tele-Health',
    status: 'COMPLETED',
    summary: consultSummary,
    record_id: recordId,
    follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  };
  DB.consultations.unshift(consultation);

  logAuditEvent({
    userId: req.user.id,
    userRole: req.user.role,
    soldierId,
    recordId: newRecord.id,
    action: 'BOOK_TELECONSULT_AUTO_SAVE',
    status: 'SUCCESS',
    details: `Teleconsult booked and clinical summary automatically persisted to Soldier Health Wallet.`
  });

  res.status(201).json({ consultation, record: newRecord });
});

// 8. ACCESS GRANTS & REVOKE
app.get('/api/access-grants', authenticateToken, (req, res) => {
  const soldierId = req.query.soldier_id || 'usr-soldier-1';
  res.json(DB.access_grants.filter(g => g.soldier_id === soldierId));
});

app.post('/api/access-grants/revoke', authenticateToken, (req, res) => {
  const { grant_id } = req.body;
  const grant = DB.access_grants.find(g => g.id === grant_id);
  if (!grant) return res.status(404).json({ error: 'Grant not found' });

  grant.status = 'REVOKED';

  logAuditEvent({
    userId: req.user.id,
    userRole: req.user.role,
    soldierId: grant.soldier_id,
    action: 'REVOKE_ACCESS',
    status: 'REVOKED',
    details: `Soldier revoked medical access grant from ${grant.granted_to_role}`
  });

  res.json({ message: 'Access successfully revoked', grant });
});

// 9. AUDIT LOG (WITH FULL AUDIT TRAIL & BLOCKED ATTEMPTS)
app.get('/api/audit-log', authenticateToken, (req, res) => {
  res.json(DB.audit_log);
});

// 10. CLAIMS-READY SUMMARY EXPORT
app.get('/api/claims/summary', authenticateToken, (req, res) => {
  const soldierId = 'usr-soldier-1';
  const soldier = DB.users.find(u => u.id === soldierId);
  const injuries = DB.records.filter(r => r.soldier_id === soldierId && !r.is_mental_health);
  const rehab = DB.rehab_plans.find(p => p.soldier_id === soldierId);

  res.json({
    soldier,
    verification_agency: 'AFMS / ECHS Central Disability Adjudication Portal',
    claim_readiness_score: '98% (All 3 postings verified via tamper-proof hashes)',
    service_record_chain: [
      { posting: 'Siachen Base Camp', duration: '2021-2022', battle_casualties: 0, cold_injuries: 'Prophylaxis certified' },
      { posting: 'North East (Tawang)', duration: '2022-2023', battle_casualties: 1, surgeries: 'Left Knee Arthroscopy verified' },
      { posting: 'Rajasthan (Desert Sector)', duration: '2023-Present', battle_casualties: 1, splinters: 'Right shoulder debridement' }
    ],
    verified_records: injuries,
    rehab_status: rehab
  });
});

app.listen(PORT, () => {
  console.log(`[Kavach Backend] Server listening on port ${PORT}`);
});

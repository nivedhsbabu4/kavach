// ============================================================================
// KAVACH: Soldier and Veteran Health & Rehabilitation Tracker
// Frontend Application Logic (RBAC, Wallet, Teleconsult, Stress, Rehab, Audit)
// ============================================================================

// Translation dictionary for English and Hindi
const I18N = {
  en: {
    tagline: "Health that follows the soldier.",
    crisisBar: "🚨 24x7 Armed Forces & Veteran Mental Health Helplines:",
    teleManas: "Tele-MANAS: 14416",
    sanjeevani: "Army Sanjeevani: 1800-120-0012",
    echsHelp: "ECHS: 1800-114-115",
    quickExit: "QUICK EXIT",
    synced: "LIVE SYNCED (AFMS Cloud)",
    offline: "OFFLINE MODE (Local Encrypted Cache)",
    roleSoldier: "🪖 Soldier: Arjun Verma",
    roleDoctor: "🩺 Doctor: Capt. Priya Nair",
    rolePhysio: "🏃 Physio: Lt. Rajesh Kumar",
    roleCounselor: "🧠 Counselor: Dr. Sunita Rao",
    roleClaims: "⚖️ Claims Officer: Col. V.K. Singh",
    roleCO: "🎖️ Commanding Officer: Col. Rathore",
    menuWallet: "Health Wallet",
    menuConsults: "Teleconsults",
    menuScreening: "Stress Screening",
    menuRehab: "Rehab Tracker",
    menuClaims: "Claim Tracker",
    menuAccess: "Access & Privacy",
    menuAudit: "Audit Log",
    statRecords: "Encrypted Records",
    statRehab: "Rehab Progress",
    statStress: "Stress Status",
    statNextAppt: "Next Appointment",
    postingsAll: "All Postings",
    postingsRajasthan: "Rajasthan (Desert)",
    postingsNE: "North East (Tawang)",
    postingsSiachen: "Siachen Base Camp",
    claimReadySummary: "Claim-Ready Summary",
    bookConsult: "Book Teleconsult",
    revokeBtn: "Revoke Access",
    privacyBadge: "Mental Health: Private & Encrypted (AES-256)",
    accessDeniedTitle: "ACCESS DENIED: RESTRICTED PRIVACY BARRIER",
    accessDeniedDesc: "Claims Officers & external adjudicators are legally prohibited from inspecting confidential mental health dossiers under Military Privacy Protocol & Kavach RBAC policy.",
    auditBlockedAttempt: "BLOCKED ATTEMPT RECORDED TO AUDIT LOG"
  },
  hi: {
    tagline: "स्वास्थ्य जो सैनिक के साथ चलता है।",
    crisisBar: "🚨 24x7 सेना और पूर्व सैनिक मानसिक स्वास्थ्य हेल्पलाइन:",
    teleManas: "टेली-मानस: 14416",
    sanjeevani: "सेना संजीवनी: 1800-120-0012",
    echsHelp: "ईसीएचएस: 1800-114-115",
    quickExit: "त्वरित निकास",
    synced: "लाइव सिंक (एएफएमएस क्लाउड)",
    offline: "ऑफ़लाइन मोड (स्थानीय एन्क्रिप्टेड)",
    roleSoldier: "🪖 सैनिक: अर्जुन वर्मा",
    roleDoctor: "🩺 डॉक्टर: कैप्टन प्रिया नायर",
    rolePhysio: "🏃 फिजियो: ले. राजेश कुमार",
    roleCounselor: "🧠 काउंसलर: डॉ. सुनीता राव",
    roleClaims: "⚖️ दावा अधिकारी: कर्नल वी.के. सिंह",
    roleCO: "🎖️ कमांडिंग ऑफिसर: कर्नल राठौर",
    menuWallet: "स्वास्थ्य वॉलेट",
    menuConsults: "टेली-परामर्श",
    menuScreening: "तनाव जांच",
    menuRehab: "पुनर्वास ट्रैकर",
    menuClaims: "दावा ट्रैकर",
    menuAccess: "अनुमति और गोपनीयता",
    menuAudit: "ऑडिट लॉग",
    statRecords: "एन्क्रिप्टेड रिकॉर्ड",
    statRehab: "पुनर्वास प्रगति",
    statStress: "तनाव स्थिति",
    statNextAppt: "अगली अपॉइंटमेंट",
    postingsAll: "सभी पोस्टिंग",
    postingsRajasthan: "राजस्थान (रेगिस्तान)",
    postingsNE: "उत्तर पूर्व (तवांग)",
    postingsSiachen: "सियाचिन बेस कैंप",
    claimReadySummary: "दावा सारांश (सत्यापित)",
    bookConsult: "परामर्श बुक करें",
    revokeBtn: "अनुमति रद्द करें",
    privacyBadge: "मानसिक स्वास्थ्य: पूर्णतः निजी और एन्क्रिप्टेड",
    accessDeniedTitle: "प्रवेश अस्वीकृत: प्रतिबंधित गोपनीयता अवरोध",
    accessDeniedDesc: "सैन्य गोपनीयता प्रोटोकॉल के तहत दावा अधिकारियों को गोपनीय मानसिक स्वास्थ्य रिकॉर्ड देखने की सख्त मनाही है।",
    auditBlockedAttempt: "अवरुद्ध प्रयास ऑडिट लॉग में दर्ज किया गया"
  }
};

// Global App State
const state = {
  lang: 'en',
  theme: 'light',
  isOffline: false,
  currentUser: {
    id: 'usr-soldier-1',
    role: 'SOLDIER',
    name: 'Rifleman Arjun Verma',
    service_no: '15489201A',
    rank: 'Rifleman',
    posting: 'Rajasthan (Desert Sector)'
  },
  activeTab: 'wallet',
  postingFilter: 'ALL',
  records: [],
  grants: [],
  screenings: [],
  rehabPlan: null,
  auditLog: [],
  consultations: [],
  activeCall: null,
  callTimerInterval: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadUserData();
  await refreshCurrentView();
});

// Setup DOM Event Listeners
function setupEventListeners() {
  // Role switcher dropdown
  const roleSelect = document.getElementById('role-switcher');
  if (roleSelect) {
    roleSelect.addEventListener('change', async (e) => {
      await switchUserRole(e.target.value);
    });
  }

  // Language toggle
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'hi' : 'en';
      langBtn.textContent = state.lang === 'en' ? 'हिन्दी' : 'English';
      applyTranslations();
      renderAllViews();
    });
  }

  // Dark mode toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', state.theme);
      themeBtn.innerHTML = state.theme === 'light' ? '🌙' : '☀️';
    });
  }

  // Offline / Synced toggle
  const syncBadge = document.getElementById('sync-status-badge');
  if (syncBadge) {
    syncBadge.addEventListener('click', () => {
      state.isOffline = !state.isOffline;
      updateSyncBadge();
    });
  }

  // Quick exit button & curtain
  const quickExitBtn = document.getElementById('quick-exit-btn');
  const curtain = document.getElementById('privacy-curtain');
  if (quickExitBtn && curtain) {
    quickExitBtn.addEventListener('click', () => {
      curtain.classList.add('active');
    });
    curtain.addEventListener('click', () => {
      curtain.classList.remove('active');
    });
  }

  // Left navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Demo walkthrough steps
  document.querySelectorAll('.demo-step-badge').forEach(badge => {
    badge.addEventListener('click', async () => {
      const step = badge.getAttribute('data-step');
      await executeDemoStep(step);
    });
  });
}

function updateSyncBadge() {
  const badge = document.getElementById('sync-status-badge');
  const t = I18N[state.lang];
  if (state.isOffline) {
    badge.className = 'sync-badge offline';
    badge.innerHTML = `<span>⚪</span> <span>${t.offline}</span>`;
  } else {
    badge.className = 'sync-badge synced';
    badge.innerHTML = `<span>🟢</span> <span>${t.synced}</span>`;
  }
}

function applyTranslations() {
  const t = I18N[state.lang];
  document.getElementById('brand-tagline').textContent = t.tagline;
  document.getElementById('crisis-bar-text').textContent = t.crisisBar;
  document.getElementById('quick-exit-btn').innerHTML = `🔒 ${t.quickExit}`;
  updateSyncBadge();
}

// Fetch user data via REST API
async function loadUserData() {
  try {
    const res = await fetch(`/api/users/me?role=${state.currentUser.role}`);
    if (res.ok) {
      state.currentUser = await res.json();
    }
  } catch (err) {
    console.warn('Using local fallback profile', err);
  }
}

// Switch User Role (Soldier, Doctor, Physio, Counselor, Claims Officer, Commanding Officer)
async function switchUserRole(role) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    state.currentUser = data.user;
  } catch (err) {
    // Local fallback switch
    state.currentUser.role = role;
    if (role === 'CLAIMS_OFFICER') {
      state.currentUser.name = 'Col. V.K. Singh (Retd)';
      state.currentUser.rank = 'Colonel';
    } else if (role === 'COUNSELOR') {
      state.currentUser.name = 'Dr. Sunita Rao';
      state.currentUser.rank = 'Senior Counselor';
    } else if (role === 'DOCTOR') {
      state.currentUser.name = 'Capt. Dr. Priya Nair';
      state.currentUser.rank = 'Captain';
    } else if (role === 'PHYSIOTHERAPIST') {
      state.currentUser.name = 'Lt. Rajesh Kumar';
      state.currentUser.rank = 'Lieutenant';
    } else if (role === 'COMMANDING_OFFICER') {
      state.currentUser.name = 'Col. R.S. Rathore';
      state.currentUser.rank = 'Colonel';
    } else {
      state.currentUser.name = 'Rifleman Arjun Verma';
      state.currentUser.rank = 'Rifleman';
    }
  }

  // Update header UI
  const roleSelect = document.getElementById('role-switcher');
  if (roleSelect) roleSelect.value = state.currentUser.role;
  updateUserHeader();

  // Highlight active demo step corresponding to role
  document.querySelectorAll('.demo-step-badge').forEach(b => b.classList.remove('active'));
  if (state.currentUser.role === 'SOLDIER') document.querySelector('[data-step="1"]')?.classList.add('active');
  if (state.currentUser.role === 'COUNSELOR') document.querySelector('[data-step="2"]')?.classList.add('active');
  if (state.currentUser.role === 'CLAIMS_OFFICER') document.querySelector('[data-step="3"]')?.classList.add('active');

  await refreshCurrentView();
}

function updateUserHeader() {
  document.getElementById('current-user-name').textContent = state.currentUser.name;
  document.getElementById('current-user-role-badge').textContent = `${state.currentUser.rank} • ${state.currentUser.role.replace('_', ' ')}`;
  document.getElementById('current-user-posting').textContent = state.currentUser.posting || 'Rajasthan (Desert Sector)';
}

// Demo Walkthrough Shortcut Buttons
async function executeDemoStep(step) {
  if (step === '1') {
    await switchUserRole('SOLDIER');
    switchTab('wallet');
  } else if (step === '2') {
    await switchUserRole('COUNSELOR');
    switchTab('screening');
  } else if (step === '3') {
    await switchUserRole('CLAIMS_OFFICER');
    switchTab('wallet');
  } else if (step === '4') {
    await switchUserRole('SOLDIER');
    switchTab('consults');
  }
}

// Switch Main Navigation Tab
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-tab') === tab);
  });
  renderAllViews();
}

// Fetch all resources and re-render
async function refreshCurrentView() {
  try {
    const [recRes, scrRes, rhbRes, grtRes, audRes, cnsRes] = await Promise.all([
      fetch(`/api/records?role=${state.currentUser.role}`),
      fetch(`/api/screenings?role=${state.currentUser.role}`),
      fetch(`/api/rehab?role=${state.currentUser.role}`),
      fetch(`/api/access-grants?role=${state.currentUser.role}`),
      fetch(`/api/audit-log?role=${state.currentUser.role}`),
      fetch(`/api/consultations?role=${state.currentUser.role}`)
    ]);

    if (recRes.ok) state.records = await recRes.json();
    if (scrRes.ok) state.screenings = await scrRes.json();
    if (rhbRes.ok) state.rehabPlan = await rhbRes.json();
    if (grtRes.ok) state.grants = await grtRes.json();
    if (audRes.ok) state.auditLog = await audRes.json();
    if (cnsRes.ok) state.consultations = await cnsRes.json();
  } catch (err) {
    console.error('Fetch error:', err);
  }

  renderAllViews();
}

// Render Top Stat Cards & Active View
function renderAllViews() {
  renderStatCards();
  const contentArea = document.getElementById('main-content-area');

  switch (state.activeTab) {
    case 'wallet':
      renderWalletView(contentArea);
      break;
    case 'consults':
      renderConsultsView(contentArea);
      break;
    case 'screening':
      renderScreeningView(contentArea);
      break;
    case 'rehab':
      renderRehabView(contentArea);
      break;
    case 'claims':
      renderClaimsView(contentArea);
      break;
    case 'access':
      renderAccessView(contentArea);
      break;
    case 'audit':
      renderAuditView(contentArea);
      break;
    case 'settings':
      renderSettingsView(contentArea);
      break;
    default:
      renderWalletView(contentArea);
  }
}

// Top 4 Stat Cards
function renderStatCards() {
  const t = I18N[state.lang];
  const statsContainer = document.getElementById('stats-grid');
  if (!statsContainer) return;

  const totalRecords = state.records.length;
  const rehabPct = state.rehabPlan ? Math.round((state.rehabPlan.completed_sessions / state.rehabPlan.total_sessions) * 100) : 70;
  const latestScreening = state.screenings[state.screenings.length - 1];
  const stressVal = latestScreening ? `${latestScreening.score}/27` : '13/27';
  const stressSeverity = latestScreening ? latestScreening.severity : 'Moderate (Rising)';

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">📁</div>
      <div class="stat-content">
        <div class="stat-label">${t.statRecords}</div>
        <div class="stat-val">${totalRecords}</div>
        <div class="stat-sub">Across 3 Postings • Tamper-Proof</div>
      </div>
    </div>

    <div class="stat-card gold">
      <div class="stat-icon">🏃</div>
      <div class="stat-content">
        <div class="stat-label">${t.statRehab}</div>
        <div class="stat-val">${rehabPct}%</div>
        <div class="stat-sub">Session ${state.rehabPlan ? state.rehabPlan.completed_sessions : 14}/20 • Knee Meniscus</div>
      </div>
    </div>

    <div class="stat-card alert">
      <div class="stat-icon">🧠</div>
      <div class="stat-content">
        <div class="stat-label">${t.statStress}</div>
        <div class="stat-val">${stressVal}</div>
        <div class="stat-sub">${stressSeverity}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon">📅</div>
      <div class="stat-content">
        <div class="stat-label">${t.statNextAppt}</div>
        <div class="stat-val" style="font-size: 1.15rem;">Dec 05, 2024</div>
        <div class="stat-sub">AFMS Tele-Ortho Follow-up</div>
      </div>
    </div>
  `;
}

// ============================================================================
// 1. HEALTH WALLET VIEW
// ============================================================================
function renderWalletView(container) {
  const t = I18N[state.lang];
  const role = state.currentUser.role;

  let filtered = state.records;
  if (state.postingFilter !== 'ALL') {
    filtered = filtered.filter(r => r.posting.toLowerCase().includes(state.postingFilter.toLowerCase()));
  }

  // Check if role is Claims Officer trying to inspect mental health
  const claimsOfficerBanner = role === 'CLAIMS_OFFICER' ? `
    <div style="background: #fef2f2; border: 1.5px solid #f87171; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong style="color: #991b1b; display: block; font-size: 0.95rem;">⚖️ Claims Adjudication Mode Active</strong>
        <span style="font-size: 0.82rem; color: #7f1d1d;">Showing verified battle casualties & service injuries for ECHS claim processing. Confidential mental health records are strictly locked.</span>
      </div>
      <button class="btn-primary" style="background: #dc2626;" onclick="attemptMentalHealthAccess()">
        🔒 Test Mental Health Access
      </button>
    </div>
  ` : '';

  container.innerHTML = `
    ${claimsOfficerBanner}

    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <span>💼</span>
          <span>Soldier Health Wallet — Tamper-Proof & Encrypted</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-outline" onclick="openClaimSummaryModal()">
            📋 ${t.claimReadySummary}
          </button>
          <button class="btn-primary" onclick="openAddRecordModal()">
            ✚ Add Field Record
          </button>
        </div>
      </div>

      <!-- Postings Filter Tabs -->
      <div class="posting-tabs">
        <button class="posting-tab-btn ${state.postingFilter === 'ALL' ? 'active' : ''}" onclick="filterPosting('ALL')">
          📍 ${t.postingsAll} (6)
        </button>
        <button class="posting-tab-btn ${state.postingFilter === 'Rajasthan' ? 'active' : ''}" onclick="filterPosting('Rajasthan')">
          🏜️ ${t.postingsRajasthan} (2023-Present)
        </button>
        <button class="posting-tab-btn ${state.postingFilter === 'North East' ? 'active' : ''}" onclick="filterPosting('North East')">
          🏔️ ${t.postingsNE} (2022-2023)
        </button>
        <button class="posting-tab-btn ${state.postingFilter === 'Siachen' ? 'active' : ''}" onclick="filterPosting('Siachen')">
          ❄️ ${t.postingsSiachen} (2021-2022)
        </button>
      </div>

      <!-- Records Grid -->
      <div class="records-grid" id="records-container">
        ${filtered.map(r => renderSingleRecordCard(r)).join('')}
      </div>
    </div>
  `;
}

function renderSingleRecordCard(r) {
  const badgeClass = `badge-${r.type.toLowerCase().replace('_', '')}`;
  const isMental = r.is_mental_health;

  return `
    <div class="record-card">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="record-type-badge ${badgeClass}">${r.type}</span>
          <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">${r.date}</span>
        </div>
        <h3 class="record-title">${r.title}</h3>
        <div class="record-meta">
          <span>📍 ${r.posting}</span>
          <span>👨‍⚕️ ${r.doctor_name}</span>
          <span>🏥 ${r.hospital}</span>
        </div>
        <div class="record-diagnosis">
          ${isMental ? '<em>Confidential Assessment: Clinical data protected with AES-256-GCM.</em>' : r.diagnosis}
        </div>
      </div>
      <div class="record-footer">
        <div class="tamper-proof-seal" title="SHA-256 HMAC: ${r.tamper_hash}">
          <span>🛡️</span>
          <span>SHA-256 Hash Verified</span>
        </div>
        ${isMental ? `
          <div class="encrypted-seal">
            <span>🔐</span>
            <span>AES-256 GCM</span>
          </div>
        ` : `
          <a href="#" style="color: var(--olive-700); font-weight: 700; text-decoration: none;" onclick="alert('Viewing digital copy: ${r.file_url || 'document.pdf'}')">
            📄 View File
          </a>
        `}
      </div>
    </div>
  `;
}

function filterPosting(p) {
  state.postingFilter = p;
  renderAllViews();
}

// Trigger strict RBAC ACCESS DENIED check
async function attemptMentalHealthAccess() {
  try {
    const res = await fetch(`/api/records?role=${state.currentUser.role}&type=MENTAL_HEALTH`);
    if (res.status === 403) {
      const data = await res.json();
      showAccessDeniedModal(data);
      // Immediately refresh audit log to show the new blocked entry
      const audRes = await fetch(`/api/audit-log?role=${state.currentUser.role}`);
      if (audRes.ok) state.auditLog = await audRes.json();
    } else {
      alert('Access allowed for this role');
    }
  } catch (err) {
    console.error(err);
  }
}

// ACCESS DENIED Modal Window for Claims Officer & CO
function showAccessDeniedModal(data) {
  const modal = document.createElement('div');
  modal.className = 'video-modal-overlay';
  modal.id = 'access-denied-modal';
  modal.innerHTML = `
    <div style="background: #180505; border: 2px solid #dc2626; border-radius: 14px; max-width: 600px; width: 90%; padding: 30px; text-align: center; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
      <div class="access-denied-icon">⛔</div>
      <h2 class="access-denied-title">ACCESS DENIED</h2>
      <div style="background: #450a0a; border: 1px solid #b91c1c; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 0.9rem; color: #fca5a5; line-height: 1.5;">
        <strong>MILITARY HEALTH PRIVACY BARRIER ENFORCED</strong><br>
        Claims Officers and external adjudicators are legally prohibited from inspecting confidential mental health dossiers under Military Regulations & Kavach RBAC policy.
      </div>
      <div class="access-denied-audit-note">
        🔒 EVENT LOGGED TO IMMUTABLE AUDIT TRAIL<br>
        User: ${state.currentUser.name} (${state.currentUser.role})<br>
        Target Soldier: Rifleman Arjun Verma (15489201A)<br>
        Action: ACCESS_DENIED_MENTAL_HEALTH [BLOCKED]
      </div>
      <div style="margin-top: 24px;">
        <button class="btn-primary" style="background: #dc2626;" onclick="document.getElementById('access-denied-modal').remove(); switchTab('audit');">
          View Security Audit Log
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================================================
// 2. STRESS SCREENING VIEW (PCL-5, PHQ-9, GAD-7) & TREND GRAPH
// ============================================================================
function renderScreeningView(container) {
  const role = state.currentUser.role;

  // If role is Claims Officer or CO, show Access Denied box
  if (role === 'CLAIMS_OFFICER' || role === 'COMMANDING_OFFICER') {
    container.innerHTML = `
      <div class="access-denied-box">
        <div class="access-denied-icon">🔒</div>
        <h2 class="access-denied-title">ACCESS DENIED: MENTAL HEALTH CONFIDENTIAL</h2>
        <p class="access-denied-msg">
          Under Armed Forces Mental Health Directives, psychological check-ins, PCL-5 combat stress evaluations, and counseling records are strictly confidential between the Soldier and certified AFMS Counselors.
        </p>
        <div class="access-denied-audit-note">
          Security Alert: Unauthorized access attempt intercepted and permanently logged in tamper-proof audit trail.
        </div>
        <div style="margin-top: 20px;">
          <button class="btn-outline" style="color: #fee2e2; border-color: #f87171;" onclick="switchTab('wallet')">
            ← Return to Verified Physical Injury Records
          </button>
        </div>
      </div>
    `;
    // Log the blocked attempt automatically
    fetch(`/api/records?role=${role}&type=MENTAL_HEALTH`).catch(() => {});
    return;
  }

  // Filter PHQ-9 records for the trend graph (6 weeks rising from 5 to 13)
  const phqRecords = state.screenings.filter(s => s.questionnaire_type === 'PHQ-9');
  const latestPhq = phqRecords[phqRecords.length - 1] || { score: 13, severity: 'Moderate Depression' };

  container.innerHTML = `
    <!-- Counselor Nudge Notification -->
    <div class="counselor-nudge-box">
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 2rem;">⚠️</span>
        <div class="nudge-text">
          <strong>Counselor Proactive Nudge Active</strong>
          PHQ-9 score has risen from 5 to 13 over the past 6 weeks following Rajasthan field deployment. AFMS Psychological Support Cell has been alerted for supportive outreach.
        </div>
      </div>
      <button class="btn-primary" style="background: #d97706; white-space: nowrap;" onclick="bookCounselorSession()">
        Connect with Counselor
      </button>
    </div>

    <!-- Stress Score Trend Graph Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <span>📈</span>
          <span>6-Week PHQ-9 Stress & Mood Trajectory</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          Clinical Threshold: Score &ge; 10 triggers Counselor Nudge
        </div>
      </div>

      <div class="trend-chart-container" id="trend-chart-box">
        <!-- Render custom interactive SVG graph -->
        ${renderTrendSVG(phqRecords)}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); padding-top: 8px;">
        <span>Week 1 (Oct 10): <strong>5/27</strong> (Mild)</span>
        <span>Week 3 (Oct 24): <strong>8/27</strong> (Mild)</span>
        <span>Week 4 (Oct 31): <strong>10/27</strong> (Moderate)</span>
        <span style="color: #dc2626; font-weight: 700;">Week 6 (Nov 14): <strong>13/27</strong> (Nudge Alert)</span>
      </div>
    </div>

    <!-- Interactive Screening Check-ins -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <span>📝</span>
          <span>Self-Administered Military Screenings (PCL-5, PHQ-9, GAD-7)</span>
        </div>
        <span style="font-size: 0.78rem; background: var(--olive-100); color: var(--olive-900); padding: 4px 10px; border-radius: 999px; font-weight: 600;">
          Confidential & AES-256 Encrypted
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-surface);">
          <h4 style="font-size: 1rem; margin-bottom: 6px;">PHQ-9 (Depression Inventory)</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">Standard 9-question depression check-in tracking interest, sleep, fatigue & mood over the last 14 days.</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: #dc2626;">Score: ${latestPhq.score}/27</span>
            <button class="btn-outline" onclick="openScreeningModal('PHQ-9')">Take PHQ-9</button>
          </div>
        </div>

        <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-surface);">
          <h4 style="font-size: 1rem; margin-bottom: 6px;">PCL-5 (PTSD Checklist)</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">20-item checklist for assessing post-traumatic symptoms following combat exposure or extreme events.</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: #d97706;">Score: 32/80</span>
            <button class="btn-outline" onclick="openScreeningModal('PCL-5')">Take PCL-5</button>
          </div>
        </div>

        <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-surface);">
          <h4 style="font-size: 1rem; margin-bottom: 6px;">GAD-7 (Anxiety Screening)</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">7-item generalized anxiety scale measuring hyper-arousal, worry, and nervous tension.</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: #16a34a;">Score: 9/21</span>
            <button class="btn-outline" onclick="openScreeningModal('GAD-7')">Take GAD-7</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate high quality SVG line chart for PHQ-9 rising scores
function renderTrendSVG(records) {
  const points = records.map((r, i) => {
    const x = 50 + i * 110;
    const y = 200 - (r.score / 27) * 160;
    return { x, y, score: r.score, date: r.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return `
    <svg width="100%" height="100%" viewBox="0 0 700 220" style="overflow: visible;">
      <!-- Grid Lines -->
      <line x1="40" y1="200" x2="660" y2="200" stroke="var(--border-subtle)" stroke-width="1.5" />
      <line x1="40" y1="140" x2="660" y2="140" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="4" />
      <line x1="40" y1="80" x2="660" y2="80" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="4" />

      <!-- Clinical Threshold Line (Score >= 10) -->
      <line x1="40" y1="${200 - (10 / 27) * 160}" x2="660" y2="${200 - (10 / 27) * 160}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6" />
      <text x="665" y="${200 - (10 / 27) * 160 + 4}" fill="#f59e0b" font-size="11" font-weight="700">Threshold 10 (Nudge)</text>

      <!-- Shaded Gradient Area Under Trend Line -->
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#22c55e" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <path d="${pathD} L ${points[points.length-1].x} 200 L ${points[0].x} 200 Z" fill="url(#scoreGrad)" />

      <!-- Trend Line -->
      <path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Data Points -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="6" fill="${p.score >= 10 ? '#dc2626' : '#35532f'}" stroke="#ffffff" stroke-width="2" />
        <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--text-primary)">
          ${p.score}
        </text>
      `).join('')}
    </svg>
  `;
}

function bookCounselorSession() {
  switchTab('consults');
  setTimeout(() => {
    const specialtyInput = document.getElementById('consult-specialty');
    if (specialtyInput) specialtyInput.value = 'Defence Psychological Support / Trauma Counseling';
  }, 100);
}

// ============================================================================
// 3. REHAB TRACKER VIEW
// ============================================================================
function renderRehabView(container) {
  const plan = state.rehabPlan || {
    title: 'Post-Arthroscopy Left Knee Mobility & Strengthening',
    completed_sessions: 14,
    total_sessions: 20,
    pain_level: 4,
    physio_alerted: true,
    exercises: [
      { id: 'ex-1', name: 'Straight Leg Raises (Quad setting)', reps: '3 sets x 15 reps', completed: true },
      { id: 'ex-2', name: 'Terminal Knee Extension with Theraband', reps: '3 sets x 12 reps', completed: true },
      { id: 'ex-3', name: 'Wall Squats with Swiss Ball (30 deg)', reps: '3 sets x 10 reps', completed: false },
      { id: 'ex-4', name: 'Hamstring Curls & Towel Heel Slides', reps: '2 sets x 15 reps', completed: false }
    ]
  };

  const pct = Math.round((plan.completed_sessions / plan.total_sessions) * 100);

  container.innerHTML = `
    <!-- Physio Alert for Missed Session -->
    ${plan.physio_alerted ? `
      <div style="background: #fff1f2; border: 1.5px solid #f43f5e; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.8rem;">⚠️</span>
          <div>
            <strong style="color: #9f1239; display: block; font-size: 0.92rem;">Physiotherapist Notification Triggered</strong>
            <span style="font-size: 0.8rem; color: #881337;">Session was missed yesterday. Alert sent to Lt. Rajesh Kumar (Rehab Officer, Military Hospital Jaipur).</span>
          </div>
        </div>
        <button class="btn-primary" style="background: #e11d48;" onclick="markRehabSessionComplete()">
          Log Makeup Session
        </button>
      </div>
    ` : ''}

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">🏃 ${plan.title}</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
            Supervising Physio: Lt. Rajesh Kumar • Protocol: Tawang Meniscus Repair
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 1.35rem; font-weight: 800; color: var(--olive-800);">${plan.completed_sessions} of ${plan.total_sessions}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Sessions Completed</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="rehab-progress-bar-wrap">
        <div class="rehab-progress-fill" style="width: ${pct}%;"></div>
      </div>

      <!-- Pain Level Slider (VAS 0 to 10) -->
      <div class="pain-slider-wrap">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="font-weight: 700; font-size: 0.9rem;">
            Today's Joint Pain Level (Visual Analog Scale - VAS):
            <span class="slider-val-badge" id="pain-level-disp">${plan.pain_level}/10</span>
          </label>
          <span style="font-size: 0.78rem; color: var(--text-muted);">0 = No Pain, 10 = Severe Pain</span>
        </div>
        <input type="range" min="0" max="10" value="${plan.pain_level}" id="pain-range-slider"
          style="width: 100%; accent-color: var(--olive-700); cursor: pointer;"
          oninput="document.getElementById('pain-level-disp').textContent = this.value + '/10'; updatePainLevel(this.value);"
        />
      </div>

      <!-- Daily Exercises Checklist -->
      <div class="exercise-checklist">
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px;">Daily Physical Therapy Exercises</h4>
        ${plan.exercises.map(ex => `
          <div class="exercise-item ${ex.completed ? 'done' : ''}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" id="${ex.id}" ${ex.completed ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" onchange="toggleExercise('${ex.id}', this.checked)" />
              <div>
                <label for="${ex.id}" style="font-weight: 600; font-size: 0.88rem; cursor: pointer; text-decoration: ${ex.completed ? 'line-through' : 'none'};">
                  ${ex.name}
                </label>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${ex.reps} • Target: Knee Stability</div>
              </div>
            </div>
            <button class="btn-outline" style="font-size: 0.72rem; padding: 4px 8px;" onclick="alert('Playing 3D military physio animation demo for ${ex.name}')">
              🎥 Video Demo
            </button>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 14px;">
        <button class="btn-primary" onclick="markRehabSessionComplete()">
          ✓ Mark Today's Session Complete (${plan.completed_sessions + 1}/${plan.total_sessions})
        </button>
      </div>
    </div>
  `;
}

async function toggleExercise(exId, isChecked) {
  if (!state.rehabPlan) return;
  const ex = state.rehabPlan.exercises.find(e => e.id === exId);
  if (ex) ex.completed = isChecked;

  try {
    await fetch('/api/rehab/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed_exercise_ids: state.rehabPlan.exercises.filter(e => e.completed).map(e => e.id)
      })
    });
  } catch (err) {
    console.error(err);
  }
}

async function updatePainLevel(val) {
  try {
    await fetch('/api/rehab/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pain_level: Number(val) })
    });
    if (state.rehabPlan) state.rehabPlan.pain_level = Number(val);
  } catch (err) {
    console.error(err);
  }
}

async function markRehabSessionComplete() {
  try {
    const res = await fetch('/api/rehab/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_completed: true, pain_level: state.rehabPlan.pain_level })
    });
    if (res.ok) {
      state.rehabPlan = await res.json();
      alert('✓ Rehabilitation session successfully recorded! Progress updated to ' + state.rehabPlan.completed_sessions + '/20.');
      renderAllViews();
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================================
// 4. TELECONSULTATION VIEW (BOOKING FLOW & AUTO-SAVE TO WALLET)
// ============================================================================
function renderConsultsView(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <span>🩺</span>
          <span>AFMS Teleconsultation Booking & Remote Care</span>
        </div>
        <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 999px; font-weight: 700;">
          End-to-End Encrypted Military Network
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Booking Form -->
        <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-surface);">
          <h4 style="font-size: 1rem; margin-bottom: 12px; font-weight: 700;">Book Specialist Consultation</h4>
          
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Medical Officer / Specialist:</label>
            <select id="consult-doctor" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
              <option value="usr-doctor-1">Capt. Dr. Priya Nair (Orthopedics - Base Hospital Delhi)</option>
              <option value="usr-physio-1">Lt. Rajesh Kumar (Physiotherapy - MH Jaipur)</option>
              <option value="usr-counselor-1">Dr. Sunita Rao (Psychological Support - Command Hospital)</option>
            </select>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Specialty / Clinical Track:</label>
            <input type="text" id="consult-specialty" value="Orthopedics & Joint Restoration" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Chief Complaints / Symptoms:</label>
            <textarea id="consult-notes" rows="3" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">Follow-up evaluation on left knee meniscus post-surgery recovery. Review rehab session 14 progress and exercise adaptation.</textarea>
          </div>

          <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="launchMockVideoCall()">
            📞 Launch Encrypted Teleconsultation (Mock Call)
          </button>
        </div>

        <!-- Consultation History & Wallet Integration Info -->
        <div>
          <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <strong style="font-size: 0.92rem; color: var(--olive-900); display: block; margin-bottom: 4px;">
              ⚡ Automatic Health Wallet Integration
            </strong>
            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
              As soon as a teleconsultation concludes, the attending Medical Officer's summary, e-prescription, and follow-up directives are <strong>cryptographically signed and auto-persisted directly into the Soldier's encrypted Health Wallet</strong>.
            </p>
          </div>

          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">Recent Teleconsultations</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${state.consultations.map(c => `
              <div style="border: 1px solid var(--border-color); background: var(--bg-surface); border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                  <span>${c.specialty}</span>
                  <span style="color: #15803d; font-size: 0.75rem; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${c.status}</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">Doctor: ${c.doctor_name || 'Capt. Dr. Priya Nair'} • ${c.date.split('T')[0]}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${c.summary}</div>
                <div style="font-size: 0.72rem; color: #15803d; margin-top: 6px; font-weight: 600;">
                  ✓ Persisted to Health Wallet as Record #${c.record_id}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Mock Video Call Screen
function launchMockVideoCall() {
  const specialty = document.getElementById('consult-specialty')?.value || 'Orthopedics';
  const notes = document.getElementById('consult-notes')?.value || '';

  const modal = document.createElement('div');
  modal.className = 'video-modal-overlay';
  modal.id = 'video-call-modal';
  modal.innerHTML = `
    <div class="video-call-window">
      <div class="call-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #10b981; font-size: 1.2rem;">●</span>
          <span><strong>AFMS SECURE TELE-HEALTH CHANNEL</strong> — ${specialty}</span>
        </div>
        <span id="call-timer" style="font-family: monospace; font-size: 1rem; color: #9ca3af;">00:05</span>
      </div>

      <div class="call-screen-area">
        <div class="doctor-call-avatar" style="background: url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150') center/cover;"></div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Capt. Dr. Priya Nair, AMC</h3>
        <span style="font-size: 0.85rem; color: #9ca3af;">Senior Orthopedic Specialist • Base Hospital Delhi Cantt</span>
        <div style="margin-top: 14px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; padding: 4px 14px; border-radius: 999px; font-size: 0.78rem; color: #6ee7b7;">
          🔒 AES-256 TLS 1.3 Encrypted Military Video Stream
        </div>
      </div>

      <div class="call-controls">
        <button class="call-btn" title="Toggle Mute">🎤</button>
        <button class="call-btn" title="Toggle Video">📹</button>
        <button class="call-btn end" title="End Call & Auto-Save" onclick="endCallAndSaveToWallet('${specialty}', '${encodeURIComponent(notes)}')">
          ☎ End Call & Save
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let seconds = 5;
  state.callTimerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    const timerElem = document.getElementById('call-timer');
    if (timerElem) timerElem.textContent = `${mins}:${secs}`;
  }, 1000);
}

async function endCallAndSaveToWallet(specialty, encodedNotes) {
  if (state.callTimerInterval) clearInterval(state.callTimerInterval);
  const modal = document.getElementById('video-call-modal');
  if (modal) modal.remove();

  try {
    const res = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialty,
        initial_notes: decodeURIComponent(encodedNotes)
      })
    });

    if (res.ok) {
      const data = await res.json();
      alert(`✓ Teleconsultation Completed!\n\nClinical Summary automatically saved to Soldier Health Wallet as tamper-proof record: "${data.record.title}".\nFollow-up set for 14 days.`);
      await refreshCurrentView();
      switchTab('wallet');
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================================
// 5. CLAIM TRACKER VIEW
// ============================================================================
function renderClaimsView(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <span>📋</span>
          <span>ECHS & MoD Disability Claim Tracker</span>
        </div>
        <button class="btn-primary" onclick="openClaimSummaryModal()">
          Export Claim-Ready Dossier
        </button>
      </div>

      <!-- Claim Progression Timeline -->
      <div style="margin-bottom: 24px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; position: relative; margin-bottom: 20px;">
          <div style="text-align: center; z-index: 2;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #15803d; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px auto; font-weight: bold;">✓</div>
            <strong style="font-size: 0.82rem;">1. Submission</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Verified Records</div>
          </div>
          <div style="text-align: center; z-index: 2;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #15803d; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px auto; font-weight: bold;">✓</div>
            <strong style="font-size: 0.82rem;">2. Medical Board</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Base Hospital Delhi</div>
          </div>
          <div style="text-align: center; z-index: 2;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #d97706; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px auto; font-weight: bold;">3</div>
            <strong style="font-size: 0.82rem; color: #d97706;">3. Scrutiny</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Under AG Branch Cell</div>
          </div>
          <div style="text-align: center; z-index: 2;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #9ca3af; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px auto; font-weight: bold;">4</div>
            <strong style="font-size: 0.82rem; color: #9ca3af;">4. Final Sanction</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Pension Payment Order</div>
          </div>
        </div>
      </div>

      <!-- Attached Tamper-Proof Service Proofs -->
      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">Authenticated Wallet Proofs Attached to Claim</h4>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface);">
          <div>
            <strong>1. Left Knee Meniscus Surgery Arthroscopy Summary</strong>
            <div style="font-size: 0.76rem; color: var(--text-muted);">Posting: North East (Tawang) • SHA-256 HMAC Verified • Battle Casualty Attributable</div>
          </div>
          <span style="color: #15803d; font-weight: 700; font-size: 0.8rem;">✓ Validated</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface);">
          <div>
            <strong>2. Desert Tactical Shrapnel Debridement Report</strong>
            <div style="font-size: 0.76rem; color: var(--text-muted);">Posting: Rajasthan • Signed by Maj. S. Chakravorty • Service Connected</div>
          </div>
          <span style="color: #15803d; font-weight: 700; font-size: 0.8rem;">✓ Validated</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 6. ACCESS & PRIVACY MANAGER (WITH REVOKE)
// ============================================================================
function renderAccessView(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">🔐 Soldier-Controlled Access & Consent Grants</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
            The Soldier owns their records. You can grant and instantly revoke medical access at any moment.
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${state.grants.map(g => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <strong style="font-size: 0.95rem;">${g.granted_to_role}</strong>
                <span class="audit-badge ${g.status}">${g.status}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">${g.purpose}</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Expires: ${g.expiry_date || '2027-12-31'}</div>
            </div>
            <div>
              ${g.status === 'ACTIVE' ? `
                <button class="btn-outline" style="color: #dc2626; border-color: #fca5a5;" onclick="revokeAccessGrant('${g.id}')">
                  🚫 Revoke Access
                </button>
              ` : `
                <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Revoked</span>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function revokeAccessGrant(grantId) {
  if (!confirm('Are you sure you want to revoke this clinical access grant? The provider will immediately be blocked.')) return;
  try {
    const res = await fetch('/api/access-grants/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_id: grantId })
    });
    if (res.ok) {
      alert('✓ Access grant revoked! Event recorded in audit log.');
      await refreshCurrentView();
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================================
// 7. AUDIT LOG VIEW (IMMUTABLE LOG WITH BLOCKED ATTEMPTS)
// ============================================================================
function renderAuditView(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">📜 Immutable Security & Access Audit Log</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
            Every single view, edit, grant, and blocked access attempt is cryptographically recorded.
          </div>
        </div>
        <button class="btn-outline" onclick="refreshCurrentView()">
          ↻ Refresh Log
        </button>
      </div>

      <div style="overflow-x: auto;">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>User Role</th>
              <th>Action</th>
              <th>Status</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            ${state.auditLog.map(entry => `
              <tr style="${entry.status === 'BLOCKED' ? 'background: #fef2f2;' : ''}">
                <td style="font-family: monospace; font-size: 0.76rem;">${entry.timestamp.replace('T', ' ').substring(0, 19)}</td>
                <td><strong>${entry.user_role}</strong></td>
                <td><code>${entry.action}</code></td>
                <td><span class="audit-badge ${entry.status}">${entry.status}</span></td>
                <td style="color: ${entry.status === 'BLOCKED' ? '#991b1b; font-weight: 700;' : 'var(--text-secondary)'};">
                  ${entry.details}
                </td>
                <td style="font-family: monospace; font-size: 0.74rem;">${entry.ip_address}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// 8. SETTINGS & EXTRAS (EMERGENCY QR, MOOD JOURNAL, MED REMINDERS)
// ============================================================================
function renderSettingsView(container) {
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
      <!-- Emergency QR Card -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 12px;">🪪 Emergency Field QR Card</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
          Allows immediate first-responders and field medics to scan critical life-saving stats offline without requiring network access.
        </p>
        <div style="background: var(--bg-surface); border: 2px dashed var(--olive-600); border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 4rem; margin-bottom: 10px;">📱</div>
          <div style="font-size: 1.1rem; font-weight: 800;">RIFLEMAN ARJUN VERMA</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">15489201A • 14 Rajputana Rifles</div>
          <div style="display: flex; justify-content: center; gap: 16px; margin: 14px 0; font-size: 0.85rem;">
            <span>🩸 Blood: <strong>O+</strong></span>
            <span>⚠️ Allergy: <strong>Penicillin</strong></span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Emergency ICE: Sunita Verma (Wife) +91-9876543211</div>
        </div>
      </div>

      <!-- Medication Reminders -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 12px;">💊 Daily Medication Reminders</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Tab Glucosamine-Chondroitin</strong>
              <div style="font-size: 0.76rem; color: var(--text-muted);">Once Daily with Breakfast (0800h)</div>
            </div>
            <span style="color: #15803d; font-weight: 700; font-size: 0.8rem;">✓ Taken</span>
          </div>
          <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Ice Cryotherapy Pack (Knee)</strong>
              <div style="font-size: 0.76rem; color: var(--text-muted);">15 mins Post-Exercise (1800h)</div>
            </div>
            <span style="color: #d97706; font-weight: 700; font-size: 0.8rem;">Due Today</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MODALS: ADD RECORD, CLAIM SUMMARY
// ============================================================================
function openAddRecordModal() {
  const modal = document.createElement('div');
  modal.className = 'video-modal-overlay';
  modal.id = 'add-record-modal';
  modal.innerHTML = `
    <div style="background: var(--bg-surface); border-radius: 12px; max-width: 500px; width: 90%; padding: 24px; color: var(--text-primary); border: 1px solid var(--border-color);">
      <h3 style="font-size: 1.15rem; margin-bottom: 16px; font-weight: 700;">✚ Add New Tamper-Proof Record</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Record Type:</label>
        <select id="new-rec-type" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <option value="INJURY">Battle Injury</option>
          <option value="SURGERY">Surgery</option>
          <option value="X_RAY">X-Ray / Imaging</option>
          <option value="PRESCRIPTION">Prescription</option>
          <option value="VACCINATION">Vaccination</option>
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Title:</label>
        <input type="text" id="new-rec-title" placeholder="e.g. Right Deltoid Dressing & Inspection" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Posting Location:</label>
        <input type="text" id="new-rec-posting" value="Rajasthan (Desert Sector)" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px;">Clinical Findings / Diagnosis:</label>
        <textarea id="new-rec-diag" rows="3" placeholder="Clinical notes..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);"></textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('add-record-modal').remove()">Cancel</button>
        <button class="btn-primary" onclick="submitNewRecord()">Save & Generate SHA-256 Hash</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitNewRecord() {
  const type = document.getElementById('new-rec-type').value;
  const title = document.getElementById('new-rec-title').value;
  const posting = document.getElementById('new-rec-posting').value;
  const diagnosis = document.getElementById('new-rec-diag').value;

  if (!title) {
    alert('Please enter a title');
    return;
  }

  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, posting, diagnosis, is_mental_health: false })
    });
    if (res.ok) {
      document.getElementById('add-record-modal').remove();
      alert('✓ Record cryptographically signed and added to wallet!');
      await refreshCurrentView();
    }
  } catch (err) {
    console.error(err);
  }
}

function openClaimSummaryModal() {
  const modal = document.createElement('div');
  modal.className = 'video-modal-overlay';
  modal.id = 'claim-summary-modal';
  modal.innerHTML = `
    <div style="background: var(--bg-surface); border-radius: 12px; max-width: 650px; width: 90%; padding: 26px; color: var(--text-primary); border: 2px solid var(--khaki-500); max-height: 85vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--khaki-500); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 800;">ARMED FORCES MEDICAL SERVICES (AFMS)</h2>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Verified Health & Disability Claim Dossier</div>
        </div>
        <span style="background: #dcfce7; color: #166534; font-weight: 700; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;">
          ECHS VALIDATED
        </span>
      </div>

      <div style="background: var(--bg-subtle); padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 0.85rem; line-height: 1.5;">
        <strong>Soldier:</strong> Rifleman Arjun Verma • <strong>Service No:</strong> 15489201A<br>
        <strong>Unit:</strong> 14 Rajputana Rifles • <strong>Branch:</strong> Indian Army<br>
        <strong>Claim Integrity:</strong> 100% Cryptographic Verification (SHA-256 HMAC)
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Service Posting History & Medical Incidents</h4>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
          <strong>1. Siachen Base Camp (2021-2022)</strong>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">High Altitude Prophylaxis & Adaptation Pack Completed. No permanent cold disability.</div>
        </div>
        <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
          <strong>2. North East / Tawang Sector (2022-2023)</strong>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Left Knee Meniscus Repair Surgery (151 Base Hospital Guwahati) — Grade III Meniscus Tear sustained on patrol. 14/20 rehab sessions.</div>
        </div>
        <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
          <strong>3. Rajasthan / Desert Sector (2023-Present)</strong>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Battle Shrapnel Wound Right Shoulder (MH Jodhpur). Clean debridement.</div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('claim-summary-modal').remove()">Close</button>
        <button class="btn-primary" onclick="alert('Exporting cryptographically signed PDF claim package for ECHS Central Adjudication Portal...')">
          📥 Download Signed PDF Dossier
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================================================
// INTERACTIVE STRESS SCREENING MODAL (PHQ-9, PCL-5, GAD-7)
// ============================================================================
function openScreeningModal(type) {
  const modal = document.createElement('div');
  modal.className = 'video-modal-overlay';
  modal.id = 'screening-modal';

  let questions = [];
  let maxScore = 27;

  if (type === 'PHQ-9') {
    maxScore = 27;
    questions = [
      "1. Little interest or pleasure in doing things",
      "2. Feeling down, depressed, or hopeless",
      "3. Trouble falling or staying asleep, or sleeping too much",
      "4. Feeling tired or having little energy",
      "5. Poor appetite or overeating",
      "6. Feeling bad about yourself — or that you are a failure",
      "7. Trouble concentrating on tasks (e.g. reading, field orders)",
      "8. Moving or speaking slowly, or being fidgety / restless",
      "9. Thoughts that you would be better off dead or of hurting yourself"
    ];
  } else if (type === 'PCL-5') {
    maxScore = 80;
    questions = [
      "1. Repeated, disturbing, and unwanted memories of the stressful experience",
      "2. Repeated, disturbing dreams of the stressful event",
      "3. Suddenly feeling or acting as if the stressful event were happening again",
      "4. Feeling very upset when something reminds you of the stressful event",
      "5. Having strong physical reactions (e.g. heart pounding, trouble breathing) when reminded",
      "6. Avoiding memories, thoughts, or feelings related to the stressful event",
      "7. Avoiding external reminders (people, places, conversations, objects, situations)",
      "8. Trouble remembering important parts of the stressful experience"
    ];
  } else {
    maxScore = 21;
    questions = [
      "1. Feeling nervous, anxious, or on edge",
      "2. Not being able to stop or control worrying",
      "3. Worrying too much about different things",
      "4. Trouble relaxing",
      "5. Being so restless that it is hard to sit still",
      "6. Becoming easily annoyed or irritable",
      "7. Feeling afraid, as if something awful might happen"
    ];
  }

  modal.innerHTML = `
    <div style="background: var(--bg-surface); border-radius: 12px; max-width: 620px; width: 92%; padding: 24px; color: var(--text-primary); border: 1px solid var(--border-color); max-height: 85vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="font-size: 1.15rem; font-weight: 700;">📝 Military Check-in: ${type}</h3>
        <span style="font-size: 0.75rem; background: var(--olive-100); color: var(--olive-900); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
          Confidential
        </span>
      </div>

      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
        Over the last 2 weeks, how often have you been bothered by any of the following problems?
        (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day)
      </p>

      <form id="screening-form">
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          ${questions.map((q, idx) => `
            <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
              <div style="font-size: 0.84rem; font-weight: 600; margin-bottom: 6px;">${q}</div>
              <div style="display: flex; gap: 14px; font-size: 0.78rem;">
                <label style="cursor: pointer;"><input type="radio" name="q_${idx}" value="0" checked /> 0</label>
                <label style="cursor: pointer;"><input type="radio" name="q_${idx}" value="1" /> 1</label>
                <label style="cursor: pointer;"><input type="radio" name="q_${idx}" value="2" /> 2</label>
                <label style="cursor: pointer;"><input type="radio" name="q_${idx}" value="3" /> 3</label>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-outline" onclick="document.getElementById('screening-modal').remove()">Cancel</button>
          <button type="button" class="btn-primary" onclick="submitScreeningForm('${type}', ${questions.length}, ${maxScore})">
            Submit Confidential Screening
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitScreeningForm(type, count, maxScore) {
  let score = 0;
  for (let i = 0; i < count; i++) {
    const val = document.querySelector(`input[name="q_${i}"]:checked`)?.value;
    score += Number(val || 0);
  }

  try {
    const res = await fetch('/api/screenings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionnaire_type: type,
        score,
        max_score: maxScore
      })
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById('screening-modal').remove();
      alert(`✓ ${type} Check-in Complete!\n\nScore: ${score}/${maxScore} (${data.severity})\nCounselor Outreach: ${data.counselor_nudge_triggered ? 'ACTIVATED' : 'Within baseline'}`);
      await refreshCurrentView();
      switchTab('screening');
    }
  } catch (err) {
    console.error(err);
  }
}


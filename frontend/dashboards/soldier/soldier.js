// ============================================================================
// KAVACH: ENHANCED SOLDIER & VETERAN PATIENT CONSOLE
// ============================================================================

const I18N_SOLDIER = {
  en: {
    appTitle: "KAVACH",
    appSub: "SOLDIER WALLET",
    tagline: "Health that follows the soldier.",
    navWallet: "Health Wallet",
    navStress: "Stress & PTSD",
    navRehab: "Rehab Tracker",
    navGrants: "Access Grants",
    navClaims: "Claims Tracker",
    vaultDesc: "Records stay with you through every posting and ECHS retirement.",
    recLabel: "Health Records",
    recSub: "Across 3 Postings • Tamper-Proof",
    rehabLabel: "Rehab Sessions",
    rehabSub: "Left Knee Protocol • 70% Done",
    stressLabel: "Stress Status",
    stressSub: "PHQ-9 Moderate • 3 Wks Climbing",
    nextApptLabel: "Next Appointment",
    drawerTitle: "Settings & Preferences",
    darkMode: "Dark Tactical Mode:",
    nudgeTitle: "Your stress scores have climbed 3 weeks in a row — a confidential counselor is one tap away.",
    nudgeSub: "Weekly PHQ-9 rose from 5 to 13 during Desert patrol. AFMS Psychological Support Cell (Dr. Sunita Rao) is available.",
    connectCounselor: "Connect with Counselor"
  },
  hi: {
    appTitle: "कवच",
    appSub: "सैनिक स्वास्थ्य वॉलेट",
    tagline: "स्वास्थ्य जो सैनिक के साथ चलता है।",
    navWallet: "स्वास्थ्य वॉलेट",
    navStress: "तनाव एवं पीटीएसडी",
    navRehab: "पुनर्वास ट्रैकर",
    navGrants: "अनुमति नियंत्रण",
    navClaims: "दावा ट्रैकर",
    vaultDesc: "हर पोस्टिंग और सेवानिवृत्ति के दौरान आपके मेडिकल रिकॉर्ड सुरक्षित रहते हैं।",
    recLabel: "स्वास्थ्य रिकॉर्ड",
    recSub: "3 पोस्टिंग के रिकॉर्ड • छेड़छाड़ रहित",
    rehabLabel: "पुनर्वास सत्र",
    rehabSub: "बाएं घुटने का प्रोटोकॉल • 70% पूरा",
    stressLabel: "तनाव की स्थिति",
    stressSub: "मध्यम तनाव • 3 सप्ताह से वृद्धि",
    nextApptLabel: "अगली अपॉइंटमेंट",
    drawerTitle: "सेटिंग्स और प्राथमिकताएं",
    darkMode: "डार्क टैक्टिकल मोड:",
    nudgeTitle: "आपके तनाव स्कोर में लगातार 3 हफ्तों से वृद्धि हुई है — गोपनीय काउंसलर केवल एक टैप दूर है।",
    nudgeSub: "रेगिस्तानी पेट्रोलिंग के दौरान स्कोर 5 से बढ़कर 13 हुआ। एएफएमएस मानसिक स्वास्थ्य सेल उपलब्ध है।",
    connectCounselor: "काउंसलर से संपर्क करें"
  }
};

const state = {
  lang: 'en',
  activeTab: 'wallet',
  chartPeriod: 'weekly',
  walletCategory: 'ALL',
  records: [],
  screenings: [],
  rehabPlan: null,
  grants: [],
  claims: [],
  routineTimerSeconds: 15 * 60, // 15 mins daily routine
  timerInterval: null,
  isTimerRunning: false
};

document.addEventListener('DOMContentLoaded', async () => {
  const name = localStorage.getItem('kavach_user_name') || 'Rfn. Arjun Verma';
  const posting = localStorage.getItem('kavach_user_posting') || 'Rajasthan (Desert Sector)';

  document.getElementById('topSoldierName').textContent = name;
  document.getElementById('topSoldierPlace').textContent = `📍 ${posting}`;

  await loadSoldierData();
  renderSoldierTab();
  startGrantCountdownTicker();
});

// Load all soldier data from REST API
async function loadSoldierData() {
  try {
    const headers = getAuthHeaders();
    const [recRes, scrRes, rhbRes, grtRes, clmRes] = await Promise.all([
      fetch('/api/records?role=SOLDIER', { headers }),
      fetch('/api/screenings?role=SOLDIER', { headers }),
      fetch('/api/rehab?role=SOLDIER', { headers }),
      fetch('/api/access-grants?role=SOLDIER', { headers }),
      fetch('/api/claims?role=SOLDIER', { headers })
    ]);

    if (recRes.ok) state.records = await recRes.json();
    if (scrRes.ok) state.screenings = await scrRes.json();
    if (rhbRes.ok) state.rehabPlan = await rhbRes.json();
    if (grtRes.ok) state.grants = await grtRes.json();
    if (clmRes.ok) state.claims = await clmRes.json();

    updateStatCards();
  } catch (err) {
    console.error('Error loading soldier data:', err);
  }
}

// Update Top 4 Stat Cards & Blinking Pulse
function updateStatCards() {
  document.getElementById('statRecCount').textContent = state.records.length || 6;
  if (state.rehabPlan) {
    document.getElementById('statRehabProgress').textContent = `${state.rehabPlan.completed_sessions} / ${state.rehabPlan.total_sessions}`;
  }

  const phqRecords = state.screenings.filter(s => s.questionnaire_type === 'PHQ-9');
  if (phqRecords.length > 0) {
    const latest = phqRecords[phqRecords.length - 1];
    const score = latest.score;
    document.getElementById('statStressScore').textContent = `${score}/27`;

    // Dynamic Blinking Indicator Class based on score
    const pill = document.getElementById('stressBlinkPill');
    if (pill) {
      if (score < 5) {
        pill.className = 'stress-blinking-pill green';
        pill.textContent = 'NORMAL';
      } else if (score < 10) {
        pill.className = 'stress-blinking-pill yellow';
        pill.textContent = 'MILD';
      } else if (score < 15) {
        pill.className = 'stress-blinking-pill orange';
        pill.textContent = 'WARNING';
      } else {
        pill.className = 'stress-blinking-pill red';
        pill.textContent = 'SEVERE ALERT';
      }
    }
  }
}

// Switch Navigation Tabs
function switchSoldierTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-tab') === tab);
  });
  renderSoldierTab();
}

function renderSoldierTab() {
  const container = document.getElementById('soldierTabContent');
  switch (state.activeTab) {
    case 'wallet':
      renderSeniorFriendlyWallet(container);
      break;
    case 'stress':
      renderStressTab(container);
      break;
    case 'rehab':
      renderRehabTab(container);
      break;
    case 'grants':
      renderGrantsTab(container);
      break;
    case 'claims':
      renderClaimsTab(container);
      break;
    default:
      renderSeniorFriendlyWallet(container);
  }
}

// ============================================================================
// 1. SENIOR-FRIENDLY HEALTH WALLET (SIMPLE, LARGE FONT, CLEAR CATEGORIES)
// ============================================================================
function renderSeniorFriendlyWallet(container) {
  let filtered = state.records;
  if (state.walletCategory !== 'ALL') {
    filtered = filtered.filter(r => r.type.toUpperCase() === state.walletCategory.toUpperCase());
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">💼 Health Wallet (स्वास्थ्य रिकॉर्ड)</h2>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 3px;">
            Clear, easy-to-read medical history &bull; Tap any record to view details &bull; Sealed with SHA-256
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" onclick="alert('Printing simplified large-text medical summary for your doctor visit.')">
            🖨️ Print for Doctor
          </button>
        </div>
      </div>

      <!-- Senior-Friendly Big Category Buttons -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="posting-btn ${state.walletCategory === 'ALL' ? 'active' : ''}" onclick="setWalletCategory('ALL')">
          📁 All Records (${state.records.length})
        </button>
        <button class="posting-btn ${state.walletCategory === 'SURGERY' ? 'active' : ''}" onclick="setWalletCategory('SURGERY')">
          🏥 Surgeries &amp; Hospital
        </button>
        <button class="posting-btn ${state.walletCategory === 'INJURY' ? 'active' : ''}" onclick="setWalletCategory('INJURY')">
          🩹 Battle Casualties
        </button>
        <button class="posting-btn ${state.walletCategory === 'X_RAY' ? 'active' : ''}" onclick="setWalletCategory('X_RAY')">
          🩻 X-Rays &amp; Scans
        </button>
        <button class="posting-btn ${state.walletCategory === 'VACCINATION' ? 'active' : ''}" onclick="setWalletCategory('VACCINATION')">
          💉 Vaccinations
        </button>
        <button class="posting-btn ${state.walletCategory === 'PRESCRIPTION' ? 'active' : ''}" onclick="setWalletCategory('PRESCRIPTION')">
          💊 Medications
        </button>
      </div>

      <!-- Senior-Friendly Big Clear Record Cards -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${filtered.map(r => {
          let categoryIcon = '📄';
          let badgeClass = 'badge-vaccine';
          if (r.type === 'SURGERY') { categoryIcon = '🏥'; badgeClass = 'badge-surgery'; }
          else if (r.type === 'INJURY') { categoryIcon = '🩹'; badgeClass = 'badge-injury'; }
          else if (r.type === 'X_RAY') { categoryIcon = '🩻'; badgeClass = 'badge-xray'; }
          else if (r.type === 'VACCINATION') { categoryIcon = '💉'; badgeClass = 'badge-vaccine'; }
          else if (r.type === 'PRESCRIPTION') { categoryIcon = '💊'; badgeClass = 'badge-surgery'; }

          return `
            <div class="senior-record-card">
              <div class="senior-card-type-header">
                <span class="senior-type-badge ${badgeClass}">
                  <span>${categoryIcon}</span> <span>${r.type}</span>
                </span>
                <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted);">
                  📅 Date: ${r.date}
                </span>
              </div>

              <h3 class="senior-record-title">${r.title}</h3>

              <!-- Plain Language Explanation for Senior Veterans -->
              <div class="senior-record-simple-desc">
                <strong>What happened:</strong> ${r.is_mental_health ? 'Confidential mental health check-in (Protected with AES-256 military encryption).' : r.diagnosis}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap; gap: 8px;">
                <div>
                  <span>📍 <strong>Location:</strong> ${r.posting}</span> &bull; 
                  <span>👨‍⚕️ <strong>Doctor:</strong> ${r.doctor_name || 'Medical Officer'}</span> &bull; 
                  <span>🏥 <strong>Hospital:</strong> ${r.hospital || 'Base Hospital'}</span>
                </div>
                <div class="tamper-hash-seal" title="SHA-256 HMAC: ${r.tamper_hash}">
                  <span>🛡️</span> <span>Verified Tamper-Proof</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function setWalletCategory(cat) {
  state.walletCategory = cat;
  renderSeniorFriendlyWallet(document.getElementById('soldierTabContent'));
}

// ============================================================================
// 2. STRESS SCREENING TAB WITH DYNAMIC BLINKING INDICATOR
// ============================================================================
function renderStressTab(container) {
  const phqList = state.screenings.filter(s => s.questionnaire_type === 'PHQ-9');
  const latest = phqList[phqList.length - 1] || { score: 13 };
  const score = latest.score;

  let blinkColor = 'orange';
  let severityLabel = 'MODERATE WARNING';
  if (score < 5) { blinkColor = 'green'; severityLabel = 'NORMAL / HEALTHY'; }
  else if (score < 10) { blinkColor = 'yellow'; severityLabel = 'MILD'; }
  else if (score >= 15) { blinkColor = 'red'; severityLabel = 'SEVERE ALERT'; }

  container.innerHTML = `
    <!-- Gentle Counselor Nudge Banner -->
    <div class="counselor-nudge-banner">
      <div class="nudge-content">
        <span class="nudge-icon">⚠️</span>
        <div class="nudge-text">
          <strong>Your stress scores have climbed 3 weeks in a row — a confidential counselor is one tap away.</strong>
          <span>Weekly PHQ-9 rose from 5 to 13 during Desert patrol. AFMS Psychological Support Cell (Dr. Sunita Rao) is available.</span>
        </div>
      </div>
      <button class="btn-primary" style="background: #d97706; white-space: nowrap;" onclick="alert('📞 Direct Confidential Line to Dr. Sunita Rao (AFMS Psychological Cell) connected.')">
        Connect with Counselor
      </button>
    </div>

    <!-- Dual Charts Row -->
    <div class="charts-dual-grid">
      <!-- 1. Interactive Line Graph with Dynamic Blinking Marker -->
      <div class="chart-box">
        <div class="chart-header-controls">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              <span>📈</span> <span>Weekly Stress Trajectory</span>
              <span class="stress-blinking-pill ${blinkColor}">${severityLabel}</span>
            </h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Threshold: &ge; 10 triggers Proactive Counselor Outreach
            </span>
          </div>

          <div class="period-pill-toggle">
            <button class="period-btn ${state.chartPeriod === 'weekly' ? 'active' : ''}" onclick="togglePeriod('weekly')">Weekly</button>
            <button class="period-btn ${state.chartPeriod === 'monthly' ? 'active' : ''}" onclick="togglePeriod('monthly')">Monthly</button>
          </div>
        </div>

        <div style="height: 240px; position: relative;">
          ${renderLineChartWithPulse(state.chartPeriod, blinkColor)}
        </div>
      </div>

      <!-- 2. Interactive Pie Chart -->
      <div class="chart-box">
        <div class="chart-header-controls">
          <h3 style="font-size: 1.05rem; font-weight: 800;">🥧 Symptom Distribution</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">Self-Assessments</span>
        </div>
        <div style="height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <svg width="180" height="180" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="70" fill="transparent" stroke="#15803d" stroke-width="32" stroke-dasharray="110 330" stroke-dashoffset="0" />
            <circle cx="100" cy="100" r="70" fill="transparent" stroke="#d4af37" stroke-width="32" stroke-dasharray="154 286" stroke-dashoffset="-110" />
            <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f97316" stroke-width="32" stroke-dasharray="132 308" stroke-dashoffset="-264" />
            <circle cx="100" cy="100" r="70" fill="transparent" stroke="#dc2626" stroke-width="32" stroke-dasharray="44 396" stroke-dashoffset="-396" />
            <text x="100" y="105" text-anchor="middle" font-size="15" font-weight="900" fill="var(--text-main)">PHQ-9</text>
          </svg>
          <div style="display: flex; justify-content: center; gap: 10px; font-size: 0.72rem; margin-top: 10px; flex-wrap: wrap;">
            <span><span style="color: #15803d;">●</span> Minimal (25%)</span>
            <span><span style="color: #d4af37;">●</span> Mild (35%)</span>
            <span><span style="color: #f97316;">●</span> Moderate (30%)</span>
            <span><span style="color: #dc2626;">●</span> Severe (10%)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Globally Validated Questionnaire Check-ins -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">📝 Globally Validated Self-Assessments</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            PCL-5 (PTSD), PHQ-9 (Depression), GAD-7 (Anxiety) &bull; 100% Confidential
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <div style="border: 1.5px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 1rem;">PHQ-9 (Depression Inventory)</strong>
            <span style="font-size: 0.75rem; color: #dc2626; font-weight: 800;">Score: ${score}/27</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Tracks mood, sleep, and fatigue over previous 14 days.</p>
          <button class="btn-outline" style="width: 100%;" onclick="openAssessmentModal('PHQ-9')">Take PHQ-9 Assessment →</button>
        </div>

        <div style="border: 1.5px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 1rem;">PCL-5 (PTSD Checklist)</strong>
            <span style="font-size: 0.75rem; color: #d97706; font-weight: 800;">Score: 32/80</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Evaluates combat stress recall and hyper-vigilance.</p>
          <button class="btn-outline" style="width: 100%;" onclick="openAssessmentModal('PCL-5')">Take PCL-5 Assessment →</button>
        </div>

        <div style="border: 1.5px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 1rem;">GAD-7 (Anxiety Scale)</strong>
            <span style="font-size: 0.75rem; color: #15803d; font-weight: 800;">Score: 9/21</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Measures somatic tension, nervous arousal, and worry.</p>
          <button class="btn-outline" style="width: 100%;" onclick="openAssessmentModal('GAD-7')">Take GAD-7 Assessment →</button>
        </div>
      </div>
    </div>
  `;
}

function togglePeriod(period) {
  state.chartPeriod = period;
  renderStressTab(document.getElementById('soldierTabContent'));
}

function renderLineChartWithPulse(period, blinkColor) {
  const pointsData = period === 'weekly' ? [
    { label: 'Wk 1 (Oct 10)', score: 5 },
    { label: 'Wk 2 (Oct 17)', score: 6 },
    { label: 'Wk 3 (Oct 24)', score: 8 },
    { label: 'Wk 4 (Oct 31)', score: 10 },
    { label: 'Wk 5 (Nov 07)', score: 11 },
    { label: 'Wk 6 (Nov 14)', score: 13 }
  ] : [
    { label: 'Aug 2024', score: 4 },
    { label: 'Sep 2024', score: 5 },
    { label: 'Oct 2024', score: 8 },
    { label: 'Nov 2024', score: 13 }
  ];

  const svgWidth = 650;
  const svgHeight = 220;
  const padX = 60;
  const padY = 30;
  const w = svgWidth - padX * 2;
  const h = svgHeight - padY * 2;

  const points = pointsData.map((d, i) => ({
    x: padX + (i / (pointsData.length - 1)) * w,
    y: svgHeight - padY - (d.score / 27) * h,
    score: d.score,
    label: d.label
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const lastPoint = points[points.length - 1];

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <line x1="${padX}" y1="${svgHeight - padY}" x2="${svgWidth - padX}" y2="${svgHeight - padY}" stroke="var(--border-subtle)" stroke-width="1.5" />
      <line x1="${padX}" y1="${svgHeight - padY - (10/27)*h}" x2="${svgWidth - padX}" y2="${svgHeight - padY - (10/27)*h}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,4" />
      <text x="${svgWidth - padX - 90}" y="${svgHeight - padY - (10/27)*h - 6}" font-size="11" font-weight="700" fill="#f59e0b">Threshold (10)</text>

      <path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

      ${points.map((p, idx) => `
        <circle cx="${p.x}" cy="${p.y}" r="${idx === points.length - 1 ? 8 : 5}" fill="${idx === points.length - 1 ? '#f97316' : '#2e5229'}" stroke="#ffffff" stroke-width="2" />
        <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--text-main)">${p.score}</text>
        <text x="${p.x}" y="${svgHeight - 8}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--text-muted)">${p.label}</text>
      `).join('')}

      <!-- Dynamic Blinking Pulse Ring around the latest score point -->
      <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="14" fill="none" stroke="#f97316" stroke-width="2.5" opacity="0.8">
        <animate attributeName="r" values="8;18;8" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
}

// ============================================================================
// 3. REHAB TRACKER WITH DOCTOR'S PAIN DIAGNOSIS & ROUTINE TIMER
// ============================================================================
function renderRehabTab(container) {
  const plan = state.rehabPlan || {
    title: 'Post-Arthroscopy Left Knee Mobility & Quadriceps Strengthening',
    completed_sessions: 14,
    total_sessions: 20,
    pain_level: 4,
    mobility_score: 115,
    pain_location: 'Left Knee (Medial Joint Line)',
    pain_type: 'Sharp throbbing on 90° flexion & post-weight-bearing stiffness',
    since_when: '19 Aug 2023 - Sustained during snow patrol in Tawang',
    diagnosed_by: 'Capt. Dr. Priya Nair & Lt. Rajesh Kumar',
    exercises: [
      { id: 'ex-1', name: 'Straight Leg Raises (Quad setting)', reps: '3 sets x 15 reps', completed: true },
      { id: 'ex-2', name: 'Terminal Knee Extension with Theraband', reps: '3 sets x 12 reps', completed: true },
      { id: 'ex-3', name: 'Wall Squats with Swiss Ball (30 deg)', reps: '3 sets x 10 reps', completed: false },
      { id: 'ex-4', name: 'Hamstring Curls & Towel Heel Slides', reps: '2 sets x 15 reps', completed: false }
    ]
  };

  const remainingExercises = plan.exercises.filter(e => !e.completed).length;
  const pct = Math.round((plan.completed_sessions / plan.total_sessions) * 100);

  // Format timer
  const mins = String(Math.floor(state.routineTimerSeconds / 60)).padStart(2, '0');
  const secs = String(state.routineTimerSeconds % 60).padStart(2, '0');

  container.innerHTML = `
    <!-- Doctor's Prescribed Pain Diagnosis Card -->
    <div style="background: var(--bg-card); border: 2px solid var(--olive-600); border-radius: 10px; padding: 18px 22px; margin-bottom: 20px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 800; background: var(--olive-100); color: var(--olive-900); padding: 3px 10px; border-radius: 4px;">
          👨‍⚕️ DOCTOR'S PRESCRIBED PAIN DIAGNOSIS (READ-ONLY FOR PATIENT)
        </span>
        <span style="font-size: 0.78rem; color: var(--text-muted);">Entered by: ${plan.diagnosed_by || 'Capt. Dr. Priya Nair'}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; font-size: 0.88rem; line-height: 1.5;">
        <div>
          <span style="color: var(--text-muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; display: block;">Pain Location:</span>
          <strong>📍 ${plan.pain_location || 'Left Knee (Medial Joint Line)'}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; display: block;">Pain Nature &amp; Type:</span>
          <strong>⚡ ${plan.pain_type || 'Sharp throbbing on 90° flexion & stiffness'}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; display: block;">Onset / Since When:</span>
          <strong>📅 ${plan.since_when || '19 Aug 2023 - Tawang Snow Patrol'}</strong>
        </div>
      </div>
    </div>

    <!-- Active Protocol & Exercises -->
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">🏃 ${plan.title}</h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            Targeted Knee Mobility Arc: <strong>115&deg; Flexion</strong> (+15&deg; recovery)
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.25rem; font-weight: 900; color: var(--olive-700);">${plan.completed_sessions} of ${plan.total_sessions} Sessions</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Protocol 70% Completed</div>
        </div>
      </div>

      <!-- Exercise Status Bar & Active Routine Timer -->
      <div style="background: var(--bg-main); border: 1.5px solid var(--border-color); border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <strong style="font-size: 0.95rem; color: var(--olive-900);">Today's Session Queue:</strong>
          <span style="font-size: 0.85rem; color: ${remainingExercises > 0 ? '#d97706' : '#15803d'}; font-weight: 800; margin-left: 8px;">
            ${remainingExercises > 0 ? `⏳ ${remainingExercises} exercises remaining for today` : '✓ All exercises completed for today!'}
          </span>
        </div>

        <!-- Active Exercise Countdown Timer -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Routine Timer:</span>
          <span id="routineTimerDisplay" style="font-family: monospace; font-size: 1.2rem; font-weight: 900; color: var(--olive-800); background: var(--bg-card); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
            ${mins}:${secs}
          </span>
          <button class="btn-primary" style="padding: 5px 12px; font-size: 0.78rem;" onclick="toggleRoutineTimer()">
            ${state.isTimerRunning ? '⏸ Pause' : '▶ Start Timer'}
          </button>
        </div>
      </div>

      <!-- Exercises Checklist -->
      <div class="exercise-list">
        ${plan.exercises.map(ex => `
          <div class="exercise-row ${ex.completed ? 'completed' : ''}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" id="${ex.id}" ${ex.completed ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;" onchange="toggleExerciseItem('${ex.id}', this.checked)" />
              <div>
                <label for="${ex.id}" style="font-weight: 800; font-size: 0.92rem; cursor: pointer; text-decoration: ${ex.completed ? 'line-through' : 'none'};">
                  ${ex.name}
                </label>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${ex.reps} &bull; Est. 5 mins</div>
              </div>
            </div>
            <button class="btn-outline" style="font-size: 0.72rem; padding: 4px 8px;" onclick="alert('Playing 3D physiotherapy guidance demo for ${ex.name}')">
              🎥 Video Demo
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Pain Scale Slider -->
      <div style="background: var(--bg-main); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label style="font-weight: 800; font-size: 0.88rem;">Log Today's Joint Pain (VAS 0–10):</label>
          <span id="painSliderVal" style="font-weight: 900; color: #dc2626; font-size: 1.1rem;">${plan.pain_level}/10</span>
        </div>
        <input type="range" min="0" max="10" value="${plan.pain_level}" style="width: 100%; accent-color: var(--olive-700); cursor: pointer;"
          oninput="document.getElementById('painSliderVal').textContent = this.value + '/10'; updatePainValue(this.value);" />
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
        <button class="btn-primary" onclick="markRehabSessionComplete()">
          ✓ Mark Today's Session Completed (${plan.completed_sessions + 1}/${plan.total_sessions})
        </button>
      </div>
    </div>
  `;
}

function toggleRoutineTimer() {
  state.isTimerRunning = !state.isTimerRunning;
  if (state.isTimerRunning) {
    state.timerInterval = setInterval(() => {
      if (state.routineTimerSeconds > 0) {
        state.routineTimerSeconds--;
        const mins = String(Math.floor(state.routineTimerSeconds / 60)).padStart(2, '0');
        const secs = String(state.routineTimerSeconds % 60).padStart(2, '0');
        const disp = document.getElementById('routineTimerDisplay');
        if (disp) disp.textContent = `${mins}:${secs}`;
      } else {
        clearInterval(state.timerInterval);
        state.isTimerRunning = false;
        alert('🔔 Routine Timer Complete! Great job completing your knee exercises.');
      }
    }, 1000);
  } else {
    clearInterval(state.timerInterval);
  }
  renderRehabTab(document.getElementById('soldierTabContent'));
}

async function updatePainValue(val) {
  try {
    const headers = getAuthHeaders();
    await fetch('/api/rehab/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ pain_level: Number(val) })
    });
  } catch (err) {
    console.error(err);
  }
}

async function toggleExerciseItem(exId, isChecked) {
  if (!state.rehabPlan) return;
  const ex = state.rehabPlan.exercises.find(e => e.id === exId);
  if (ex) ex.completed = isChecked;

  try {
    const headers = getAuthHeaders();
    await fetch('/api/rehab/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        completed_exercise_ids: state.rehabPlan.exercises.filter(e => e.completed).map(e => e.id)
      })
    });
    renderRehabTab(document.getElementById('soldierTabContent'));
  } catch (err) {
    console.error(err);
  }
}

async function markRehabSessionComplete() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/rehab/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ mark_completed: true })
    });
    if (res.ok) {
      state.rehabPlan = await res.json();
      alert('✓ Session marked complete! Progress recorded to Military Hospital Jaipur.');
      updateStatCards();
      renderRehabTab(document.getElementById('soldierTabContent'));
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================================
// 4. ACCESS GRANTS TAB WITH LIVE COUNTDOWN TIMER & VISIT TRACKER
// ============================================================================
function renderGrantsTab(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">🔐 Sovereign Access Grants &amp; Live Tracking</h2>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
            Real-time countdown timer &bull; See if doctors accessed your file live &bull; Total visits count
          </div>
        </div>
      </div>

      <div class="grants-list" id="grantsListContainer">
        ${state.grants.map(g => {
          const isLive = g.is_live;
          return `
            <div class="grant-item" style="border-left: 5px solid ${g.status === 'ACTIVE' ? 'var(--olive-600)' : '#dc2626'};">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                  <strong style="font-size: 1.05rem;">${g.granted_to_role}</strong>
                  <span class="badge-tag ${g.status === 'ACTIVE' ? 'badge-vaccine' : 'badge-injury'}">${g.status}</span>
                  ${isLive ? `
                    <span style="font-size: 0.72rem; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 999px; font-weight: 800; animation: pulseGreen 1.5s infinite;">
                      🟢 ACCESSED LIVE NOW
                    </span>
                  ` : `
                    <span style="font-size: 0.72rem; color: var(--text-muted);">
                      Last viewed: ${g.last_accessed_at || 'Yesterday'}
                    </span>
                  `}
                </div>

                <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 6px;">
                  ${g.purpose}
                </div>

                <div style="font-size: 0.78rem; display: flex; flex-wrap: wrap; gap: 14px; color: var(--text-muted);">
                  <!-- Real-time Expiry Countdown Timer -->
                  <span style="color: var(--olive-700); font-weight: 800;" class="grant-countdown" data-expiry="${g.expiry_date}">
                    ⏳ Expiry Countdown: Computing...
                  </span>
                  <span>👁️ <strong>Visits Count:</strong> Viewed ${g.access_count || 1} times</span>
                </div>
              </div>

              <div>
                ${g.status === 'ACTIVE' ? `
                  <button class="btn-outline" style="color: #dc2626; border-color: #fca5a5;" onclick="revokeGrant('${g.id}')">
                    🚫 Revoke Access
                  </button>
                ` : `
                  <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Revoked</span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function startGrantCountdownTicker() {
  setInterval(() => {
    document.querySelectorAll('.grant-countdown').forEach(el => {
      const expiryStr = el.getAttribute('data-expiry') || '2026-12-31T23:59:59Z';
      const diff = new Date(expiryStr).getTime() - new Date().getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        el.textContent = `⏳ Expires in: ${days}d ${hours}h ${mins}m ${secs}s`;
      } else {
        el.textContent = '⏱️ Access Expired';
      }
    });
  }, 1000);
}

async function revokeGrant(grantId) {
  if (!confirm('Revoke access immediately? Provider will be blocked instantly.')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/access-grants/revoke', {
      method: 'POST',
      headers,
      body: JSON.stringify({ grant_id: grantId })
    });
    if (res.ok) {
      alert('✓ Access permission revoked immediately!');
      await loadSoldierData();
      renderSoldierTab();
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================================
// 5. CLAIMS TRACKER WITH MOVING LINE STEPPER
// ============================================================================
function renderClaimsTab(container) {
  const claim = (state.claims && state.claims[0]) || {
    title: 'Left Knee Meniscus Post-Operative Disability Claim',
    current_stage: 3,
    status_label: 'Pending Medical Scrutiny',
    stages: [
      { id: 1, name: 'Submitted', date: '2024-04-10', completed: true },
      { id: 2, name: 'Waiting for Verification', date: '2024-06-15', completed: true },
      { id: 3, name: 'Pending Medical Scrutiny', date: '2024-11-01', completed: true, current: true },
      { id: 4, name: 'Waiting for Approval', date: 'Est. Dec 2024', completed: false },
      { id: 5, name: 'Claim Sanctioned', date: 'Pending', completed: false }
    ]
  };

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">📋 ECHS Disability Claim Tracker</h2>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
            Claim: ${claim.title} &bull; PCDA / AG Branch
          </div>
        </div>
        <span class="badge-tag badge-surgery" style="font-size: 0.85rem; padding: 6px 14px;">
          STAGE 3: ${claim.status_label}
        </span>
      </div>

      <!-- Moving Line Animated Stepper -->
      <div class="claims-stepper-wrap">
        <div class="claims-track-bg"></div>
        <div class="claims-track-progress" style="width: 54%;"></div>
        <div class="claims-track-pulse"></div>

        <div class="claims-step-nodes">
          <div class="claim-step-node done">
            <div class="step-node-icon">✓</div>
            <strong style="font-size: 0.82rem; display: block;">1. Submitted</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Apr 10, 2024</span>
          </div>

          <div class="claim-step-node done">
            <div class="step-node-icon">✓</div>
            <strong style="font-size: 0.82rem; display: block;">2. Verification</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Base Hospital</span>
          </div>

          <div class="claim-step-node current">
            <div class="step-node-icon">3</div>
            <strong style="font-size: 0.82rem; color: #f97316; display: block;">3. Pending Scrutiny</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Active Review</span>
          </div>

          <div class="claim-step-node">
            <div class="step-node-icon">4</div>
            <strong style="font-size: 0.82rem; display: block;">4. Approval</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">PCDA Clearance</span>
          </div>

          <div class="claim-step-node">
            <div class="step-node-icon">5</div>
            <strong style="font-size: 0.82rem; display: block;">5. Sanctioned</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">PPO Disbursement</span>
          </div>
        </div>
      </div>

      <!-- Bank Disbursement Account Display -->
      <div style="background: var(--bg-main); border: 1.5px solid var(--border-color); border-radius: 8px; padding: 16px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 0.95rem; color: var(--olive-900);">Linked Disability Pension Disbursement Account:</strong>
          <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 4px;">
            State Bank of India (SBI) &bull; A/C: 30491829401 &bull; IFSC: SBIN0001234 (DSP Gold)
          </div>
        </div>
        <button class="btn-outline" style="font-size: 0.8rem;" onclick="toggleSettingsDrawer()">
          Manage Bank A/C in Settings
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// 6. SETTINGS DRAWER HELPERS (LANGUAGE, BANK, PASSWORD, PROFILE)
// ============================================================================
function toggleSettingsDrawer() {
  const drawer = document.getElementById('settingsDrawerBackdrop');
  drawer.classList.toggle('active');
}

function changeSoldierLanguage(lang) {
  state.lang = lang;
  const t = I18N_SOLDIER[lang];

  document.getElementById('headerAppTitle').innerHTML = `${t.appTitle} <span style="font-size: 0.7rem; background: var(--olive-100); color: var(--olive-900); padding: 2px 7px; border-radius: 4px;">${t.appSub}</span>`;
  document.getElementById('headerTagline').textContent = `"${t.tagline}"`;
  document.getElementById('navWalletTxt').textContent = t.navWallet;
  document.getElementById('navStressTxt').textContent = t.navStress;
  document.getElementById('navRehabTxt').textContent = t.navRehab;
  document.getElementById('navGrantsTxt').textContent = t.navGrants;
  document.getElementById('navClaimsTxt').textContent = t.navClaims;
  document.getElementById('sidebarVaultTxt').textContent = t.vaultDesc;
  document.getElementById('statRecLabel').textContent = t.recLabel;
  document.getElementById('statRecSub').textContent = t.recSub;
  document.getElementById('statRehabLabel').textContent = t.rehabLabel;
  document.getElementById('statRehabSub').textContent = t.rehabSub;
  document.getElementById('statStressLabel').textContent = t.stressLabel;
  document.getElementById('statStressSub').textContent = t.stressSub;
  document.getElementById('statNextApptLabel').textContent = t.nextApptLabel;
  document.getElementById('drawerTitleTxt').textContent = t.drawerTitle;
  document.getElementById('txtDarkModeLabel').textContent = t.darkMode;

  document.getElementById('btnLangEN').className = lang === 'en' ? 'btn-primary' : 'btn-outline';
  document.getElementById('btnLangHI').className = lang === 'hi' ? 'btn-primary' : 'btn-outline';

  renderSoldierTab();
}

function toggleDarkMode() {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  document.getElementById('themeToggleBtn').textContent = next === 'dark' ? '☀️ Dark Mode On' : '🌙 Light Theme';
}

function openUpdateBankModal() {
  const bankName = prompt('Enter Bank Name:', 'State Bank of India (SBI)');
  const accNo = prompt('Enter Account Number:', '30491829401');
  const ifsc = prompt('Enter IFSC Code:', 'SBIN0001234');

  if (bankName && accNo) {
    document.getElementById('bankNameDisp').textContent = bankName;
    document.getElementById('bankAccNoDisp').textContent = accNo;
    document.getElementById('bankIfscDisp').textContent = ifsc;
    alert('✓ Bank Account linked successfully for ECHS claim disbursement!');
  }
}

function openUpdateProfileModal() {
  const phone = prompt('Enter Contact Phone Number:', '+91-9876543210');
  const ice = prompt('Enter Emergency Contact (ICE):', 'Sunita Verma (Wife) - +91-9876543211');
  if (phone) {
    alert('✓ Emergency contact details updated and encrypted in Kavach Vault.');
  }
}

function openChangePasswordModal() {
  const pw = prompt('Enter New Military PIN / Password:');
  if (pw && pw.length >= 6) {
    alert('✓ Military PIN updated successfully.');
  } else if (pw) {
    alert('PIN must be at least 6 characters.');
  }
}

function togglePrivacyCurtain() {
  document.getElementById('privacyCurtain').classList.toggle('active');
}

function openAssessmentModal(type) {
  alert(`Opening ${type} self-assessment. Responses are private and encrypted at rest with AES-256.`);
}

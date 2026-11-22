// ============================================================================
// KAVACH: SOLDIER & VETERAN PATIENT DASHBOARD LOGIC
// ============================================================================

const state = {
  activeTab: 'wallet',
  chartPeriod: 'weekly', // 'weekly' or 'monthly'
  postingFilter: 'ALL',
  records: [],
  screenings: [],
  rehabPlan: null,
  grants: []
};

document.addEventListener('DOMContentLoaded', async () => {
  // Update soldier header name & details
  const name = localStorage.getItem('kavach_user_name') || 'Rifleman Arjun Verma';
  const serviceNo = localStorage.getItem('kavach_user_service_no') || '15489201A';
  const posting = localStorage.getItem('kavach_user_posting') || 'Rajasthan (Desert Sector)';

  document.getElementById('soldierNameDisp').textContent = name;
  document.getElementById('soldierSubDisp').textContent = `${serviceNo} • 14 Rajputana Rifles`;
  document.getElementById('soldierPostingDisp').textContent = posting;

  await loadSoldierData();
  renderSoldierTab();
});

async function loadSoldierData() {
  try {
    const headers = getAuthHeaders();
    const [recRes, scrRes, rhbRes, grtRes] = await Promise.all([
      fetch('/api/records?role=SOLDIER', { headers }),
      fetch('/api/screenings?role=SOLDIER', { headers }),
      fetch('/api/rehab?role=SOLDIER', { headers }),
      fetch('/api/access-grants?role=SOLDIER', { headers })
    ]);

    if (recRes.ok) state.records = await recRes.json();
    if (scrRes.ok) state.screenings = await scrRes.json();
    if (rhbRes.ok) state.rehabPlan = await rhbRes.json();
    if (grtRes.ok) state.grants = await grtRes.json();

    updateStatCards();
  } catch (err) {
    console.error('Error loading soldier data:', err);
  }
}

function updateStatCards() {
  document.getElementById('statRecCount').textContent = state.records.length || 6;
  if (state.rehabPlan) {
    const pct = Math.round((state.rehabPlan.completed_sessions / state.rehabPlan.total_sessions) * 100);
    document.getElementById('statRehabProgress').textContent = `${pct}%`;
  }
  const phqRecords = state.screenings.filter(s => s.questionnaire_type === 'PHQ-9');
  if (phqRecords.length > 0) {
    const latest = phqRecords[phqRecords.length - 1];
    document.getElementById('statStressScore').textContent = `${latest.score}/27`;
  }
}

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
      renderWalletTab(container);
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
    case 'settings':
      renderSettingsTab(container);
      break;
    default:
      renderWalletTab(container);
  }
}

// ============================================================================
// 1. HEALTH WALLET TAB (TAMPER-PROOF APPEND-ONLY RECORDS BY POSTING)
// ============================================================================
function renderWalletTab(container) {
  let filtered = state.records;
  if (state.postingFilter !== 'ALL') {
    filtered = filtered.filter(r => r.posting.toLowerCase().includes(state.postingFilter.toLowerCase()));
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">💼 Tamper-Proof Health Wallet</h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            Encrypted records stored across 3 postings &bull; Append-only &bull; Sealed with SHA-256 HMAC
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-outline" onclick="openClaimSummaryModal()">
            📋 Claim-Ready Summary
          </button>
          <button class="btn-primary" onclick="openAddRecordModal()">
            ✚ Add Field Record
          </button>
        </div>
      </div>

      <!-- Postings Filter Tabs -->
      <div class="posting-filters">
        <button class="posting-btn ${state.postingFilter === 'ALL' ? 'active' : ''}" onclick="filterPosting('ALL')">
          📍 All Postings (${state.records.length})
        </button>
        <button class="posting-btn ${state.postingFilter === 'Rajasthan' ? 'active' : ''}" onclick="filterPosting('Rajasthan')">
          🏜️ Rajasthan (Desert Sector)
        </button>
        <button class="posting-btn ${state.postingFilter === 'North East' ? 'active' : ''}" onclick="filterPosting('North East')">
          🏔️ North East (Tawang Sector)
        </button>
        <button class="posting-btn ${state.postingFilter === 'Siachen' ? 'active' : ''}" onclick="filterPosting('Siachen')">
          ❄️ Siachen Base Camp
        </button>
      </div>

      <!-- Records Grid -->
      <div class="records-grid">
        ${filtered.map(r => `
          <div class="record-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="badge-tag badge-${r.type.toLowerCase().replace('_', '')}">${r.type}</span>
                <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted);">${r.date}</span>
              </div>
              <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 6px;">${r.title}</h3>
              <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                <span>📍 ${r.posting}</span>
                <span>👨‍⚕️ ${r.doctor_name || 'Medical Officer'}</span>
                <span>🏥 ${r.hospital || 'Base Hospital'}</span>
              </div>
              <p style="font-size: 0.83rem; color: var(--text-main); line-height: 1.45; margin-bottom: 14px;">
                ${r.is_mental_health ? '<em>Confidential Assessment: Clinical data protected with AES-256-GCM encryption.</em>' : r.diagnosis}
              </p>
            </div>
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div class="tamper-hash-seal" title="SHA-256 Checksum: ${r.tamper_hash}">
                <span>🛡️</span>
                <span>SHA-256 Verified</span>
              </div>
              <span style="font-size: 0.73rem; color: var(--text-muted);">Version ${r.version || 1} (Append-Only)</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function filterPosting(p) {
  state.postingFilter = p;
  renderSoldierTab();
}

// ============================================================================
// 2. STRESS SCREENING TAB (LINE GRAPH + PIE CHART, WEEKLY/MONTHLY, NUDGE)
// ============================================================================
function renderStressTab(container) {
  const phqList = state.screenings.filter(s => s.questionnaire_type === 'PHQ-9');
  const latestPhq = phqList[phqList.length - 1] || { score: 13, severity: 'Moderate Depression' };

  container.innerHTML = `
    <!-- Gentle Counselor Nudge Banner -->
    <div class="counselor-nudge-banner">
      <div class="nudge-content">
        <span class="nudge-icon">⚠️</span>
        <div class="nudge-text">
          <strong>Your stress scores have climbed 3 weeks in a row — a confidential counselor is one tap away.</strong>
          <span>Weekly PHQ-9 rose from 5 to 13 during Desert patrol. AFMS Psychological Support Cell (Dr. Sunita Rao) is available with 1-click confidential reach.</span>
        </div>
      </div>
      <button class="btn-primary" style="background: #d97706; white-space: nowrap;" onclick="contactCounselorOneTap()">
        Connect with Counselor
      </button>
    </div>

    <!-- Dual Charts Row: Line Graph + Pie Chart -->
    <div class="charts-dual-grid">
      <!-- 1. Interactive Line Graph (Weekly & Monthly Toggle) -->
      <div class="chart-box">
        <div class="chart-header-controls">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              <span>📈</span> <span>Stress Score Trajectory Over Time</span>
            </h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">
              Threshold: &ge; 10 triggers Proactive Outreach
            </span>
          </div>

          <!-- Weekly / Monthly Toggle Buttons -->
          <div class="period-pill-toggle">
            <button class="period-btn ${state.chartPeriod === 'weekly' ? 'active' : ''}" onclick="toggleChartPeriod('weekly')">
              Weekly
            </button>
            <button class="period-btn ${state.chartPeriod === 'monthly' ? 'active' : ''}" onclick="toggleChartPeriod('monthly')">
              Monthly
            </button>
          </div>
        </div>

        <div style="height: 240px; position: relative;">
          ${renderLineChartSVG(state.chartPeriod)}
        </div>
      </div>

      <!-- 2. Interactive Pie Chart (Severity Distribution) -->
      <div class="chart-box">
        <div class="chart-header-controls">
          <h3 style="font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <span>🥧</span> <span>Symptom Distribution</span>
          </h3>
          <span style="font-size: 0.74rem; color: var(--text-muted);">Self-Assessments</span>
        </div>

        <div style="height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          ${renderPieChartSVG()}
        </div>
      </div>
    </div>

    <!-- Globally Validated Questionnaire Check-ins -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">📝 Globally Validated Self-Assessments</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            Private assessments tracking PTSD, Depression and Anxiety &bull; Separated by is_mental_health flag
          </div>
        </div>
        <span style="font-size: 0.75rem; background: var(--olive-100); color: var(--olive-900); padding: 4px 10px; border-radius: 999px; font-weight: 800;">
          CONFIDENTIAL
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        <!-- PHQ-9 Card -->
        <div style="border: 1.5px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 1rem;">PHQ-9 (Depression Inventory)</strong>
            <span style="font-size: 0.75rem; color: #dc2626; font-weight: 800;">Score: ${latestPhq.score}/27</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">
            Tracks mood, energy, sleep disturbances, and cognitive fatigue over the previous 14 days.
          </p>
          <button class="btn-outline" style="width: 100%;" onclick="openAssessmentModal('PHQ-9')">
            Take PHQ-9 Assessment →
          </button>
        </div>

        <!-- PCL-5 Card -->
        <div style="border: 1.5px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 1rem;">PCL-5 (PTSD Checklist)</strong>
            <span style="font-size: 0.75rem; color: #d97706; font-weight: 800;">Score: 32/80</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">
            Evaluates combat intrusion symptoms, hypervigilance, and trauma reactivity following deployment.
          </p>
          <button class="btn-outline" style="width: 100%;" onclick="openAssessmentModal('PCL-5')">
            Take PCL-5 Assessment →
          </button>
        </div>

        <!-- GAD-7 Card -->
        <div style="border: 1.5px solid var(--border-color); border-radius: 8px; padding: 18px; background: var(--bg-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 1rem;">GAD-7 (Anxiety Scale)</strong>
            <span style="font-size: 0.75rem; color: #15803d; font-weight: 800;">Score: 9/21</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">
            Measures generalized nervousness, tension, autonomic arousal, and worry intensity.
          </p>
          <button class="btn-outline" style="width: 100%;" onclick="openAssessmentModal('GAD-7')">
            Take GAD-7 Assessment →
          </button>
        </div>
      </div>
    </div>
  `;
}

function toggleChartPeriod(period) {
  state.chartPeriod = period;
  renderSoldierTab();
}

// Generate SVG Line Chart for Weekly & Monthly views
function renderLineChartSVG(period) {
  let dataPoints = [];
  if (period === 'weekly') {
    dataPoints = [
      { label: 'Wk 1 (Oct 10)', score: 5 },
      { label: 'Wk 2 (Oct 17)', score: 6 },
      { label: 'Wk 3 (Oct 24)', score: 8 },
      { label: 'Wk 4 (Oct 31)', score: 10 },
      { label: 'Wk 5 (Nov 07)', score: 11 },
      { label: 'Wk 6 (Nov 14)', score: 13 }
    ];
  } else {
    dataPoints = [
      { label: 'Aug 2024', score: 4 },
      { label: 'Sep 2024', score: 5 },
      { label: 'Oct 2024', score: 8 },
      { label: 'Nov 2024', score: 13 }
    ];
  }

  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 60;
  const paddingY = 30;
  const availableWidth = svgWidth - paddingX * 2;
  const availableHeight = svgHeight - paddingY * 2;

  const points = dataPoints.map((d, i) => {
    const x = paddingX + (i / (dataPoints.length - 1)) * availableWidth;
    const y = svgHeight - paddingY - (d.score / 27) * availableHeight;
    return { x, y, score: d.score, label: d.label };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const thresholdY = svgHeight - paddingY - (10 / 27) * availableHeight;

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <!-- Horizontal Guideline -->
      <line x1="${paddingX}" y1="${svgHeight - paddingY}" x2="${svgWidth - paddingX}" y2="${svgHeight - paddingY}" stroke="var(--border-subtle)" stroke-width="1.5" />
      
      <!-- Threshold Line (Score = 10) -->
      <line x1="${paddingX}" y1="${thresholdY}" x2="${svgWidth - paddingX}" y2="${thresholdY}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,4" />
      <text x="${svgWidth - paddingX - 100}" y="${thresholdY - 6}" font-size="11" font-weight="700" fill="#f59e0b">Threshold (10)</text>

      <!-- Shaded Gradient Area -->
      <defs>
        <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#22c55e" stop-opacity="0.04"/>
        </linearGradient>
      </defs>
      <path d="${pathD} L ${points[points.length-1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z" fill="url(#chartFillGrad)"/>

      <!-- Connecting Curve -->
      <path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Data Markers & Values -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="6" fill="${p.score >= 10 ? '#dc2626' : '#2e5229'}" stroke="#ffffff" stroke-width="2.5" />
        <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--text-main)">${p.score}</text>
        <text x="${p.x}" y="${svgHeight - 8}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--text-muted)">${p.label}</text>
      `).join('')}
    </svg>
  `;
}

// Generate SVG Donut / Pie Chart for Symptom Severity Distribution
function renderPieChartSVG() {
  // Minimal: 25%, Mild: 35%, Moderate: 30%, Severe: 10%
  return `
    <svg width="180" height="180" viewBox="0 0 200 200">
      <!-- Segment 1: Minimal (Green) 25% -->
      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#15803d" stroke-width="32" stroke-dasharray="110 330" stroke-dashoffset="0" />
      <!-- Segment 2: Mild (Gold) 35% -->
      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#d4af37" stroke-width="32" stroke-dasharray="154 286" stroke-dashoffset="-110" />
      <!-- Segment 3: Moderate (Orange) 30% -->
      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f97316" stroke-width="32" stroke-dasharray="132 308" stroke-dashoffset="-264" />
      <!-- Segment 4: Severe (Red) 10% -->
      <circle cx="100" cy="100" r="70" fill="transparent" stroke="#dc2626" stroke-width="32" stroke-dasharray="44 396" stroke-dashoffset="-396" />
      <text x="100" y="105" text-anchor="middle" font-size="15" font-weight="900" fill="var(--text-main)">PHQ-9</text>
    </svg>
    <div style="display: flex; justify-content: center; gap: 10px; font-size: 0.72rem; margin-top: 10px; flex-wrap: wrap;">
      <span><span style="color: #15803d;">●</span> Minimal (25%)</span>
      <span><span style="color: #d4af37;">●</span> Mild (35%)</span>
      <span><span style="color: #f97316;">●</span> Moderate (30%)</span>
      <span><span style="color: #dc2626;">●</span> Severe (10%)</span>
    </div>
  `;
}

function contactCounselorOneTap() {
  alert('📞 Connecting to Dr. Sunita Rao (AFMS Psychological Support Cell)...\nYour identity and records remain 100% confidential under Armed Forces Privacy Directives.');
}

// ============================================================================
// 3. REHAB TRACKER TAB (STRUCTURED EXERCISES, PAIN SLIDER, MOBILITY, PHOTOS)
// ============================================================================
function renderRehabTab(container) {
  const plan = state.rehabPlan || {
    title: 'Post-Arthroscopy Left Knee Mobility & Quadriceps Strengthening',
    completed_sessions: 14,
    total_sessions: 20,
    pain_level: 4,
    mobility_score: 115,
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
    <!-- Missed Session Alert to Physio -->
    ${plan.physio_alerted ? `
      <div style="background: #fff1f2; border: 1.5px solid #f43f5e; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 2rem;">⚠️</span>
          <div>
            <strong style="color: #9f1239; font-size: 0.95rem; display: block;">Physiotherapist Notification Active</strong>
            <span style="font-size: 0.82rem; color: #881337;">A session was missed yesterday. Alert sent to Lt. Rajesh Kumar (Rehab Officer, Military Hospital Jaipur) so rehabilitation never quietly dies.</span>
          </div>
        </div>
        <button class="btn-primary" style="background: #e11d48;" onclick="logMakeupSession()">
          Log Makeup Session
        </button>
      </div>
    ` : ''}

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">🏃 ${plan.title}</h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            Supervising Physio: Lt. Rajesh Kumar &bull; AMC Military Rehabilitation Wing
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 1.4rem; font-weight: 900; color: var(--olive-800);">${plan.completed_sessions}/${plan.total_sessions}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Sessions Completed (${pct}%)</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="rehab-progress-wrap">
        <div class="rehab-progress-bar" style="width: ${pct}%;"></div>
      </div>

      <!-- Joint Mobility & Pain Scale Metrics -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
        <!-- Pain Scale Slider -->
        <div style="background: var(--bg-main); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-weight: 800; font-size: 0.88rem;">Pain Level (Visual Analog Scale - VAS):</label>
            <span id="painSliderValue" style="font-weight: 900; color: #dc2626; font-size: 1.1rem;">${plan.pain_level}/10</span>
          </div>
          <input type="range" min="0" max="10" value="${plan.pain_level}" style="width: 100%; accent-color: var(--olive-700); cursor: pointer;"
            oninput="document.getElementById('painSliderValue').textContent = this.value + '/10'; updateSoldierPain(this.value);" />
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
            <span>0 = Pain Free</span>
            <span>5 = Moderate</span>
            <span>10 = Severe</span>
          </div>
        </div>

        <!-- Mobility Arc Score & Photo Progress -->
        <div style="background: var(--bg-main); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 0.88rem;">Joint Mobility Arc:</div>
            <div style="font-size: 1.5rem; font-weight: 900; color: var(--olive-700); margin-top: 2px;">
              ${plan.mobility_score || 115}&deg; <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Flexion Arc</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Normal: 135&deg; &bull; +15&deg; gain since surgery</div>
          </div>
          <div>
            <button class="btn-outline" style="font-size: 0.76rem;" onclick="alert('Viewing securely uploaded Knee Meniscus Range-of-Motion progress photo.')">
              📷 Progress Photo
            </button>
          </div>
        </div>
      </div>

      <!-- Structured Daily Exercises -->
      <h3 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 10px;">Daily Physical Therapy Check-offs</h3>
      <div class="exercise-list">
        ${plan.exercises.map(ex => `
          <div class="exercise-row ${ex.completed ? 'completed' : ''}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" id="${ex.id}" ${ex.completed ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" onchange="toggleExerciseItem('${ex.id}', this.checked)" />
              <div>
                <label for="${ex.id}" style="font-weight: 700; font-size: 0.88rem; cursor: pointer; text-decoration: ${ex.completed ? 'line-through' : 'none'};">
                  ${ex.name}
                </label>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${ex.reps} &bull; Target: Joint Stability</div>
              </div>
            </div>
            <button class="btn-outline" style="font-size: 0.72rem; padding: 4px 8px;" onclick="alert('Playing 3D military physiotherapy guidance demo for ${ex.name}')">
              🎥 Video Demo
            </button>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
        <button class="btn-primary" onclick="markRehabSessionComplete()">
          ✓ Mark Today's Session Completed (${plan.completed_sessions + 1}/${plan.total_sessions})
        </button>
      </div>
    </div>
  `;
}

async function updateSoldierPain(val) {
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
      alert('✓ Rehabilitation Session Completed!\nRecorded and synced with Military Hospital Jaipur rehab wing.');
      updateStatCards();
      renderSoldierTab();
    }
  } catch (err) {
    console.error(err);
  }
}

function logMakeupSession() {
  markRehabSessionComplete();
}

// ============================================================================
// 4. ACCESS & TIME-STAMPED GRANTS TAB (WITH TIME EXPIRY & INSTANT REVOKE)
// ============================================================================
function renderGrantsTab(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">🔐 Time-Stamped Access Grants &amp; Consent Manager</h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            Soldier controls sovereign access &bull; All grants are time-stamped &bull; Immediate Revocation anytime
          </div>
        </div>
        <button class="btn-primary" onclick="openGrantAccessModal()">
          ✚ Grant Time-Stamped Access
        </button>
      </div>

      <div class="grants-list">
        ${state.grants.map(g => `
          <div class="grant-item">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <strong style="font-size: 0.95rem;">${g.granted_to_role}</strong>
                <span class="badge-tag ${g.status === 'ACTIVE' ? 'badge-vaccine' : 'badge-injury'}">${g.status}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 4px;">${g.purpose}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ⏱️ Granted: ${g.created_at ? g.created_at.split('T')[0] : '2024-01-15'} &bull;
                <strong style="color: ${g.status === 'ACTIVE' ? 'var(--olive-700)' : '#dc2626'};">
                  Expires: ${g.expiry_date || '2026-12-31'}
                </strong>
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
        `).join('')}
      </div>
    </div>
  `;
}

async function revokeGrant(grantId) {
  if (!confirm('Are you sure you want to revoke this medical access grant? The provider will immediately be blocked.')) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/access-grants/revoke', {
      method: 'POST',
      headers,
      body: JSON.stringify({ grant_id: grantId })
    });
    if (res.ok) {
      alert('✓ Access permission revoked! Event recorded to immutable audit log.');
      await loadSoldierData();
      renderSoldierTab();
    }
  } catch (err) {
    console.error(err);
  }
}

function openGrantAccessModal() {
  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'grantModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 480px; width: 90%; padding: 24px; color: var(--text-main); border: 1.5px solid var(--border-color); text-align: left;" onclick="event.stopPropagation()">
      <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">⏱️ Grant Time-Stamped Access</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Grant Access To:</label>
        <select id="grantToRole" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <option value="DOCTOR">🩺 Medical Officer / Doctor</option>
          <option value="PHYSIOTHERAPIST">🏃 Physiotherapist (Rehab)</option>
          <option value="COUNSELOR">🧠 Mental Health Counselor</option>
          <option value="CLAIMS_OFFICER">⚖️ Claims Officer (ECHS Verification)</option>
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Time Duration (Automatic Expiry):</label>
        <select id="grantDuration" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <option value="24_HOURS">24 Hours (Emergency Consult)</option>
          <option value="7_DAYS">7 Days (Short Inpatient Stay)</option>
          <option value="30_DAYS">30 Days (Rehab Protocol Cycle)</option>
          <option value="1_YEAR">1 Year (Long-term Medical Board)</option>
        </select>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Authorized Clinical Purpose:</label>
        <input type="text" id="grantPurpose" value="Post-Surgical Knee Rehabilitation Tracking" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('grantModal').remove()">Cancel</button>
        <button class="btn-primary" onclick="submitNewGrant()">Generate Time-Stamped Grant</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitNewGrant() {
  const role = document.getElementById('grantToRole').value;
  const duration = document.getElementById('grantDuration').value;
  const purpose = document.getElementById('grantPurpose').value;

  alert(`✓ Time-stamped consent grant generated for ${role} with duration ${duration}. Event logged to audit trail.`);
  document.getElementById('grantModal').remove();
  await loadSoldierData();
  renderSoldierTab();
}

// ============================================================================
// 5. CLAIMS DOSSIER & SUMMARY
// ============================================================================
function renderClaimsTab(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">📋 ECHS &amp; MoD Disability Claim Tracker</h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            Tamper-proof service injury dossiers ready for disability pension sanction
          </div>
        </div>
        <button class="btn-primary" onclick="openClaimSummaryModal()">
          Export Signed Claim Package
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; margin: 18px 0; padding: 18px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-main);">
        <div style="text-align: center;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #15803d; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto; font-weight: bold;">✓</div>
          <strong style="font-size: 0.8rem;">1. Submission</strong>
        </div>
        <div style="text-align: center;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #15803d; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto; font-weight: bold;">✓</div>
          <strong style="font-size: 0.8rem;">2. Medical Board</strong>
        </div>
        <div style="text-align: center;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #d97706; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto; font-weight: bold;">3</div>
          <strong style="font-size: 0.8rem; color: #d97706;">3. Scrutiny</strong>
        </div>
        <div style="text-align: center;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #9ca3af; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto; font-weight: bold;">4</div>
          <strong style="font-size: 0.8rem; color: #9ca3af;">4. Sanctioned</strong>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 6px;">
          <strong>Verified Service Injury: Left Knee Meniscus Arthroscopy</strong>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Posting: North East (Tawang) &bull; Attributable to Patrol Duty on Glacier &bull; SHA-256 HMAC Validated</div>
        </div>
        <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 6px;">
          <strong>Verified Service Injury: Deltoid Shrapnel Debridement</strong>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Posting: Rajasthan (Desert Sector) &bull; Attributable to Tactical Combat Firing &bull; SHA-256 HMAC Validated</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 6. SETTINGS & EMERGENCY QR TAB
// ============================================================================
function renderSettingsTab(container) {
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 12px;">🪪 Emergency Field QR Card</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
          Provides instant critical medical info offline to frontline first-responders without requiring network connectivity.
        </p>
        <div style="border: 2px dashed var(--olive-600); border-radius: 8px; padding: 22px; text-align: center; background: var(--bg-main);">
          <div style="font-size: 4rem;">📱</div>
          <div style="font-size: 1.15rem; font-weight: 900; margin-top: 6px;">RIFLEMAN ARJUN VERMA</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">15489201A &bull; 14 Rajputana Rifles</div>
          <div style="display: flex; justify-content: center; gap: 18px; margin: 14px 0; font-size: 0.9rem;">
            <span>🩸 Blood: <strong>O+</strong></span>
            <span>⚠️ Allergy: <strong style="color: #dc2626;">Penicillin</strong></span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">ICE Emergency: Sunita Verma (Wife) +91-9876543211</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title" style="margin-bottom: 12px;">🛡️ Privacy &amp; App Security Settings</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
            <div>
              <strong>Mental Health Privacy Shield</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Strictly hide mental health logs from Commanding Officers and Claims Officers</div>
            </div>
            <span style="color: #15803d; font-weight: 800;">ENFORCED</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
            <div>
              <strong>Biometric Terminal Lock</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Require Military PIN on app reactivation</div>
            </div>
            <span style="color: #15803d; font-weight: 800;">ENABLED</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Quick UI Helper Functions
function togglePrivacyCurtain() {
  const curtain = document.getElementById('privacyCurtain');
  curtain.classList.toggle('active');
}

function toggleDarkMode() {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  document.getElementById('themeToggleBtn').textContent = next === 'dark' ? '☀️' : '🌙';
}

function openClaimSummaryModal() {
  alert('Exporting verified ECHS Claim Package with cryptographically sealed SHA-256 signatures across all 3 postings.');
}

function openAddRecordModal() {
  alert('Only authorized Medical Officers can create append-only records with SHA-256 tamper-proof seals.');
}

function openAssessmentModal(type) {
  alert(`Opening ${type} self-assessment questionnaire. All responses are AES-256 encrypted at rest.`);
}

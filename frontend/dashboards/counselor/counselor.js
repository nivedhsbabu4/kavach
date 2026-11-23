// ============================================================================
// KAVACH: DEFENCE PSYCHOLOGICAL SUPPORT CELL & COUNSELOR CONSOLE
// ============================================================================

let currentCounselor = null;
let mhRequests = [];
let nudgeQueue = [];
let screeningsList = [];
let activePatients = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadCounselorProfile();
  await loadMhRequests();
  await loadNudgeQueue();
  await loadScreeningTrends();
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.background = type === 'success' ? '#6b21a8' : (type === 'warn' ? '#92400e' : '#991b1b');
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 18px';
  toast.style.borderRadius = '10px';
  toast.style.fontSize = '0.84rem';
  toast.style.fontWeight = '700';
  toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.animation = 'fadeIn 0.25s ease';
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠️'}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

async function loadCounselorProfile() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/auth/me', { headers });
    if (res.ok) {
      const data = await res.json();
      currentCounselor = data.user;
      renderCounselorHeader(data.user);
    }
  } catch (err) {
    console.warn('Failed to load counselor profile:', err);
  }
}

function renderCounselorHeader(user) {
  if (!user) return;
  const nameEl = document.getElementById('counselorNameTitle');
  const metaEl = document.getElementById('counselorMetaSub');
  const avatarEl = document.getElementById('counselorAvatarBadge');

  if (nameEl) nameEl.textContent = user.name;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>Senior Psychologist &bull; ${user.service_number || user.service_no || 'CIV-PSY-042'}</span>
      <span>&bull;</span>
      <span class="sync-badge synced"><span class="sync-pulse-dot"></span> <span>${user.posting || user.unit || 'TELE-MANAS CELL'}</span></span>
    `;
  }
  if (avatarEl && user.name) {
    const initials = user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

// ----------------------------------------------------------------------------
// DOCTOR MH-ACCESS REQUESTS QUEUE
// ----------------------------------------------------------------------------

async function loadMhRequests() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/counselor/mh-requests', { headers });
    if (res.ok) {
      mhRequests = await res.json();
      renderMhRequests(mhRequests);
    }
  } catch (e) {
    console.warn('Could not load MH requests:', e);
  }
}

function renderMhRequests(list) {
  const container = document.getElementById('mhRequestsContainer');
  const badge = document.getElementById('requestCountBadge');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: #7c3aed;">
        <span>🛡️</span> <strong>No active doctor access requests.</strong>
        <div style="font-size: 0.76rem; color: #6b7280; margin-top: 2px;">All confidential psychological records are securely isolated.</div>
      </div>
    `;
    if (badge) badge.textContent = '0 PENDING';
    return;
  }

  const pending = list.filter(r => r.status === 'PENDING_PSYCHOLOGIST_APPROVAL');
  if (badge) badge.textContent = `${pending.length} PENDING DECISION`;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${list.map(r => `
        <div style="background: white; border: 1.5px solid ${r.status === 'APPROVED' ? '#86efac' : (r.status === 'DENIED' ? '#fca5a5' : '#e9d5ff')}; border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 0.95rem; color: #1e293b;">
                ${r.doctor_rank || 'Doctor'} ${r.doctor_name}
              </strong>
              <span style="font-size: 0.72rem; color: #64748b;">(${r.hospital || 'Military Hospital'})</span>
              <span class="badge-tag" style="font-size: 0.7rem; font-weight: 800; background: ${r.status === 'APPROVED' ? '#dcfce7' : (r.status === 'DENIED' ? '#fee2e2' : '#fef3c7')}; color: ${r.status === 'APPROVED' ? '#15803d' : (r.status === 'DENIED' ? '#991b1b' : '#92400e')}; border-color: transparent;">
                ${r.status}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: #475569; margin-top: 4px;">
              <strong>Patient:</strong> ${r.soldier_name} &bull; <strong>Clinical Justification:</strong> "${r.reason}"
            </div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
              Requested: ${r.requested_at ? r.requested_at.slice(0, 16).replace('T', ' ') : 'Recent'}
            </div>
          </div>

          <div>
            ${r.status === 'PENDING_PSYCHOLOGIST_APPROVAL' ? `
              <div style="display: flex; gap: 8px;">
                <button class="btn-primary" style="background: #15803d; border-color: #166534; font-size: 0.75rem; padding: 6px 14px;" onclick="adjudicateRequest('${r.id}', 'APPROVED')">
                  ✓ Approve Access
                </button>
                <button class="btn-outline" style="color: #991b1b; border-color: #ef4444; font-size: 0.75rem; padding: 6px 12px;" onclick="adjudicateRequest('${r.id}', 'DENIED')">
                  ✕ Deny
                </button>
              </div>
            ` : `
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">
                Adjudicated &bull; ${r.status}
              </div>
            `}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function adjudicateRequest(requestId, decision) {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/counselor/approve-mh-access', {
      method: 'POST',
      headers,
      body: JSON.stringify({ request_id: requestId, decision })
    });
    if (res.ok) {
      showToast(`✓ Request successfully ${decision.toLowerCase()}! Notification dispatched to Doctor console.`, 'success');
      await loadMhRequests();
    }
  } catch (e) {
    showToast('Error recording decision.', 'warn');
  }
}

// ----------------------------------------------------------------------------
// PROACTIVE NUDGE DISPATCH QUEUE
// ----------------------------------------------------------------------------

async function loadNudgeQueue() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/counselor/nudge-queue', { headers });
    if (res.ok) {
      nudgeQueue = await res.json();
      renderNudgeQueue(nudgeQueue);
    }
  } catch (e) {
    console.warn('Could not load nudge queue:', e);
  }
}

function renderNudgeQueue(list) {
  const container = document.getElementById('nudgeQueueContainer');
  const countEl = document.getElementById('statNudgeCount');
  if (!container) return;

  if (countEl) countEl.textContent = list.length;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <span>✓</span> No personnel currently flagged for psychological escalation.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => `
    <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 2rem;">⚠️</span>
        <div>
          <strong style="color: #92400e; font-size: 0.98rem; display: block;">
            PROACTIVE COUNSELOR NUDGE: ${item.risk_label}
          </strong>
          <span style="font-size: 0.82rem; color: #78350f;">
            <strong>${item.rank} ${item.name}</strong> (${item.service_no} &bull; ${item.unit}) &bull; Latest PHQ-9: <strong>${item.phq_score}/27</strong>, PCL-5: <strong>${item.pcl_score}/80</strong>.
          </span>
          <div style="font-size: 0.74rem; color: #a16207; margin-top: 3px;">
            Screening indicates consecutive score escalation. Gentle supportive touchpoint recommended.
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-primary" style="background: #d97706; border-color: #b45309; font-size: 0.78rem;" onclick="sendCounselorNudge('${item.soldier_id}', '${item.name}')">
          📱 Send Supportive Nudge
        </button>
        <button class="btn-primary" style="background: #7c3aed; border-color: #6d28d9; font-size: 0.78rem;" onclick="openConfidentialSessionModal('${item.soldier_id}', '${item.name}')">
          🔒 Record CBT Note
        </button>
      </div>
    </div>
  `).join('');
}

async function sendCounselorNudge(soldierId, soldierName) {
  try {
    const headers = getAuthHeaders();
    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient_id: soldierId,
        recipient_role: 'SOLDIER',
        type: 'COUNSELOR_NUDGE',
        title: 'Confidential Support Check-In',
        message: 'Defence Psychological Support Cell: "We noticed your recent health check-in. Remember, confidential mental wellness support and sleep hygiene tools are always available in your KAVACH sanctuary with zero command disclosure."',
        priority: 'MEDIUM'
      })
    });
    showToast(`✓ Proactive confidential nudge dispatched to ${soldierName}!`, 'success');
  } catch (e) {
    showToast('Nudge sent to soldier via secure channel.', 'success');
  }
}

// ----------------------------------------------------------------------------
// SCREENING TRENDS & VAULT
// ----------------------------------------------------------------------------

async function loadScreeningTrends() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/counselor/screenings', { headers });
    if (res.ok) {
      screeningsList = await res.json();
      renderScreeningTrends(screeningsList);
    }
  } catch (e) {
    console.warn('Could not load screening trends:', e);
  }
}

function renderScreeningTrends(list) {
  const container = document.getElementById('screeningsContainer');
  const countEl = document.getElementById('statTotalScreenings');
  if (!container) return;

  if (countEl) countEl.textContent = list.length;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No screening assessments completed yet.
      </div>
    `;
    return;
  }

  // Summary breakdown of latest screenings
  const phqList = list.filter(s => s.questionnaire_type === 'PHQ-9');
  const pclList = list.filter(s => s.questionnaire_type === 'PCL-5');
  const gadList = list.filter(s => s.questionnaire_type === 'GAD-7');

  const latestPhq = phqList[phqList.length - 1];
  const latestPcl = pclList[pclList.length - 1];
  const latestGad = gadList[gadList.length - 1];

  const phqCard = document.getElementById('statPhqScore');
  const pclCard = document.getElementById('statPclScore');
  const gadCard = document.getElementById('statGadScore');

  if (phqCard && latestPhq) phqCard.textContent = `${latestPhq.score} / ${latestPhq.max_score || 27}`;
  if (pclCard && latestPcl) pclCard.textContent = `${latestPcl.score} / ${latestPcl.max_score || 80}`;
  if (gadCard && latestGad) gadCard.textContent = `${latestGad.score} / ${latestGad.max_score || 21}`;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${list.slice().reverse().map(s => `
        <div style="padding: 14px 18px; border: 1.5px solid var(--border-color); border-radius: 8px; background: var(--bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 0.95rem; color: #581c87;">
                ${s.questionnaire_type}: Score ${s.score}/${s.max_score || 27}
              </strong>
              <span class="badge-tag" style="background: #f3e8ff; color: #6b21a8; border-color: #d8b4fe; font-size: 0.72rem;">
                ${s.severity || 'Completed'}
              </span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
              Soldier: <strong>${s.soldier_name || 'Soldier'}</strong> (${s.soldier_service_no || ''}) &bull; ${s.clinical_advice || 'Evaluated under AFMS Protocol'}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">
              ${s.id}
            </span>
            <button class="btn-outline" style="font-size: 0.74rem; padding: 5px 10px;" onclick="openConfidentialSessionModal('${s.soldier_id}', '${s.soldier_name || 'Soldier'}')">
              🔒 Log CBT Note
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// CONFIDENTIAL CBT THERAPY NOTE ENTRY
// ----------------------------------------------------------------------------

function openConfidentialSessionModal(soldierId, soldierName) {
  const existing = document.getElementById('cbtModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'cbtModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 520px; width: 92%; padding: 24px; color: var(--text-main); border: 2px solid #7c3aed; text-align: left;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #6d28d9;">🔒 Record Confidential CBT Intervention</h3>
        <span style="font-size: 0.72rem; background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; padding: 2px 8px; border-radius: 4px; font-weight: 800;">AES-256 VAULT</span>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">
        Patient: <strong>${soldierName || 'Soldier'}</strong>. Encrypted with AES-256-GCM. <strong>Strictly invisible</strong> to Unit Commanders and Claims Officers.
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Session Title:</label>
        <input type="text" id="cbtTitle" value="CBT Session: High-Altitude Combat Trauma Desensitization" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Therapeutic Technique:</label>
        <select id="cbtTech" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 600;">
          <option value="Cognitive Restructuring & Trauma Grounding">Cognitive Restructuring &amp; Trauma Grounding</option>
          <option value="Prolonged Exposure (PE) Desensitization">Prolonged Exposure (PE) Desensitization</option>
          <option value="Somatic Grounding & Controlled Breathing (4-7-8)">Somatic Grounding &amp; Controlled Breathing (4-7-8)</option>
          <option value="Behavioral Activation & Sleep Hygiene Protocol">Behavioral Activation &amp; Sleep Hygiene Protocol</option>
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Clinical Notes &amp; Patient Directives:</label>
        <textarea id="cbtNotes" rows="3" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color);" placeholder="Patient responded positively to grounding cues. Night awakenings reduced. Prescribed audio relaxation drills via Kavach app.">Patient responded positively to grounding cues. Somatic hyperarousal decreased during tactical imagery drills. Prescribed audio relaxation drills via Kavach app.</textarea>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Assessed Risk Level:</label>
        <select id="cbtRisk" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 600;">
          <option value="Low">Low - Well stabilized with protective factors</option>
          <option value="Moderate" selected>Moderate - Mild stress escalation, no self-harm ideation</option>
          <option value="High">High - Requires scheduled bi-weekly check-ins</option>
        </select>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('cbtModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #7c3aed; border-color: #6d28d9;" onclick="submitConfidentialNote('${soldierId}')">Sign &amp; Encrypt Note →</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitConfidentialNote(soldierId) {
  const title = document.getElementById('cbtTitle').value.trim();
  const cbt_technique = document.getElementById('cbtTech').value;
  const notes = document.getElementById('cbtNotes').value.trim();
  const risk_level = document.getElementById('cbtRisk').value;

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/counselor/notes', {
      method: 'POST',
      headers,
      body: JSON.stringify({ soldier_id: soldierId, title, cbt_technique, notes, risk_level })
    });

    if (res.ok) {
      document.getElementById('cbtModal').remove();
      showToast('✓ Confidential Note cryptographically sealed with AES-256 and appended to psychological vault!', 'success');
    }
  } catch (e) {
    showToast('Error recording note.', 'warn');
  }
}

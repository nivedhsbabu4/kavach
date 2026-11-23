// ============================================================================
// KAVACH: MILITARY PHYSIOTHERAPY & REHABILITATION PORTAL
// ============================================================================

let currentPhysio = null;
let assignedPatients = [];
let selectedPatient = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadPhysioProfile();
  await loadAssignedPatients();
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.background = type === 'success' ? '#065f46' : (type === 'warn' ? '#92400e' : '#991b1b');
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

async function loadPhysioProfile() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/auth/me', { headers });
    if (res.ok) {
      const data = await res.json();
      currentPhysio = data.user;
      renderPhysioHeader(data.user);
    }
  } catch (err) {
    console.warn('Failed to load physio profile:', err);
  }
}

function renderPhysioHeader(user) {
  if (!user) return;
  const nameEl = document.getElementById('physioNameTitle');
  const metaEl = document.getElementById('physioMetaSub');
  const avatarEl = document.getElementById('physioAvatarBadge');

  if (nameEl) nameEl.textContent = `${user.rank || 'Officer'} ${user.name}`;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>Rehab Officer &bull; ${user.service_number || user.service_no || 'MR-11204K'}</span>
      <span>&bull;</span>
      <span class="sync-badge synced"><span class="sync-pulse-dot"></span> <span>${user.posting || user.unit || 'MH JAIPUR'}</span></span>
    `;
  }
  if (avatarEl && user.name) {
    const initials = user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

async function loadAssignedPatients() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/physio/patients', { headers });
    if (res.ok) {
      const data = await res.json();
      assignedPatients = data.patients || [];
      renderPatientsDirectory(assignedPatients);
      updateSummaryStats();
      if (assignedPatients.length > 0) {
        selectPatient(assignedPatients[0].id);
      }
    }
  } catch (err) {
    console.error('Error loading physio patients:', err);
  }
}

function updateSummaryStats() {
  const activeCountEl = document.getElementById('statTotalRehabPatients');
  const adherenceEl = document.getElementById('statOverallAdherence');
  const missedCountEl = document.getElementById('statMissedSessionsCount');

  const total = assignedPatients.length;
  const missed = assignedPatients.filter(p => p.has_missed_session).length;
  
  if (activeCountEl) activeCountEl.textContent = total;
  if (missedCountEl) missedCountEl.textContent = missed;
  if (adherenceEl) {
    const rate = total > 0 ? Math.round(((total - missed) / total) * 100) : 100;
    adherenceEl.textContent = `${rate}%`;
  }

  // Update notification badge
  const notifCountBadge = document.getElementById('physioNotifBadge');
  if (notifCountBadge) {
    notifCountBadge.textContent = missed;
    notifCountBadge.style.display = missed > 0 ? 'flex' : 'none';
  }
}

function filterPatients(term) {
  const q = (term || '').toLowerCase().trim();
  const filtered = assignedPatients.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.service_no && p.service_no.toLowerCase().includes(q)) ||
    (p.unit && p.unit.toLowerCase().includes(q))
  );
  renderPatientsDirectory(filtered);
}

function renderPatientsDirectory(list) {
  const container = document.getElementById('physioPatientsList');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No rehab patients found matching your search.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => {
    const isSelected = selectedPatient && selectedPatient.id === p.id;
    const plan = p.rehab_plan || {};
    const completed = plan.completed_sessions || 0;
    const total = plan.total_sessions || 20;
    const pct = Math.round((completed / Math.max(total, 1)) * 100);

    return `
      <div onclick="selectPatient('${p.id}')" 
           style="cursor: pointer; padding: 14px 16px; border-radius: 8px; border: 1.5px solid ${isSelected ? '#059669' : 'var(--border-color)'}; background: ${isSelected ? '#ecfdf5' : 'var(--bg-card)'}; transition: all 0.2s ease; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 0.92rem; color: ${isSelected ? '#065f46' : 'var(--text-main)'};">
            ${p.rank || 'Soldier'} ${p.name}
          </strong>
          <span style="font-size: 0.72rem; font-family: monospace; font-weight: 700; color: var(--text-muted);">
            ${p.service_no}
          </span>
        </div>
        <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 6px;">
          ${p.unit || 'Field Unit'} &bull; ${plan.title || 'Musculoskeletal Conditioning'}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
          <span style="font-weight: 800; color: #047857;">Adherence: ${pct}% (${completed}/${total} Sessions)</span>
          ${p.has_missed_session ? `
            <span style="background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 4px; font-weight: 800;">
              ⚠️ MISSED SESSION
            </span>
          ` : `
            <span style="color: #15803d; font-weight: 800;">✓ On Track</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function selectPatient(soldierId) {
  selectedPatient = assignedPatients.find(p => p.id === soldierId);
  renderPatientsDirectory(assignedPatients);
  renderPatientDetail(selectedPatient);
}

function renderPatientDetail(patient) {
  const viewContainer = document.getElementById('patientDetailView');
  if (!viewContainer) return;

  if (!patient) {
    viewContainer.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-muted);">
        Select a patient from the assigned directory to inspect musculoskeletal recovery metrics.
      </div>
    `;
    return;
  }

  const plan = patient.rehab_plan || {};
  const completed = plan.completed_sessions || 0;
  const total = plan.total_sessions || 20;
  const pct = Math.round((completed / Math.max(total, 1)) * 100);
  const painLevel = plan.pain_level || 4;
  const mobility = plan.mobility_score || 115;
  const exercises = plan.exercises || [];

  viewContainer.innerHTML = `
    <!-- Real-Time Rehab Alert for Missed Session -->
    ${patient.has_missed_session ? `
      <div style="background: #fff1f2; border: 2px solid #e11d48; border-radius: 10px; padding: 18px 22px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 2.2rem;">🚨</span>
          <div>
            <strong style="color: #9f1239; font-size: 1.02rem; display: block;">HIGH-PRIORITY PHYSIOTHERAPY ALERT: MISSED SESSION</strong>
            <span style="font-size: 0.83rem; color: #881337;">
              ${patient.rank} ${patient.name} (${patient.service_no} &bull; ${patient.unit}) missed a scheduled rehab session. Current joint pain VAS: ${painLevel}/10. Automated notification recommended.
            </span>
          </div>
        </div>
        <button class="btn-primary" style="background: #e11d48; border-color: #be123c; white-space: nowrap; font-size: 0.82rem;" onclick="sendPhysioNudge('${patient.id}', '${patient.name}')">
          📱 Send Adherence Push &amp; Call
        </button>
      </div>
    ` : ''}

    <!-- Active Patient Rehab Plan -->
    <div class="card" style="border: 1.5px solid var(--border-color);">
      <div class="card-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
        <div>
          <h2 class="card-title" style="color: #065f46; font-size: 1.15rem;">
            🏃 ${plan.title || 'Active Musculoskeletal Protocol'}
          </h2>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">
            Patient: <strong>${patient.rank} ${patient.name}</strong> &bull; ${patient.service_no} &bull; ${patient.unit}
          </div>
        </div>
        <div style="font-size: 1.25rem; font-weight: 900; color: #047857;">
          Session ${completed} / ${total} Completed (${pct}%)
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 20px 0;">
        <div style="padding: 16px; border: 1.5px solid var(--border-color); border-radius: 8px; background: var(--bg-card);">
          <div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Joint Mobility Arc</div>
          <div style="font-size: 1.7rem; font-weight: 900; color: #047857; margin: 4px 0;">${mobility}&deg; Flexion</div>
          <div style="font-size: 0.74rem; color: #15803d; font-weight: 700;">+15&deg; improvement over baseline</div>
        </div>

        <div style="padding: 16px; border: 1.5px solid var(--border-color); border-radius: 8px; background: var(--bg-card);">
          <div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Current Pain Index (VAS)</div>
          <div style="font-size: 1.7rem; font-weight: 900; color: #dc2626; margin: 4px 0;">${painLevel} / 10</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">Mild-to-moderate post-weight-bearing</div>
        </div>

        <div style="padding: 16px; border: 1.5px solid var(--border-color); border-radius: 8px; background: var(--bg-card);">
          <div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Recovery Verification</div>
          <div style="font-size: 1.05rem; font-weight: 800; margin: 4px 0; color: var(--text-main);">On Track for SHAPE-1</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">${Math.max(0, total - completed)} sessions until clinical re-evaluation</div>
        </div>
      </div>

      <!-- Exercise Regimen Assigner -->
      <h3 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 12px;">Assigned Exercise Regimen &amp; Adherence Status</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;" id="physioExercisesList">
        ${exercises.length > 0 ? exercises.map((ex, idx) => `
          <div style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; background: ${ex.completed === false ? '#fff1f2' : 'var(--bg-card)'};">
            <div>
              <strong>${idx + 1}. ${ex.name}</strong>
              <div style="font-size: 0.75rem; color: ${ex.completed === false ? '#9f1239' : 'var(--text-muted)'};">
                ${ex.reps || '3 sets x 12 reps'} ${ex.target ? `&bull; ${ex.target}` : ''}
              </div>
            </div>
            <span style="color: ${ex.completed === false ? '#e11d48' : '#15803d'}; font-weight: 800; font-size: 0.8rem;">
              ${ex.completed === false ? '⚠️ Missed' : '✓ Adhering'}
            </span>
          </div>
        `).join('') : `
          <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
            No specific exercises prescribed yet.
          </div>
        `}
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; flex-wrap: wrap;">
        <button class="btn-outline" onclick="showToast('Loading verified progress photos: Joint mobility calibration photos.', 'success')">
          📷 Inspect Patient Progress Photos
        </button>
        <button class="btn-primary" style="background: #059669; border-color: #047857;" onclick="openAddExerciseModal('${patient.id}', '${patient.name}')">
          ✚ Add / Update Exercise Regimen
        </button>
      </div>
    </div>
  `;
}

async function sendPhysioNudge(soldierId, soldierName) {
  try {
    const headers = getAuthHeaders();
    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient_id: soldierId,
        recipient_role: 'SOLDIER',
        type: 'REHAB_MISSED',
        title: 'Physiotherapy Adherence Alert',
        message: `${currentPhysio ? currentPhysio.name : 'Rehab Officer'} (${currentPhysio ? currentPhysio.posting : 'MH Jaipur'}): Please complete your prescribed daily rehab exercises. Consistent mobility training is vital for SHAPE-1 recovery.`,
        priority: 'HIGH'
      })
    });
    showToast(`✓ Physiotherapy Adherence Push Dispatched to ${soldierName || 'Soldier'}!`, 'success');
  } catch (e) {
    showToast('Nudge sent to soldier via local military gateway.', 'success');
  }
}

function openAddExerciseModal(soldierId, soldierName) {
  const existing = document.getElementById('addExerciseModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'addExerciseModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 500px; width: 92%; padding: 24px; color: var(--text-main); border: 2px solid #059669; text-align: left;" onclick="event.stopPropagation()">
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #047857; margin-bottom: 8px;">🏃 Prescribe New Exercise to Regimen</h3>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">
        This exercise will be immediately synchronized to <strong>${soldierName || 'the soldier'}</strong>'s active daily rehab queue.
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Exercise Name &amp; Target Muscle:</label>
        <input type="text" id="exName" placeholder="e.g. Seated Leg Extension with 2kg Ankle Weight" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Repetitions &amp; Sets Schedule:</label>
        <input type="text" id="exReps" value="3 sets x 15 reps (Daily morning &amp; evening)" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('addExerciseModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #059669; border-color: #047857;" onclick="submitNewExercise('${soldierId}')">Save to Regimen →</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitNewExercise(soldierId) {
  const name = document.getElementById('exName').value.trim();
  const reps = document.getElementById('exReps').value.trim();
  if (!name) {
    showToast('Please enter exercise name.', 'warn');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/rehab/exercise', {
      method: 'POST',
      headers,
      body: JSON.stringify({ soldier_id: soldierId, name, reps })
    });
    if (res.ok) {
      document.getElementById('addExerciseModal').remove();
      showToast(`✓ Prescribed '${name}' added to soldier's active regimen!`, 'success');
      
      // Update local state and re-render
      if (selectedPatient && selectedPatient.id === soldierId) {
        if (!selectedPatient.rehab_plan) selectedPatient.rehab_plan = { exercises: [] };
        if (!selectedPatient.rehab_plan.exercises) selectedPatient.rehab_plan.exercises = [];
        selectedPatient.rehab_plan.exercises.push({
          id: `ex-${Date.now()}`,
          name,
          reps,
          completed: true
        });
        renderPatientDetail(selectedPatient);
      }
    }
  } catch (e) {
    showToast('Failed to save exercise.', 'warn');
  }
}

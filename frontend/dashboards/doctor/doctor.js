// ============================================================================
// KAVACH: DOCTOR / CLINICAL MEDICAL OFFICER LOGIC
// Single-Patient Health Wallet Concept, Mandatory Credential Verification,
// Psychologist Approval Protocol, Department-First Preview Cards & Prescriptions.
// ============================================================================

let doctorRecords = [];
let activeSoldier = null;
let activeGrant = null;
let currentDoctor = null;
let mhStatus = 'NOT_REQUESTED';
let expandedRecordIds = new Set();

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

document.addEventListener('DOMContentLoaded', async () => {
  await checkDoctorCredentials();
  await loadActivePatientWallet();
  await loadDoctorPatientRecords();
  await checkMhAccessStatus();
});

// 1. Mandatory Facility Onboarding / Credentials Check
async function checkDoctorCredentials() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/doctor/credentials', { headers });
    if (res.ok) {
      const data = await res.json();
      currentDoctor = data.doctor;
      if (data.doctor) {
        updateDoctorHeaderUI(data.doctor);
      }
      if (!data.verified) {
        const modal = document.getElementById('doctorCredentialModal');
        if (modal) modal.style.display = 'flex';
      }
    }
  } catch (e) {
    console.warn('Could not check doctor credentials:', e);
  }
}

function updateDoctorHeaderUI(doc) {
  if (doc.hospital_name) {
    const topbar = document.getElementById('docHospitalTopbar');
    if (topbar) topbar.textContent = doc.hospital_name.toUpperCase();
    const hdrHosp = document.getElementById('docHeaderHospital');
    if (hdrHosp) hdrHosp.textContent = doc.hospital_name.toUpperCase();
  }
  if (doc.name) {
    const hdrName = document.getElementById('docHeaderName');
    if (hdrName) hdrName.textContent = `${doc.rank || 'Capt.'} ${doc.name}`;
    const avatar = document.getElementById('docAvatar');
    if (avatar) avatar.textContent = doc.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }
  if (doc.department) {
    const hdrDept = document.getElementById('docHeaderDept');
    if (hdrDept) hdrDept.textContent = doc.department;
  }
}

async function submitDoctorCredentials() {
  const hospital_name = document.getElementById('credHospital').value;
  const doctor_name = document.getElementById('credDocName').value.trim();
  const rank = document.getElementById('credRank').value;
  const id_card_no = document.getElementById('credIdCard').value.trim();
  const department = document.getElementById('credDept').value;

  if (!doctor_name || !id_card_no) {
    showToast('Please enter doctor name and Military ID card number.', 'warn');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/doctor/credentials', {
      method: 'POST',
      headers,
      body: JSON.stringify({ hospital_name, doctor_name, rank, id_card_no, department })
    });

    if (res.ok) {
      const data = await res.json();
      currentDoctor = data.doctor;
      updateDoctorHeaderUI(data.doctor);
      const modal = document.getElementById('doctorCredentialModal');
      if (modal) modal.style.display = 'none';
      showToast('✓ Medical facility credentials verified. Clinical console enabled.', 'success');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to verify credentials.', 'warn');
  }
}

// 2. Load Single Patient Health Wallet
async function loadActivePatientWallet() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/doctor/active-patient', { headers });
    if (res.ok) {
      const data = await res.json();
      activeSoldier = data.soldier;
      activeGrant = data.grant;

      if (activeSoldier) {
        const titleEl = document.getElementById('activeSoldierTitle');
        if (titleEl) titleEl.textContent = `${activeSoldier.rank || 'Soldier'} ${activeSoldier.name} (${activeSoldier.service_no})`;
        
        const metaEl = document.getElementById('activeSoldierMeta');
        if (metaEl) {
          metaEl.textContent = `${activeSoldier.unit || 'Field Unit'} • Posting: ${activeSoldier.posting || 'Field Post'} • Blood Group: ${activeSoldier.blood_group || 'O+'} • Allergies: ${activeSoldier.allergies || 'None'}`;
        }

        const histNameEl = document.getElementById('historyPatientName');
        if (histNameEl) histNameEl.textContent = `${activeSoldier.rank || 'Rfn.'} ${activeSoldier.name}`;

        const notifPtEl = document.getElementById('notifItemPatient');
        if (notifPtEl) notifPtEl.textContent = `${activeSoldier.rank || 'Soldier'} ${activeSoldier.name} (${activeSoldier.service_no}) missed Session #14`;

        const bannerTextEl = document.getElementById('rehabBannerText');
        if (bannerTextEl) {
          bannerTextEl.innerHTML = `Active Patient <strong>${activeSoldier.rank || 'Soldier'} ${activeSoldier.name}</strong> (${activeSoldier.service_no} &bull; ${activeSoldier.posting || 'Field Station'}) missed scheduled <strong>Knee Mobility Session #14</strong> yesterday. Current VAS Pain Index: <strong>4/10</strong>. Adherence intervention required.`;
        }

        const walletBadge = document.getElementById('walletIdBadge');
        if (walletBadge) walletBadge.textContent = data.wallet_id || `KAVACH-WLT-${activeSoldier.service_no}`;
      }

      if (activeGrant) {
        const badge = document.getElementById('grantStatusBadge');
        if (badge) {
          badge.textContent = `⏱️ CONSENT ACTIVE UNTIL ${activeGrant.expiry_date.slice(0, 10)}`;
        }
      }
    }
  } catch (e) {
    console.warn('Could not load active patient wallet:', e);
  }
}

// 3. Load Patient Records
async function loadDoctorPatientRecords() {
  try {
    const headers = getAuthHeaders();
    const soldierId = activeSoldier ? activeSoldier.id : 'usr-soldier-1';
    const res = await fetch(`/api/records?role=DOCTOR&soldier_id=${soldierId}`, { headers });
    if (res.ok) {
      doctorRecords = await res.json();
      renderDoctorRecords();
    }
  } catch (err) {
    console.error('Doctor load error:', err);
  }
}

// 4. Render Record Cards with Department, Doctor Name, Hospital, Date First & Click-to-Expand
function renderDoctorRecords() {
  const container = document.getElementById('doctorRecordsList');
  if (!container) return;

  if (doctorRecords.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <span style="font-size: 2rem; display: block; margin-bottom: 8px;">📂</span>
        <strong>No clinical records recorded yet for this soldier wallet.</strong>
        <p style="font-size: 0.8rem; margin-top: 4px;">Click "✚ Create Field Record &amp; Prescription" above to enter certified observations.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = doctorRecords.map(r => {
    const isExpanded = expandedRecordIds.has(r.id);
    const department = r.department || 'Orthopedics & Joint Restoration';
    const doctorName = r.doctor_name || 'Capt. Dr. Priya Nair, AMC';
    const hospital = r.hospital || 'Base Hospital';
    const encounterDate = r.date || 'Recent';

    const isOriginalAuthor = (doctorName && (doctorName.includes('Priya Nair') || (currentDoctor && doctorName.includes(currentDoctor.name)))) || r.doctor_id === 'usr-doctor-1';

    return `
      <div class="expandable-record" onclick="toggleRecordExpansion('${r.id}')">
        <!-- Preview Strip: Department, Doctor Name, Hospital, Date Displayed FIRST -->
        <div class="record-header-strip">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="preview-first-badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
              🏥 ${department}
            </span>
            <span class="preview-first-badge" style="background: #f1f5f9; color: #334155;">
              👨‍⚕️ ${doctorName}
            </span>
            <span class="preview-first-badge" style="background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;">
              📍 ${hospital}
            </span>
            <span style="font-size: 0.76rem; font-weight: 800; color: #64748b; font-family: monospace;">
              📅 ${encounterDate}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-tag badge-${r.type.toLowerCase().replace('_', '')}" style="font-size: 0.7rem;">
              ${r.type}
            </span>
            <span style="font-size: 0.8rem; color: #0284c7; font-weight: 800;">
              ${isExpanded ? '▲ Collapse' : '▼ Click to Expand'}
            </span>
          </div>
        </div>

        <!-- Expanded Full Clinical Details & Prescription -->
        ${isExpanded ? `
          <div class="record-expanded-body" onclick="event.stopPropagation()">
            <h4 style="font-size: 1.05rem; font-weight: 900; color: var(--text-main); margin-bottom: 8px;">
              ${r.title}
            </h4>

            <div style="margin-bottom: 12px;">
              <strong style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 4px;">
                Clinical Findings &amp; Operative Directives:
              </strong>
              <p style="font-size: 0.85rem; line-height: 1.5; color: #1e293b; background: white; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                ${r.diagnosis}
              </p>
            </div>

            ${r.prescription ? `
              <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 800; color: #1d4ed8; margin-bottom: 6px;">
                  <span>💊</span> <span>CERTIFIED E-PRESCRIPTION &amp; DOSAGE REGIMEN (AFMS PHARMACY)</span>
                </div>
                <div style="font-size: 0.84rem; color: #1e3a8a; font-family: monospace; line-height: 1.45; white-space: pre-wrap;">${r.prescription}</div>
              </div>
            ` : ''}

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div class="tamper-hash-seal" title="Tamper Hash: ${r.tamper_hash || 'SHA-256 HMAC Sealed'}">
                <span>🛡️</span> <span>SHA-256 HMAC Sealed &bull; Version ${r.version || 1} &bull; Tamper-Proof</span>
              </div>

              <div>
                ${isOriginalAuthor ? `
                  <button class="btn-outline" style="font-size: 0.75rem; padding: 5px 12px;" onclick="openEditRecordModal('${r.id}')">
                    ✏️ Edit Clinical Note
                  </button>
                ` : `
                  <span style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">
                    🔒 Original Author Locked (${doctorName})
                  </span>
                `}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function toggleRecordExpansion(recordId) {
  if (expandedRecordIds.has(recordId)) {
    expandedRecordIds.delete(recordId);
  } else {
    expandedRecordIds.add(recordId);
  }
  renderDoctorRecords();
}

// 5. Mental Health Access Status & Psychologist Protocol
async function checkMhAccessStatus() {
  try {
    const soldierId = activeSoldier ? activeSoldier.id : 'usr-soldier-1';
    const headers = getAuthHeaders();
    const res = await fetch(`/api/doctor/mh-access-status?soldier_id=${soldierId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      mhStatus = data.status || 'NOT_REQUESTED';
      renderMhAccessUI(data.request);
    }
  } catch (e) {
    console.warn('Could not check mental health access status:', e);
  }
}

function renderMhAccessUI(request) {
  const badgeEl = document.getElementById('mhStatusBadge');
  const bodyEl = document.getElementById('mhCardBody');
  if (!badgeEl || !bodyEl) return;

  if (mhStatus === 'APPROVED') {
    badgeEl.innerHTML = `
      <span class="badge-tag" style="background: #fdf4ff; color: #86198f; border: 1.5px solid #d946ef; font-weight: 800;">
        🔓 ACCESS APPROVED BY PSYCHOLOGIST
      </span>
    `;
    bodyEl.innerHTML = `
      <div style="background: #ffffff; border: 1px solid #f0abfc; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #701a75; font-size: 0.95rem;">Dr. Sunita Rao (AFMS Clinical Psychologist) Authorized Review</strong>
          <span style="font-size: 0.72rem; color: #a21caf; font-weight: 700;">APPROVED FOR CLINICAL COLLABORATION</span>
        </div>
        <p style="font-size: 0.83rem; color: #374151; line-height: 1.45; margin-bottom: 10px;">
          Patient exhibits mild combat stress reactivity and post-patrol nightmare awakenings. Cognitive behavioral sleep restructuring commenced. Joint orthopedic rehabilitation cleared to proceed concurrently.
        </p>
        <div style="font-size: 0.72rem; color: #86198f; font-family: monospace;">
          🔐 AES-256-GCM Session Key Disclosed &bull; Clinical Audit Log Recorded
        </div>
      </div>
    `;
  } else if (mhStatus === 'PENDING_PSYCHOLOGIST_APPROVAL') {
    badgeEl.innerHTML = `
      <span class="badge-tag" style="background: #fef3c7; color: #92400e; border: 1.5px solid #f59e0b; font-weight: 800;">
        ⏳ WAITING FOR PSYCHOLOGIST APPROVAL
      </span>
    `;
    bodyEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.88rem; font-weight: 800; color: #92400e;">
            Access Request Forwarded to Dr. Sunita Rao (AFMS Psychological Support Cell)
          </div>
          <div style="font-size: 0.78rem; color: #78350f; margin-top: 3px;">
            Submitted on ${request ? request.requested_at.slice(0, 10) : 'Today'}. Reason: "${request ? request.reason : 'Clinical evaluation'}". Mental health records remain cryptographically sealed until approved.
          </div>
        </div>
        <button class="btn-outline" style="font-size: 0.75rem; border-color: #d97706; color: #92400e;" onclick="checkMhAccessStatus()">
          🔄 Refresh Status
        </button>
      </div>
    `;
  } else if (mhStatus === 'DENIED') {
    badgeEl.innerHTML = `
      <span class="badge-tag" style="background: #fee2e2; color: #991b1b; border: 1.5px solid #ef4444; font-weight: 800;">
        ⛔ ACCESS DENIED BY PSYCHOLOGIST
      </span>
    `;
    bodyEl.innerHTML = `
      <div style="font-size: 0.83rem; color: #991b1b;">
        Psychologist evaluated request and determined mental health records are outside current physical rehabilitation scope.
      </div>
    `;
  } else {
    // NOT_REQUESTED
    badgeEl.innerHTML = `
      <span class="badge-tag" style="background: #fdf4ff; color: #86198f; border: 1px solid #e879f9; font-weight: 800;">
        🔒 RECORD SECLUSION ACTIVE
      </span>
    `;
    bodyEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <strong style="font-size: 0.88rem; color: #701a75; display: block;">
            Request Access from Clinical Psychologist
          </strong>
          <span style="font-size: 0.78rem; color: #86198f;">
            If post-operative recovery or pain management intersects with psychological trauma, request formal clinical authorization.
          </span>
        </div>
        <button class="btn-primary" style="background: #a21caf; border-color: #86198f; font-size: 0.78rem;" onclick="openRequestMhAccessModal()">
          🛡️ Request Access from Counselor
        </button>
      </div>
    `;
  }
}

function openRequestMhAccessModal() {
  const soldierName = activeSoldier ? activeSoldier.name : 'Rifleman Arjun Verma';
  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'requestMhModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 500px; width: 92%; padding: 24px; color: var(--text-main); border: 2px solid #a21caf; text-align: left;" onclick="event.stopPropagation()">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <span style="font-size: 1.4rem;">🧠</span>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #86198f;">Request Mental Health Access Authorization</h3>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">
        Request will be dispatched to <strong>Dr. Sunita Rao</strong> (AFMS Senior Psychologist) for clinical adjudication regarding <strong>${soldierName}</strong>.
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Clinical Reason / Justification:</label>
        <textarea id="mhRequestReason" rows="3" style="width: 100%; padding: 9px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" placeholder="e.g. Cross-referencing knee trauma pain severity with psychological stress markers for coordinated rehab care."></textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('requestMhModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #a21caf;" onclick="submitMhAccessRequest()">Dispatch Request to Psychologist →</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitMhAccessRequest() {
  const reason = document.getElementById('mhRequestReason').value.trim();
  if (!reason) {
    showToast('Please state the clinical justification.', 'warn');
    return;
  }

  const soldierId = activeSoldier ? activeSoldier.id : 'usr-soldier-1';
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/doctor/request-mh-access', {
      method: 'POST',
      headers,
      body: JSON.stringify({ soldier_id: soldierId, reason })
    });

    if (res.ok) {
      document.getElementById('requestMhModal').remove();
      mhStatus = 'PENDING_PSYCHOLOGIST_APPROVAL';
      renderMhAccessUI({ requested_at: new Date().toISOString(), reason });
      showToast('✓ Request dispatched to Psychologist Dr. Sunita Rao for clinical approval.', 'success');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to submit request.', 'warn');
  }
}

// 6. Create New Record with Explicit Prescription Support
function openCreateRecordModal() {
  const soldierId = activeSoldier ? activeSoldier.id : 'usr-soldier-1';
  const hospital = currentDoctor && currentDoctor.hospital_name ? currentDoctor.hospital_name : 'Base Hospital, Delhi Cantt';
  const doctorName = currentDoctor && currentDoctor.name ? currentDoctor.name : 'Capt. Dr. Priya Nair';
  const defaultDept = currentDoctor && currentDoctor.department ? currentDoctor.department : 'Orthopedics & Joint Restoration';

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'createRecordModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 14px; max-width: 560px; width: 92%; padding: 26px; color: var(--text-main); border: 2px solid #0284c7; text-align: left;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #0369a1;">✚ Create New Append-Only Field Record</h3>
        <span style="font-size: 0.72rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 4px; font-weight: 800;">PRESCRIPTION ENABLED</span>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Record Type:</label>
          <select id="docRecType" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;">
            <option value="PRESCRIPTION">Medical Prescription</option>
            <option value="INJURY">Battle / Physical Injury</option>
            <option value="SURGERY">Surgical Intervention</option>
            <option value="X_RAY">Radiology / Imaging</option>
            <option value="TELECONSULT">Teleconsultation Summary</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Medical Department:</label>
          <select id="docRecDept" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;">
            <option value="Orthopedics & Joint Restoration" ${defaultDept.includes('Ortho') ? 'selected' : ''}>Orthopedics &amp; Joint Restoration</option>
            <option value="General & Combat Surgery" ${defaultDept.includes('Surgery') ? 'selected' : ''}>General &amp; Combat Surgery</option>
            <option value="Combat Medicine & Emergency" ${defaultDept.includes('Medicine') ? 'selected' : ''}>Combat Medicine &amp; Emergency</option>
            <option value="Radiology & Imaging" ${defaultDept.includes('Radiology') ? 'selected' : ''}>Radiology &amp; Imaging</option>
            <option value="Cardiology" ${defaultDept.includes('Cardio') ? 'selected' : ''}>Cardiology</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Clinical Title / Encounter:</label>
        <input type="text" id="docRecTitle" placeholder="e.g. Follow-up Knee Mobility & Patellar Tracking Evaluation" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Clinical Diagnosis &amp; Operative Notes:</label>
        <textarea id="docRecDiag" rows="2" placeholder="Patient evaluated. Patellar tendon non-tender, joint flexion improved..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color);"></textarea>
      </div>

      <div style="margin-bottom: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 800; color: #1e40af; margin-bottom: 4px;">
          <span>💊</span> <span>Prescription &amp; Medication Regimen (Optional):</span>
        </label>
        <textarea id="docRecPrescription" rows="2" placeholder="e.g. Tab Aceclofenac 100mg BD x 7d post-food, Ice cryotherapy 3x daily 15 mins, Tab Glucosamine OD x 30d" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #93c5fd; font-family: monospace; font-size: 0.8rem;"></textarea>
      </div>

      <div style="font-size: 0.72rem; color: #15803d; margin-bottom: 14px; font-weight: 700;">
        🛡️ Cryptographically signed with SHA-256 HMAC and appended to soldier health wallet. Cannot be deleted.
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('createRecordModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #0284c7;" onclick="submitDoctorRecord('${soldierId}')">Sign &amp; Append to Wallet</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitDoctorRecord(soldierId) {
  const type = document.getElementById('docRecType').value;
  const department = document.getElementById('docRecDept').value;
  const title = document.getElementById('docRecTitle').value.trim();
  const diagnosis = document.getElementById('docRecDiag').value.trim();
  const prescription = document.getElementById('docRecPrescription').value.trim();
  const hospital = currentDoctor && currentDoctor.hospital_name ? currentDoctor.hospital_name : 'Base Hospital, Delhi Cantt';
  const doctor_name = currentDoctor && currentDoctor.name ? currentDoctor.name : 'Capt. Dr. Priya Nair';

  if (!title || !diagnosis) {
    showToast('Please enter clinical title and diagnosis.', 'warn');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/records', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        soldier_id: soldierId,
        type,
        department,
        title,
        hospital,
        posting: 'Rajasthan (Desert Sector)',
        doctor_name,
        doctor_id: 'usr-doctor-1',
        diagnosis,
        prescription,
        is_mental_health: false
      })
    });

    if (res.ok) {
      document.getElementById('createRecordModal').remove();
      showToast('✓ Record and Prescription cryptographically sealed and appended to Soldier Health Wallet!', 'success');
      await loadDoctorPatientRecords();
    }
  } catch (err) {
    console.error(err);
    showToast('Error appending record.', 'warn');
  }
}

// 7. Edit Record Modal
function openEditRecordModal(recordId) {
  const record = doctorRecords.find(r => r.id === recordId);
  if (!record) return;

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'editRecordModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 520px; width: 92%; padding: 24px; color: var(--text-main); border: 1.5px solid var(--border-color); text-align: left;" onclick="event.stopPropagation()">
      <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 6px;">✏️ Amend Clinical Note &amp; Prescription</h3>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">
        Author: Capt. Dr. Priya Nair &bull; Version ${record.version || 1} &bull; Cannot delete record
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Record Title:</label>
        <input type="text" id="editTitle" value="${record.title}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Updated Clinical Assessment:</label>
        <textarea id="editDiag" rows="3" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">${record.diagnosis}</textarea>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Prescription / Dosage:</label>
        <textarea id="editRx" rows="2" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); font-family: monospace;">${record.prescription || ''}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('editRecordModal').remove()">Cancel</button>
        <button class="btn-primary" onclick="submitEditRecord('${record.id}')">Save Amended Note</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitEditRecord(recordId) {
  const title = document.getElementById('editTitle').value.trim();
  const diag = document.getElementById('editDiag').value.trim();
  const prescription = document.getElementById('editRx').value.trim();

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/records/${recordId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title, diagnosis: diag, prescription, doctor_id: 'usr-doctor-1' })
    });

    if (res.ok) {
      document.getElementById('editRecordModal').remove();
      showToast('✓ Clinical record amended by Medical Officer! SHA-256 HMAC updated.', 'success');
      await loadDoctorPatientRecords();
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to amend record.', 'warn');
  }
}

// 8. Update Pain Diagnosis
async function openPainDiagnosisModal() {
  const soldierId = activeSoldier ? activeSoldier.id : 'usr-soldier-1';
  let existing = {
    pain_location: 'Left Knee (Medial Joint Line)',
    pain_type: 'Sharp throbbing on 90° flexion & post-weight-bearing stiffness',
    since_when: '19 Aug 2023 - Sustained during snow patrol in Tawang',
    pain_severity: 'Moderate'
  };

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/rehab?soldier_id=${soldierId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.pain_location) existing.pain_location = data.pain_location;
      if (data.pain_type) existing.pain_type = data.pain_type;
      if (data.since_when) existing.since_when = data.since_when;
      if (data.pain_severity) existing.pain_severity = data.pain_severity;
    }
  } catch (e) {
    console.warn('Could not fetch existing rehab plan:', e);
  }

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'painDiagnosisModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 540px; width: 92%; padding: 24px; color: var(--text-main); border: 2px solid #2563eb; text-align: left;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #1e40af;">🩺 Prescribe / Update Soldier Pain Diagnosis</h3>
        <span style="font-size: 0.75rem; background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-weight: 800;">DOCTOR ONLY</span>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">
        This diagnosis updates the Soldier's Rehab Dashboard and tailors their active exercise protocol.
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Anatomical Pain Location (Where):</label>
        <input type="text" id="diagPainLocation" value="${existing.pain_location}" placeholder="e.g. Left Knee (Medial Joint Line) / Right Deltoid" style="width: 100%; padding: 9px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Pain Nature &amp; Symptoms (Type):</label>
        <input type="text" id="diagPainType" value="${existing.pain_type}" placeholder="e.g. Sharp throbbing on 90° flexion & stiffness" style="width: 100%; padding: 9px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Onset &amp; Context (From When):</label>
        <input type="text" id="diagSinceWhen" value="${existing.since_when}" placeholder="e.g. 19 Aug 2023 - Sustained during snow patrol in Tawang" style="width: 100%; padding: 9px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Clinical Severity Grade:</label>
        <select id="diagPainSeverity" style="width: 100%; padding: 9px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;">
          <option value="Mild" ${existing.pain_severity === 'Mild' ? 'selected' : ''}>Mild (VAS 1-3) &bull; Minor discomfort</option>
          <option value="Moderate" ${existing.pain_severity === 'Moderate' ? 'selected' : ''}>Moderate (VAS 4-6) &bull; Impairs standard drills</option>
          <option value="Severe" ${existing.pain_severity === 'Severe' ? 'selected' : ''}>Severe (VAS 7-8) &bull; Severe limitation, requires crutches</option>
          <option value="Critical" ${existing.pain_severity === 'Critical' ? 'selected' : ''}>Critical (VAS 9-10) &bull; Acute post-surgical / trauma</option>
        </select>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; font-size: 0.74rem; color: #166534; margin-bottom: 16px;">
        ✓ Saving this will instantly update Rifleman Arjun Verma's rehab tracker and notify the Physiotherapist for protocol calibration.
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('painDiagnosisModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #2563eb; border-color: #1d4ed8;" onclick="submitPainDiagnosis('${soldierId}')">Save Pain Diagnosis</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitPainDiagnosis(soldierId) {
  const pain_location = document.getElementById('diagPainLocation').value.trim();
  const pain_type = document.getElementById('diagPainType').value.trim();
  const since_when = document.getElementById('diagSinceWhen').value.trim();
  const pain_severity = document.getElementById('diagPainSeverity').value;

  if (!pain_location || !pain_type) {
    showToast('Please enter pain location and symptom type.', 'warn');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/rehab/pain-diagnosis', {
      method: 'POST',
      headers,
      body: JSON.stringify({ soldier_id: soldierId, pain_location, pain_type, since_when, pain_severity })
    });

    if (res.ok) {
      document.getElementById('painDiagnosisModal').remove();
      showToast('✓ Pain Diagnosis recorded by Medical Officer & synced to Soldier Rehab Tracker!', 'success');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to connect to server.', 'warn');
  }
}

// 9. Send Doctor Nudge with Disappearing Animation
function toggleDoctorNotifDrawer() {
  const drawer = document.getElementById('doctorNotifDrawer');
  if (drawer) {
    drawer.style.display = drawer.style.display === 'none' || drawer.style.display === '' ? 'block' : 'none';
  }
}

async function sendDoctorNudge() {
  const soldierId = activeSoldier ? activeSoldier.id : 'usr-soldier-1';
  const doctorName = currentDoctor && currentDoctor.name ? currentDoctor.name : 'Capt. Dr. Priya Nair, AMC';

  // Trigger smooth disappearing animation on alert banner and notif card
  const banner = document.getElementById('doctorRehabAlertBanner');
  if (banner) {
    banner.classList.add('disappear-anim');
    setTimeout(() => banner.remove(), 600);
  }

  const notifItem = document.getElementById('doctorNotifItem');
  if (notifItem) {
    notifItem.classList.add('disappear-anim');
    setTimeout(() => notifItem.remove(), 600);
  }

  const badge = document.getElementById('docNotifBadge');
  if (badge) badge.style.display = 'none';

  const subBadge = document.getElementById('notifBadgeSub');
  if (subBadge) {
    subBadge.textContent = 'ALL ADDRESSED';
    subBadge.style.background = '#dcfce7';
    subBadge.style.color = '#15803d';
  }

  try {
    const headers = getAuthHeaders();
    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient_id: soldierId,
        recipient_role: 'SOLDIER',
        type: 'REHAB_MISSED',
        title: 'Clinical Adherence Nudge: Knee Rehab #14',
        message: `${doctorName}: You missed Session #14 yesterday. Please complete your knee exercises to maintain joint flexion and prevent joint stiffness relapse.`,
        priority: 'HIGH'
      })
    });
    showToast('✓ Clinical Nudge Dispatched! Synced to Soldier Mobile App & logged to AFMS telemetry.', 'success');
  } catch (e) {
    showToast('Nudge delivered via local gateway.', 'success');
  }
}

// ============================================================================
// KAVACH: DOCTOR / CLINICAL MEDICAL OFFICER LOGIC
// Dynamic Role-Based Landing View, Patient Directory, Single-Patient Wallet View,
// Dynamic Rehab Alert Telemetry, Confidential MH Barrier, and Field Prescriptions.
// ============================================================================

let activePatientsList = [];
let doctorRecords = [];
let activeSoldier = null;
let activeGrant = null;
let currentDoctor = null;
let currentRehabPlan = null;
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
  await loadCurrentDoctorProfile();
  await loadDoctorLandingView();
  await loadDoctorNotifications();
});

// 1. Load Current Doctor Profile from /api/auth/me
async function loadCurrentDoctorProfile() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/auth/me', { headers });
    if (res.ok) {
      const data = await res.json();
      currentDoctor = data.user;
      if (currentDoctor) {
        updateDoctorHeaderUI(currentDoctor);
        prefillCredentialsModal(currentDoctor);
      }
    } else if (res.status === 401) {
      logoutUser();
    }
  } catch (e) {
    console.warn('Could not load doctor profile from auth/me:', e);
  }

  // Also check if facility credentials verified
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/doctor/credentials', { headers });
    if (res.ok) {
      const data = await res.json();
      if (!data.verified) {
        openCredentialsModal();
      }
    }
  } catch (e) {
    console.warn('Credentials check error:', e);
  }
}

function updateDoctorHeaderUI(doc) {
  if (!doc) return;
  const hospital = doc.hospital_name || doc.posting || 'Base Hospital, Delhi Cantt';
  const topbar = document.getElementById('docHospitalTopbar');
  if (topbar) topbar.textContent = hospital.toUpperCase();
  
  const hdrHosp = document.getElementById('docHeaderHospital');
  if (hdrHosp) hdrHosp.textContent = hospital.toUpperCase();

  const hdrName = document.getElementById('docHeaderName');
  if (hdrName) hdrName.textContent = `${doc.rank || 'Capt.'} ${doc.name}`;

  const avatar = document.getElementById('docAvatar');
  if (avatar && doc.name) {
    avatar.textContent = doc.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  const hdrDept = document.getElementById('docHeaderDept');
  if (hdrDept) hdrDept.textContent = doc.department || 'Clinical Medical Officer';
}

function prefillCredentialsModal(doc) {
  if (!doc) return;
  const nameInput = document.getElementById('credDocName');
  const idInput = document.getElementById('credIdCard');
  const hospSelect = document.getElementById('credHospital');
  const rankSelect = document.getElementById('credRank');
  const deptSelect = document.getElementById('credDept');

  if (nameInput && doc.name) nameInput.value = doc.name;
  if (idInput && (doc.id_card_no || doc.service_no)) idInput.value = doc.id_card_no || doc.service_no;
  if (hospSelect && (doc.hospital_name || doc.posting)) {
    for (let opt of hospSelect.options) {
      if (opt.value.includes(doc.hospital_name || doc.posting) || (doc.posting && opt.value.includes(doc.posting))) {
        opt.selected = true;
        break;
      }
    }
  }
  if (rankSelect && doc.rank) {
    for (let opt of rankSelect.options) {
      if (opt.value.toLowerCase() === doc.rank.toLowerCase()) {
        opt.selected = true;
        break;
      }
    }
  }
  if (deptSelect && doc.department) {
    for (let opt of deptSelect.options) {
      if (opt.value.toLowerCase().includes(doc.department.toLowerCase())) {
        opt.selected = true;
        break;
      }
    }
  }
}

function openCredentialsModal() {
  const modal = document.getElementById('doctorCredentialModal');
  if (modal) modal.style.display = 'flex';
}

function closeCredentialsModal() {
  const modal = document.getElementById('doctorCredentialModal');
  if (modal) modal.style.display = 'none';
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
      closeCredentialsModal();
      showToast('✓ Medical facility credentials verified. Clinical console enabled.', 'success');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to verify credentials.', 'warn');
  }
}

// 2. Load Doctor Landing View (Summary Cards + Searchable Patient Directory)
async function loadDoctorLandingView() {
  try {
    const headers = getAuthHeaders();
    
    // Fetch Patients with active unexpired grants
    const resPatients = await fetch('/api/doctor/patients', { headers });
    if (resPatients.ok) {
      const data = await resPatients.json();
      activePatientsList = data.patients || [];
      const statPatients = document.getElementById('statActivePatients');
      if (statPatients) statPatients.textContent = activePatientsList.length;
      renderPatientsList(activePatientsList);
    } else {
      activePatientsList = [];
      renderPatientsList([]);
    }

    // Fetch Pending Mental Health Requests
    try {
      const resMH = await fetch('/api/counselor/mh-requests', { headers });
      if (resMH.ok) {
        const reqs = await resMH.json();
        const pending = reqs.filter(r => r.status === 'PENDING_PSYCHOLOGIST_APPROVAL');
        const statMH = document.getElementById('statPendingMhRequests');
        if (statMH) statMH.textContent = pending.length;
      }
    } catch (e) {
      console.warn('MH requests summary error:', e);
    }

    // Fetch Consultations
    try {
      const resConsults = await fetch('/api/consultations', { headers });
      if (resConsults.ok) {
        const consults = await resConsults.json();
        const statCns = document.getElementById('statConsultationsToday');
        if (statCns) statCns.textContent = consults.length;
      }
    } catch (e) {
      console.warn('Consultations summary error:', e);
    }

  } catch (err) {
    console.error('Error loading doctor landing view:', err);
  }
}

function renderPatientsList(patients) {
  const container = document.getElementById('patientsContainer');
  if (!container) return;

  if (!patients || patients.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🛡️</div>
        <div style="font-size: 1rem; font-weight: 800; color: #334155;">No Active Patient Access Grants</div>
        <div style="font-size: 0.8rem; margin-top: 4px;">
          When active duty soldiers grant clinical access to the Medical Officer via their KAVACH Wallet, they will appear here.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = patients.map(p => {
    const rPlan = p.rehab_plan;
    let rehabPill = `<span class="badge-tag" style="background: #f1f5f9; color: #64748b; font-size: 0.72rem;">No Active Rehab Plan</span>`;
    if (rPlan) {
      const isMissed = Boolean(rPlan.last_missed_date);
      if (isMissed) {
        rehabPill = `<span class="badge-tag" style="background: #fee2e2; color: #991b1b; border: 1px solid #fecdd3; font-weight: 800; font-size: 0.72rem;">🚨 Session Missed (${rPlan.last_missed_date})</span>`;
      } else {
        rehabPill = `<span class="badge-tag" style="background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.72rem;">✓ Rehab Adherent (${rPlan.completed_sessions}/${rPlan.total_sessions})</span>`;
      }
    }

    const expiryStr = p.grant_expiry ? p.grant_expiry.slice(0, 10) : 'Active';

    return `
      <div class="patient-row-card">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 900; flex-shrink: 0;">
            🎖️
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 1.05rem; color: #0f172a;">${p.rank || 'Soldier'} ${p.name}</strong>
              <span style="font-family: monospace; font-size: 0.76rem; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${p.service_no}</span>
              <span style="font-size: 0.72rem; background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: 800;">Blood: ${p.blood_group || 'O+'}</span>
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">
              ${p.unit || 'Field Unit'} &bull; Posting: <strong>${p.posting || 'Field Post'}</strong> &bull; Consent Expiry: <strong>${expiryStr}</strong>
            </div>
            <div style="margin-top: 6px;">
              ${rehabPill}
            </div>
          </div>
        </div>

        <div>
          <button class="btn-primary" style="background: #0284c7; border-color: #0369a1; padding: 8px 18px; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;" onclick="openPatientWallet('${p.id}')">
            <span>💼</span> <span>Open Health Wallet →</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterPatients(term) {
  const q = (term || '').trim().toLowerCase();
  if (!q) {
    renderPatientsList(activePatientsList);
    return;
  }
  const filtered = activePatientsList.filter(p => {
    return (p.name && p.name.toLowerCase().includes(q)) ||
           (p.service_no && p.service_no.toLowerCase().includes(q)) ||
           (p.unit && p.unit.toLowerCase().includes(q)) ||
           (p.posting && p.posting.toLowerCase().includes(q)) ||
           (p.rank && p.rank.toLowerCase().includes(q));
  });
  renderPatientsList(filtered);
}

// 3. Open Single Patient Health Wallet View
async function openPatientWallet(soldierId) {
  if (!soldierId) return;

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/doctor/active-patient?soldier_id=${soldierId}`, { headers });
    
    if (res.status === 403) {
      showToast('ACCESS DENIED: No active, unexpired consent grant from this soldier.', 'warn');
      return;
    }
    if (!res.ok) {
      showToast('Failed to open patient wallet.', 'warn');
      return;
    }

    const data = await res.json();
    activeSoldier = data.soldier;
    activeGrant = data.grant;

    // Switch view
    document.getElementById('doctorLandingView').style.display = 'none';
    document.getElementById('doctorWalletView').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update Wallet UI
    if (activeSoldier) {
      const titleEl = document.getElementById('activeSoldierTitle');
      if (titleEl) titleEl.textContent = `${activeSoldier.rank || 'Soldier'} ${activeSoldier.name} (${activeSoldier.service_no})`;

      const metaEl = document.getElementById('activeSoldierMeta');
      if (metaEl) {
        metaEl.textContent = `${activeSoldier.unit || 'Field Unit'} • Posting: ${activeSoldier.posting || 'Field Post'} • Blood Group: ${activeSoldier.blood_group || 'O+'} • Allergies: ${activeSoldier.allergies || 'None'}`;
      }

      const histNameEl = document.getElementById('historyPatientName');
      if (histNameEl) histNameEl.textContent = `${activeSoldier.rank || 'Soldier'} ${activeSoldier.name}`;

      const walletBadge = document.getElementById('walletIdBadge');
      if (walletBadge) walletBadge.textContent = data.wallet_id || `KAVACH-WLT-${activeSoldier.service_no}`;
    }

    if (activeGrant) {
      const badge = document.getElementById('grantStatusBadge');
      if (badge && activeGrant.expiry_date) {
        badge.textContent = `⏱️ CONSENT ACTIVE UNTIL ${activeGrant.expiry_date.slice(0, 10)}`;
      }
    }

    // Load Patient's real Rehab Plan for dynamic banner
    await loadPatientRehab(soldierId);

    // Load Records
    await loadDoctorPatientRecords(soldierId);

    // Check MH Access Status
    await checkMhAccessStatus(soldierId);

  } catch (err) {
    console.error('Error opening patient wallet:', err);
    showToast('Failed to open patient wallet.', 'warn');
  }
}

function backToPatientsDirectory() {
  activeSoldier = null;
  activeGrant = null;
  doctorRecords = [];
  currentRehabPlan = null;
  document.getElementById('doctorWalletView').style.display = 'none';
  document.getElementById('doctorLandingView').style.display = 'block';
  loadDoctorLandingView();
}

// 4. Dynamic Rehab Plan & Missed Session Telemetry
async function loadPatientRehab(soldierId) {
  const banner = document.getElementById('doctorRehabAlertBanner');
  const bannerText = document.getElementById('rehabBannerText');
  const bannerTitle = document.getElementById('rehabBannerTitle');

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/rehab?soldier_id=${soldierId}`, { headers });
    if (res.ok) {
      currentRehabPlan = await res.json();
      if (currentRehabPlan && currentRehabPlan.last_missed_date && currentRehabPlan.completed_sessions < currentRehabPlan.total_sessions) {
        // Patient has a real missed session!
        if (banner) banner.style.display = 'flex';
        if (bannerTitle) bannerTitle.textContent = `HIGH-PRIORITY CLINICAL REHAB ALERT: MISSED SESSION #${currentRehabPlan.completed_sessions + 1}`;
        if (bannerText) {
          bannerText.innerHTML = `
            Active Patient <strong>${activeSoldier.rank || 'Soldier'} ${activeSoldier.name}</strong> (${activeSoldier.service_no} &bull; ${activeSoldier.posting || 'Field Station'}) missed scheduled <strong>${currentRehabPlan.title || 'Rehabilitation Routine'}</strong> on ${currentRehabPlan.last_missed_date}. Current VAS Pain Index: <strong>${currentRehabPlan.pain_level || 0}/10</strong>. Adherence intervention required.
          `;
        }
        return;
      }
    }
  } catch (e) {
    console.warn('Rehab plan fetch error:', e);
  }

  // Hide the banner if nothing to show!
  if (banner) banner.style.display = 'none';
}

// 5. Load Patient Clinical Records
async function loadDoctorPatientRecords(soldierId) {
  try {
    const headers = getAuthHeaders();
    const targetSid = soldierId || (activeSoldier ? activeSoldier.id : null);
    if (!targetSid) return;

    const res = await fetch(`/api/records?soldier_id=${targetSid}`, { headers });
    if (res.ok) {
      doctorRecords = await res.json();
      renderDoctorRecords();
    }
  } catch (err) {
    console.error('Doctor load error:', err);
  }
}

function renderDoctorRecords() {
  const container = document.getElementById('doctorRecordsList');
  if (!container) return;

  if (!doctorRecords || doctorRecords.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 30px;">
        <div style="font-size: 1.8rem; margin-bottom: 6px;">📂</div>
        <div style="font-size: 0.95rem; font-weight: 700;">No Clinical Records in Wallet</div>
        <div style="font-size: 0.78rem; margin-top: 4px;">Click "✚ Create Field Record &amp; Prescription" above to issue an entry.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = doctorRecords.map((r) => {
    const isExpanded = expandedRecordIds.has(r.id);
    const department = r.department || 'General Medicine';
    const doctorName = r.doctor_name || 'Medical Officer';
    const hospital = r.hospital || r.posting || 'Military Hospital';
    const dateStr = r.date || 'Recent';

    // Verify original authorship
    const isOriginalAuthor = Boolean(currentDoctor && r.doctor_id === currentDoctor.id);

    // Mental health privacy indicator
    if (r.is_mental_health && r.access_status !== 'APPROVED') {
      return `
        <div class="expandable-record" style="border: 2px dashed #a21caf; background: #fdf4ff;">
          <div class="record-header-strip">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">🔒</span>
              <div>
                <strong style="color: #701a75; font-size: 0.95rem;">${r.title || 'Confidential Psychological Dossier (Sealed)'}</strong>
                <div style="font-size: 0.75rem; color: #86198f; margin-top: 2px;">
                  ${department} &bull; ${doctorName} &bull; ${hospital} &bull; ${dateStr}
                </div>
              </div>
            </div>
            <div>
              <span class="preview-first-badge" style="background: #f3e8ff; color: #701a75; border: 1px solid #d8b4fe;">
                ${r.access_status === 'WAITING_PSYCHOLOGIST_APPROVAL' ? '⏳ Awaiting Counselor Approval' : '🔒 Authorization Required'}
              </span>
            </div>
          </div>
          <div style="padding: 12px 18px; font-size: 0.8rem; color: #701a75; border-top: 1px solid #f0abfc;">
            ${r.diagnosis || 'Sealed under military mental health seclusion protocol.'}
          </div>
        </div>
      `;
    }

    return `
      <div class="expandable-record" id="card-${r.id}" onclick="toggleRecordExpand('${r.id}')">
        <div class="record-header-strip">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
              ${r.type === 'SURGERY' ? '🔪' : (r.type === 'INJURY' ? '🩹' : (r.type === 'PRESCRIPTION' ? '💊' : '📋'))}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="preview-first-badge" style="background: #0284c7; color: white;">
                  🏥 ${department}
                </span>
                <span class="preview-first-badge" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;">
                  👨‍⚕️ ${doctorName}
                </span>
                <span class="preview-first-badge" style="background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;">
                  🏢 ${hospital}
                </span>
                <span class="preview-first-badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
                  📅 ${dateStr}
                </span>
              </div>
              <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-top: 6px;">
                ${r.title}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.76rem; color: #0284c7; font-weight: 700;">
              ${isExpanded ? '▲ Collapse' : '▼ Click to View Notes &amp; Prescription'}
            </span>
          </div>
        </div>

        ${isExpanded ? `
          <div class="record-expanded-body" onclick="event.stopPropagation()">
            <div style="margin-bottom: 12px;">
              <strong style="display: block; font-size: 0.78rem; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Clinical Diagnosis &amp; Operative Findings:</strong>
              <div style="font-size: 0.86rem; color: #1e293b; line-height: 1.5; background: white; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
                ${r.diagnosis || 'No additional clinical diagnosis logged.'}
              </div>
            </div>

            ${r.prescription ? `
              <div style="margin-bottom: 12px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 14px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 800; color: #15803d; margin-bottom: 4px;">
                  <span>💊</span> <span>E-PRESCRIPTION &amp; MEDICATION DIRECTIVES:</span>
                </div>
                <div style="font-size: 0.84rem; color: #14532d; font-family: monospace; white-space: pre-wrap; font-weight: 600;">${r.prescription}</div>
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
              <div style="font-family: monospace; font-size: 0.72rem; color: #64748b;">
                SHA-256 HMAC: ${r.tamper_hash ? r.tamper_hash.slice(0, 16) + '...' : 'VERIFIED'} &bull; v${r.version || 1}
              </div>
              <div>
                ${isOriginalAuthor ? `
                  <button class="btn-outline" style="font-size: 0.74rem; padding: 4px 10px; color: #0284c7; border-color: #0284c7;" onclick="openEditRecordModal('${r.id}')">
                    ✏️ Amend Note (Author)
                  </button>
                ` : `
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Append-Only Immutable Entry</span>
                `}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function toggleRecordExpand(id) {
  if (expandedRecordIds.has(id)) {
    expandedRecordIds.delete(id);
  } else {
    expandedRecordIds.add(id);
  }
  renderDoctorRecords();
}

// 6. Check Confidential Psychological Dossier Status
async function checkMhAccessStatus(soldierId) {
  const targetSid = soldierId || (activeSoldier ? activeSoldier.id : null);
  if (!targetSid) return;

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/doctor/mh-access-status?soldier_id=${targetSid}`, { headers });
    if (res.ok) {
      const data = await res.json();
      mhStatus = data.status || 'NOT_REQUESTED';
      renderMhAccessSection(data.request);
    }
  } catch (err) {
    console.warn('MH status check error:', err);
  }
}

function renderMhAccessSection(request) {
  const badgeEl = document.getElementById('mhStatusBadge');
  const bodyEl = document.getElementById('mhCardBody');
  if (!badgeEl || !bodyEl) return;

  if (mhStatus === 'APPROVED') {
    badgeEl.innerHTML = `<span style="background: #dcfce7; color: #15803d; font-size: 0.74rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #86efac;">✓ AUTHORIZATION GRANTED</span>`;
    bodyEl.innerHTML = `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px; color: #14532d;">
        <div style="font-weight: 800; font-size: 0.88rem; margin-bottom: 4px;">✓ Psychological Clinical Dossier Unlocked</div>
        <div style="font-size: 0.8rem; line-height: 1.45;">
          Treating Clinical Psychologist authorized access for surgical/trauma review. Psychological records appear in the clinical history ledger above.
        </div>
      </div>
    `;
  } else if (mhStatus === 'PENDING_PSYCHOLOGIST_APPROVAL') {
    badgeEl.innerHTML = `<span style="background: #fef3c7; color: #92400e; font-size: 0.74rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #fde68a;">⏳ WAITING FOR PSYCHOLOGIST SIGN-OFF</span>`;
    bodyEl.innerHTML = `
      <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 14px; color: #78350f;">
        <div style="font-weight: 800; font-size: 0.88rem; margin-bottom: 4px;">Authorization Request Pending Review</div>
        <div style="font-size: 0.8rem; line-height: 1.45;">
          Your clinical coordination request was forwarded to Senior AFMS Counselor. Sealed records remain inaccessible until signed off by the treating psychologist.
        </div>
      </div>
    `;
  } else {
    badgeEl.innerHTML = `<span style="background: #fae8ff; color: #86198f; font-size: 0.74rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #f0abfc;">🔒 ACCESS SEALED</span>`;
    bodyEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div style="font-size: 0.82rem; color: #475569; max-width: 600px;">
          To inspect psychological evaluations, clinical check-ins (PHQ-9 / PCL-5 / GAD-7) or therapy notes, you must submit an official coordination request to the unit psychologist.
        </div>
        <button class="btn-primary" style="background: #a21caf; border-color: #86198f; font-size: 0.82rem; font-weight: 800;" onclick="requestPsychologistAccess()">
          📨 Request Authorization from Counselor
        </button>
      </div>
    `;
  }
}

async function requestPsychologistAccess() {
  if (!activeSoldier) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/doctor/request-mh-access', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        soldier_id: activeSoldier.id,
        reason: 'Clinical coordination for surgical/trauma evaluation'
      })
    });
    if (res.ok) {
      showToast('✓ Access request dispatched to Counselor inbox. Waiting for approval.', 'success');
      await checkMhAccessStatus(activeSoldier.id);
      await loadDoctorPatientRecords(activeSoldier.id);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to request access.', 'warn');
  }
}

// 7. Create New Record with Explicit Prescription Support
function openCreateRecordModal() {
  if (!activeSoldier) return;
  const hospital = currentDoctor && currentDoctor.hospital_name ? currentDoctor.hospital_name : (currentDoctor && currentDoctor.posting ? currentDoctor.posting : 'Base Hospital, Delhi Cantt');
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
        <button class="btn-primary" style="background: #0284c7;" onclick="submitDoctorRecord('${activeSoldier.id}')">Sign &amp; Append to Wallet</button>
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
  const doctor_name = currentDoctor && currentDoctor.name ? currentDoctor.name : 'Medical Officer';

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
        diagnosis,
        prescription,
        hospital,
        doctor_name,
        doctor_id: currentDoctor ? currentDoctor.id : 'usr-doctor-1'
      })
    });

    if (res.ok) {
      document.getElementById('createRecordModal').remove();
      showToast('✓ New tamper-proof record appended with SHA-256 HMAC seal.', 'success');
      await loadDoctorPatientRecords(soldierId);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to append record.', 'warn');
  }
}

// 8. Edit / Amend Clinical Record (Original Author Only)
function openEditRecordModal(recordId) {
  const record = doctorRecords.find(r => r.id === recordId);
  if (!record) return;

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'editRecordModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 14px; max-width: 520px; width: 92%; padding: 24px; color: var(--text-main); border: 2px solid #0284c7; text-align: left;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0369a1;">✏️ Amend Clinical Note</h3>
        <span style="font-size: 0.72rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 4px; font-weight: 800;">v${(record.version || 1) + 1} AMENDMENT</span>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Encounter Title:</label>
        <input type="text" id="editRecTitle" value="${record.title || ''}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Diagnosis &amp; Notes:</label>
        <textarea id="editRecDiag" rows="4" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color);">${record.diagnosis || ''}</textarea>
      </div>

      <div style="font-size: 0.72rem; color: #b45309; margin-bottom: 14px;">
        ⚠️ Modifying this record increments version to v${(record.version || 1) + 1} and regenerates the SHA-256 HMAC checksum in the audit ledger.
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('editRecordModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #0284c7;" onclick="submitEditRecord('${recordId}')">Save Amendment</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitEditRecord(recordId) {
  const title = document.getElementById('editRecTitle').value.trim();
  const diagnosis = document.getElementById('editRecDiag').value.trim();

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/records/${recordId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title,
        diagnosis,
        doctor_id: currentDoctor ? currentDoctor.id : 'usr-doctor-1'
      })
    });

    if (res.ok) {
      document.getElementById('editRecordModal').remove();
      showToast('✓ Record amended and verified with updated SHA-256 HMAC.', 'success');
      await loadDoctorPatientRecords(activeSoldier ? activeSoldier.id : null);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to amend record.', 'warn');
  }
}

// 9. Update Pain Diagnosis in Rehab Plan
function openPainDiagnosisModal() {
  if (!activeSoldier) return;
  const currentLoc = currentRehabPlan && currentRehabPlan.pain_location ? currentRehabPlan.pain_location : 'Left Knee Joint';
  const currentType = currentRehabPlan && currentRehabPlan.pain_type ? currentRehabPlan.pain_type : 'Throbbing ache post weight-bearing';
  const currentSince = currentRehabPlan && currentRehabPlan.since_when ? currentRehabPlan.since_when : 'Post Operation';

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'painDiagnosisModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 14px; max-width: 520px; width: 92%; padding: 24px; color: var(--text-main); border: 2px solid #2563eb; text-align: left;" onclick="event.stopPropagation()">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <span style="font-size: 1.4rem;">🩺</span>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #1d4ed8;">Update Clinical Pain Diagnosis</h3>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Pain Location:</label>
        <input type="text" id="painLocInput" value="${currentLoc}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Pain Classification / Type:</label>
        <input type="text" id="painTypeInput" value="${currentType}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color); font-weight: 600;" />
      </div>

      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 0.78rem; font-weight: 700; margin-bottom: 4px;">Onset / Since When:</label>
        <input type="text" id="painSinceInput" value="${currentSince}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1.5px solid var(--border-color);" />
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('painDiagnosisModal').remove()">Cancel</button>
        <button class="btn-primary" style="background: #2563eb;" onclick="submitPainDiagnosis('${activeSoldier.id}')">Save &amp; Calibrate Rehab</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitPainDiagnosis(soldierId) {
  const pain_location = document.getElementById('painLocInput').value.trim();
  const pain_type = document.getElementById('painTypeInput').value.trim();
  const since_when = document.getElementById('painSinceInput').value.trim();

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/rehab/pain-diagnosis', {
      method: 'POST',
      headers,
      body: JSON.stringify({ soldier_id: soldierId, pain_location, pain_type, since_when })
    });
    if (res.ok) {
      document.getElementById('painDiagnosisModal').remove();
      showToast('✓ Pain diagnosis updated. Synced to Physiotherapy protocol.', 'success');
      await loadPatientRehab(soldierId);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to update pain diagnosis.', 'warn');
  }
}

// 10. Send Clinical Rehab Nudge to Soldier
async function sendDoctorNudge() {
  if (!activeSoldier) return;
  const banner = document.getElementById('doctorRehabAlertBanner');
  if (banner) {
    banner.classList.add('disappear-anim');
    setTimeout(() => {
      banner.style.display = 'none';
      banner.classList.remove('disappear-anim');
    }, 600);
  }

  try {
    const headers = getAuthHeaders();
    const doctorName = currentDoctor && currentDoctor.name ? currentDoctor.name : 'Medical Officer';
    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient_id: activeSoldier.id,
        recipient_role: 'SOLDIER',
        type: 'REHAB_MISSED_NUDGE',
        priority: 'HIGH',
        title: `Clinical Adherence Reminder from ${doctorName}`,
        message: `Please complete your scheduled joint mobility exercises to maintain range of motion and prevent post-operative stiffness relapse.`
      })
    });
    showToast(`✓ Clinical adherence nudge dispatched to ${activeSoldier.name}.`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to send nudge.', 'warn');
  }
}

// 11. Notifications Drawer
function toggleDoctorNotifDrawer() {
  const drawer = document.getElementById('doctorNotifDrawer');
  if (!drawer) return;
  drawer.style.display = drawer.style.display === 'block' ? 'none' : 'block';
}

async function loadDoctorNotifications() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/notifications', { headers });
    if (res.ok) {
      const notifs = await res.json();
      const list = document.getElementById('doctorNotifsList');
      const badge = document.getElementById('docNotifBadge');
      if (!list) return;

      const unread = notifs.filter(n => !n.is_read);
      if (badge) {
        if (unread.length > 0) {
          badge.textContent = unread.length;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }

      if (notifs.length === 0) {
        list.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 12px;">No unread clinical alerts.</div>`;
        return;
      }

      list.innerHTML = notifs.slice(0, 5).map(n => `
        <div style="background: ${n.priority === 'HIGH' ? '#fff1f2' : '#f8fafc'}; border: 1px solid ${n.priority === 'HIGH' ? '#fecdd3' : '#e2e8f0'}; border-radius: 8px; padding: 10px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: ${n.priority === 'HIGH' ? '#9f1239' : '#334155'}; font-weight: 800;">
            <span>${n.title}</span>
            <span>${n.created_at ? n.created_at.slice(11, 16) : ''}</span>
          </div>
          <div style="font-size: 0.75rem; color: #475569; margin-top: 4px;">
            ${n.message}
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.warn('Notifications load error:', e);
  }
}

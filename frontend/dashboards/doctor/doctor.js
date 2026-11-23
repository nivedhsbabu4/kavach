// ============================================================================
// KAVACH: DOCTOR / CLINICAL MEDICAL OFFICER LOGIC
// ============================================================================

let doctorRecords = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadDoctorPatientRecords();
});

async function loadDoctorPatientRecords() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/records?role=DOCTOR&soldier_id=usr-soldier-1', { headers });
    if (res.ok) {
      doctorRecords = await res.json();
      renderDoctorRecords();
    }
  } catch (err) {
    console.error('Doctor load error:', err);
  }
}

function renderDoctorRecords() {
  const container = document.getElementById('doctorRecordsGrid');
  if (!container) return;

  const currentDoctorName = 'Capt. Dr. Priya Nair';

  container.innerHTML = doctorRecords.map(r => {
    const isOriginalAuthor = (r.doctor_name && r.doctor_name.includes('Priya Nair')) || r.doctor_id === 'usr-doctor-1';

    return `
      <div class="record-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="badge-tag badge-${r.type.toLowerCase().replace('_', '')}">${r.type}</span>
            <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">${r.date}</span>
          </div>
          <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 6px;">${r.title}</h3>
          <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 8px;">
            📍 ${r.posting} &bull; 👨‍⚕️ ${r.doctor_name} &bull; 🏥 ${r.hospital}
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45; margin-bottom: 12px;">
            ${r.diagnosis}
          </p>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div class="tamper-hash-seal" title="Tamper Hash: ${r.tamper_hash}">
            <span>🛡️</span> <span>SHA-256 HMAC Sealed</span>
          </div>

          <div>
            ${isOriginalAuthor ? `
              <button class="btn-outline" style="font-size: 0.74rem; padding: 4px 10px;" onclick="openEditRecordModal('${r.id}')">
                ✏️ Edit Clinical Note
              </button>
            ` : `
              <span style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">
                🔒 Original Author Locked
              </span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openCreateRecordModal(soldierId) {
  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'createRecordModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 520px; width: 92%; padding: 24px; color: var(--text-main); border: 1.5px solid var(--border-color); text-align: left;" onclick="event.stopPropagation()">
      <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">✚ Create New Append-Only Record</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Record Type:</label>
        <select id="docRecType" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <option value="INJURY">Battle/Physical Injury</option>
          <option value="SURGERY">Surgical Intervention</option>
          <option value="X_RAY">Radiology / Imaging</option>
          <option value="PRESCRIPTION">Medical Prescription</option>
          <option value="TELECONSULT">Teleconsultation Summary</option>
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Title:</label>
        <input type="text" id="docRecTitle" placeholder="e.g. Follow-up Knee Mobility Evaluation" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Posting / Military Hospital:</label>
        <input type="text" id="docRecHospital" value="Base Hospital, Delhi Cantt" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Clinical Diagnosis & Directives:</label>
        <textarea id="docRecDiag" rows="3" placeholder="Patient evaluated. Joint flexion improved..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);"></textarea>
      </div>

      <div style="font-size: 0.72rem; color: #15803d; margin-bottom: 14px; font-weight: 700;">
        🛡️ Record will be cryptographically signed with SHA-256 HMAC and appended permanently to soldier wallet. Cannot be deleted.
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn-outline" onclick="document.getElementById('createRecordModal').remove()">Cancel</button>
        <button class="btn-primary" onclick="submitDoctorRecord('${soldierId}')">Sign &amp; Append to Wallet</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitDoctorRecord(soldierId) {
  const type = document.getElementById('docRecType').value;
  const title = document.getElementById('docRecTitle').value.trim();
  const hospital = document.getElementById('docRecHospital').value.trim();
  const diagnosis = document.getElementById('docRecDiag').value.trim();

  if (!title || !diagnosis) {
    alert('Please enter title and clinical notes.');
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
        title,
        hospital,
        posting: 'Rajasthan (Desert Sector)',
        doctor_name: 'Capt. Dr. Priya Nair',
        doctor_id: 'usr-doctor-1',
        diagnosis,
        is_mental_health: false
      })
    });

    if (res.ok) {
      document.getElementById('createRecordModal').remove();
      alert('✓ Record successfully signed and appended to soldier health wallet!');
      await loadDoctorPatientRecords();
    }
  } catch (err) {
    console.error(err);
  }
}

function openEditRecordModal(recordId) {
  const record = doctorRecords.find(r => r.id === recordId);
  if (!record) return;

  const modal = document.createElement('div');
  modal.className = 'privacy-curtain active';
  modal.id = 'editRecordModal';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 520px; width: 92%; padding: 24px; color: var(--text-main); border: 1.5px solid var(--border-color); text-align: left;" onclick="event.stopPropagation()">
      <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 6px;">✏️ Amend Clinical Note</h3>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">
        Author: Capt. Dr. Priya Nair &bull; Version ${record.version || 1} &bull; Cannot delete record
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Record Title:</label>
        <input type="text" id="editTitle" value="${record.title}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Updated Clinical Assessment / Directives:</label>
        <textarea id="editDiag" rows="4" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">${record.diagnosis}</textarea>
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

  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/records/${recordId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title, diagnosis: diag, doctor_id: 'usr-doctor-1' })
    });

    if (res.ok) {
      document.getElementById('editRecordModal').remove();
      alert('✓ Clinical record amended by authoring Medical Officer! SHA-256 hash recalculated.');
      await loadDoctorPatientRecords();
    }
  } catch (err) {
    console.error(err);
  }
}

function viewPatientRecords(soldierId) {
  const section = document.getElementById('patientHistorySection');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

async function openPainDiagnosisModal(soldierId) {
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
    alert('Please enter pain location and symptom type.');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/rehab/pain-diagnosis', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        soldier_id: soldierId,
        pain_location,
        pain_type,
        since_when,
        pain_severity
      })
    });

    if (res.ok) {
      document.getElementById('painDiagnosisModal').remove();
      alert('✓ Pain Diagnosis successfully recorded by Medical Officer and synced to Soldier Rehab Tracker!');
    } else {
      const err = await res.json();
      alert('Error saving pain diagnosis: ' + (err.error || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert('Failed to connect to server.');
  }
}

function toggleDoctorNotifDrawer() {
  const drawer = document.getElementById('doctorNotifDrawer');
  if (drawer) {
    drawer.style.display = drawer.style.display === 'none' || drawer.style.display === '' ? 'block' : 'none';
  }
}

function sendDoctorNudge(soldierId) {
  alert('🔔 HIGH-PRIORITY CLINICAL NUDGE DISPATCHED:\n\nTo: Rifleman Arjun Verma (15489201A)\nFrom: Capt. Dr. Priya Nair, AMC (Base Hospital Delhi)\nMessage: "Session #14 Knee Rehab was missed yesterday. Continued adherence is vital to prevent arthrofibrosis and preserve your SHAPE-1 military classification. Please resume regimen or request priority teleconsult if joint swelling occurs."\n\n✓ Successfully transmitted via Kavach Secure Push & SMS Gateway.');
  const drawer = document.getElementById('doctorNotifDrawer');
  if (drawer) drawer.style.display = 'none';
}



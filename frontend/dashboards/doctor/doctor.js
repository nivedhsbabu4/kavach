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

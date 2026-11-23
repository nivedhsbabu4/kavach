// ============================================================================
// KAVACH: CLAIMS OFFICER / ECHS DISABILITY ADJUDICATION LOGIC
// ============================================================================

let currentOfficer = null;
let claimsList = [];
let selectedClaim = null;
let claimsRecords = [];
let currentGrantStatus = 'ACTIVE';

document.addEventListener('DOMContentLoaded', async () => {
  await loadClaimsProfile();
  await loadClaimsQueue();
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

async function loadClaimsProfile() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/auth/me', { headers });
    if (res.ok) {
      const data = await res.json();
      currentOfficer = data.user;
      renderOfficerHeader(data.user);
    }
  } catch (err) {
    console.warn('Failed to load claims officer profile:', err);
  }
}

function renderOfficerHeader(user) {
  if (!user) return;
  const nameEl = document.getElementById('claimsOfficerName');
  const metaEl = document.getElementById('claimsOfficerMeta');
  const avatarEl = document.getElementById('claimsOfficerAvatar');

  if (nameEl) nameEl.textContent = `${user.rank || 'Officer'} ${user.name}`;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>ECHS AG Branch &bull; ${user.service_number || user.service_no || 'IC-48291M'}</span>
      <span>&bull;</span>
      <span class="sync-badge synced"><span class="sync-pulse-dot"></span> <span>${user.posting || 'CENTRAL DISABILITY NODE'}</span></span>
    `;
  }
  if (avatarEl && user.name) {
    const initials = user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

async function loadClaimsQueue() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/claims', { headers });
    if (res.ok) {
      claimsList = await res.json();
      renderClaimsQueueList(claimsList);
      if (claimsList.length > 0) {
        selectClaim(claimsList[0].id);
      }
    }
  } catch (err) {
    console.error('Error loading claims queue:', err);
  }
}

function renderClaimsQueueList(list) {
  const container = document.getElementById('claimsQueueList');
  const countEl = document.getElementById('statTotalClaims');
  if (countEl) countEl.textContent = list.length;
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No active claims pending adjudication.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(c => {
    const isSelected = selectedClaim && selectedClaim.id === c.id;
    return `
      <div onclick="selectClaim('${c.id}')"
           style="cursor: pointer; padding: 12px 14px; border-radius: 8px; border: 1.5px solid ${isSelected ? '#d97706' : 'var(--border-color)'}; background: ${isSelected ? '#fffbeb' : 'var(--bg-card)'}; transition: all 0.2s ease; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <strong style="font-size: 0.9rem; color: ${isSelected ? '#92400e' : 'var(--text-main)'};">
            ${c.soldier_rank || 'Rfn.'} ${c.soldier_name || 'Soldier'}
          </strong>
          <span style="font-size: 0.7rem; font-family: monospace; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-weight: 800;">
            ${c.id}
          </span>
        </div>
        <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 5px;">
          ${c.title || 'Disability Claim'}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
          <span style="font-weight: 800; color: #b45309;">Stage ${c.current_stage || 1} / 5</span>
          <span class="badge-tag" style="font-size: 0.68rem; background: ${c.grant_status === 'ACTIVE' ? '#dcfce7' : '#fee2e2'}; color: ${c.grant_status === 'ACTIVE' ? '#15803d' : '#991b1b'}; border-color: transparent;">
            ${c.grant_status === 'ACTIVE' ? 'CONSENT ACTIVE' : 'REVOKED'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

async function selectClaim(claimId) {
  selectedClaim = claimsList.find(c => c.id === claimId);
  renderClaimsQueueList(claimsList);
  if (!selectedClaim) return;

  renderClaimHeader(selectedClaim);
  renderPipeline(selectedClaim);
  renderDisputes(selectedClaim);
  await loadClaimRecords(selectedClaim.soldier_id);
  await loadGrantStatus(selectedClaim.soldier_id);
}

function renderClaimHeader(claim) {
  const nameEl = document.getElementById('claimSoldierName');
  const unitEl = document.getElementById('claimSoldierUnit');
  const svcEl = document.getElementById('claimServiceNo');
  const titleEl = document.getElementById('claimTitleText');
  const metaEl = document.getElementById('claimMetaInfo');

  if (nameEl) nameEl.textContent = `${claim.soldier_rank || 'Rfn.'} ${claim.soldier_name || 'Soldier'}`;
  if (unitEl) unitEl.textContent = claim.soldier_unit || '14 RAJPUTANA RIFLES';
  if (svcEl) svcEl.textContent = claim.soldier_service_no || '15489201A';
  if (titleEl) titleEl.textContent = claim.title || 'Disability Compensation Claim';
  if (metaEl) {
    metaEl.innerHTML = `
      Claim ID: <strong>${claim.id}</strong> &bull; Adjudication Officer: ${currentOfficer ? currentOfficer.name : 'Col. V.K. Singh (Retd)'} &bull; Attributable to Active Military Service
    `;
  }
}

async function loadClaimRecords(soldierId) {
  if (!soldierId) return;
  try {
    const headers = getAuthHeaders();
    // Strictly physical records - if mental health requested, server returns 403
    const res = await fetch(`/api/records?soldier_id=${soldierId}`, { headers });
    if (res.ok) {
      claimsRecords = await res.json();
      renderClaimsRecords();
    } else if (res.status === 403) {
      renderRevokedNotice('Access Denied: Grant has been revoked or requires active patient consent.');
    }
  } catch (err) {
    console.error('Error loading claims records:', err);
  }
}

async function loadGrantStatus(soldierId) {
  if (!soldierId) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/access-grants?soldier_id=${soldierId}`, { headers });
    if (res.ok) {
      const grants = await res.json();
      const claimsGrant = grants.find(g => g.granted_to_role === 'CLAIMS_OFFICER');
      if (claimsGrant) {
        currentGrantStatus = claimsGrant.status;
        updateGrantUI(claimsGrant.status, claimsGrant.expiry_date);
      }
    }
  } catch (err) {
    console.warn('Grant status fetch error:', err);
  }
}

function updateGrantUI(status, expiry) {
  const pill = document.getElementById('grantStatusPill');
  const btn = document.getElementById('toggleGrantBtn');
  const expText = document.getElementById('grantExpiryText');
  const countBadge = document.getElementById('recordsCountBadge');

  if (expText && expiry) expText.textContent = `Exp: ${expiry}`;

  if (status === 'ACTIVE') {
    if (pill) {
      pill.textContent = 'ACTIVE CONSENT';
      pill.className = 'badge-tag badge-vaccine';
    }
    if (btn) {
      btn.textContent = '🔒 Revoke Access';
      btn.style.background = '#dc2626';
      btn.style.borderColor = '#b91c1c';
    }
    if (countBadge) countBadge.textContent = `${claimsRecords.length} EVIDENCE PROOFS VERIFIED`;
    renderClaimsRecords();
  } else {
    if (pill) {
      pill.textContent = 'ACCESS REVOKED';
      pill.className = 'badge-tag badge-injury';
    }
    if (btn) {
      btn.textContent = '🔓 Re-Grant Consent';
      btn.style.background = '#15803d';
      btn.style.borderColor = '#166534';
    }
    if (countBadge) countBadge.textContent = '0 PROOFS (ACCESS PAUSED)';
    renderRevokedNotice();
  }
}

async function handleToggleGrant() {
  if (!selectedClaim) return;
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/access-grants/toggle', {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: 'CLAIMS_OFFICER', soldier_id: selectedClaim.soldier_id })
    });
    if (res.ok) {
      const data = await res.json();
      currentGrantStatus = data.status;
      updateGrantUI(data.status, data.grant.expiry_date);
      showToast(
        data.status === 'ACTIVE' 
          ? '✓ Verification Access Granted! Physical service evidence unlocked.' 
          : '⚠️ Access Revoked. Sovereign privacy barrier active — records locked from claims view.',
        data.status === 'ACTIVE' ? 'success' : 'warn'
      );
      if (data.status === 'ACTIVE') {
        await loadClaimRecords(selectedClaim.soldier_id);
      }
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to toggle access grant.', 'warn');
  }
}

function renderClaimsRecords() {
  const container = document.getElementById('claimsRecordsGrid');
  if (!container) return;

  if (currentGrantStatus === 'REVOKED') {
    renderRevokedNotice();
    return;
  }

  // Strictly filter out any mental health records just in case
  const physicalRecords = claimsRecords.filter(r => !r.is_mental_health && r.type !== 'MENTAL_HEALTH');

  if (physicalRecords.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">
        No physical injury or battle records found for this personnel.
      </div>
    `;
    return;
  }

  container.innerHTML = physicalRecords.map(r => `
    <div class="record-card">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="badge-tag badge-${r.type ? r.type.toLowerCase().replace('_', '') : 'general'}">${r.type || 'CLINICAL'}</span>
          <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">${r.date || 'Verified'}</span>
        </div>
        <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 6px;">${r.title}</h3>
        <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 8px;">
          📍 Posting: ${r.posting || 'Field Unit'} &bull; Attending: ${r.doctor_name || 'Medical Officer'}
        </div>
        <p style="font-size: 0.83rem; line-height: 1.45; margin-bottom: 12px;">
          ${r.diagnosis || 'Clinical evaluation completed and service connection established.'}
        </p>
      </div>

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div class="tamper-hash-seal" title="SHA-256 Checksum: ${r.tamper_hash || 'SHA256-VERIFIED'}">
          <span>🛡️</span> <span>SHA-256 Validated</span>
        </div>
        <span style="font-size: 0.74rem; color: #15803d; font-weight: 800;">
          ✓ Service Attributable
        </span>
      </div>
    </div>
  `).join('');
}

function renderRevokedNotice(customMsg) {
  const container = document.getElementById('claimsRecordsGrid');
  if (!container) return;
  container.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 32px 20px; text-align: center; background: #fff1f2; border: 1.5px dashed #f43f5e; border-radius: 12px; color: #9f1239;">
      <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🔒</span>
      <strong style="font-size: 1.05rem; display: block;">Sovereign Consent Revoked or Inactive</strong>
      <div style="font-size: 0.82rem; margin-top: 4px; color: #881337;">
        ${customMsg || 'The soldier has placed this verification grant on hold. Toggle the grant switch above to restore access under active consent.'}
      </div>
    </div>
  `;
}

function renderPipeline(claim) {
  const container = document.getElementById('claimsPipelineContainer');
  const btn = document.getElementById('btnAdvanceClaim');
  if (!container || !claim) return;

  const currentStage = claim.current_stage || 3;
  const stages = (claim.stages && claim.stages.length) ? claim.stages : [
    { id: 1, name: 'Claim Submitted', date: '10 Oct 2024', note: 'Service Records Verified' },
    { id: 2, name: 'Medical Board Assessment', date: '28 Oct 2024', note: 'Classified 40% Disability' },
    { id: 3, name: 'Disability Compensation Review', date: '01 Nov 2024', note: 'Proposed ₹18,500/mo Pension + Ex-gratia' },
    { id: 4, name: 'PCDA Sanction & Financial Clearance', date: 'Pending', note: 'Awaiting PCDA Allahabad Clearance' },
    { id: 5, name: 'Claim Sanctioned & Disbursed', date: 'Pending', note: 'PPO Issuance & Treasury Credit' }
  ];

  container.innerHTML = stages.map(stg => {
    const isCompleted = stg.completed || stg.id < currentStage;
    const isCurrent = stg.id === currentStage;

    let borderStyle = '1px dashed var(--border-color)';
    let bgStyle = 'var(--bg-card)';
    let statusColor = 'var(--text-muted)';
    let titleColor = 'var(--text-main)';
    let statusText = `STAGE ${stg.id} &bull; UPCOMING`;
    let shadow = 'none';

    if (isCurrent) {
      if (currentStage >= 5) {
        borderStyle = '2px solid #16a34a';
        bgStyle = '#f0fdf4';
        statusColor = '#15803d';
        titleColor = '#166534';
        statusText = `STAGE ${stg.id} &bull; SANCTIONED &amp; PPO ISSUED 🎉`;
        shadow = '0 4px 12px rgba(22, 163, 74, 0.2)';
      } else {
        borderStyle = '2px solid #d97706';
        bgStyle = '#fffbeb';
        statusColor = '#b45309';
        titleColor = '#92400e';
        statusText = `STAGE ${stg.id} &bull; ACTIVE IN PROCESS ⚡`;
        shadow = '0 3px 10px rgba(217, 119, 6, 0.2)';
      }
    } else if (isCompleted) {
      borderStyle = '1.5px solid #16a34a';
      bgStyle = '#f0fdf4';
      statusColor = '#166534';
      titleColor = '#15803d';
      statusText = `STAGE ${stg.id} &bull; COMPLETED ✓`;
    }

    return `
      <div style="padding: 12px; border-radius: 8px; border: ${borderStyle}; background: ${bgStyle}; box-shadow: ${shadow}; transition: all 0.3s ease;">
        <div style="font-size: 0.7rem; font-weight: 800; color: ${statusColor}; display: flex; justify-content: space-between; align-items: center;">
          <span>${statusText}</span>
          ${isCompleted ? '<span>✓</span>' : ''}
        </div>
        <div style="font-size: 0.9rem; font-weight: 800; color: ${titleColor}; margin-top: 3px;">${stg.name}</div>
        <div style="font-size: 0.74rem; color: ${statusColor}; margin-top: 3px; line-height: 1.35;">
          ${stg.date ? `<span style="font-weight: 700;">${stg.date}</span> &bull; ` : ''}${stg.note || ''}
        </div>
        ${stg.id === 5 && claim.ppo_number ? `
          <div style="margin-top: 6px; font-size: 0.72rem; font-family: monospace; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
            PPO: ${claim.ppo_number}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  if (btn) {
    if (currentStage === 3) {
      btn.style.display = 'inline-block';
      btn.disabled = false;
      btn.style.background = '#15803d';
      btn.style.borderColor = '#166534';
      btn.textContent = '✓ Sanction & Advance Claim to PCDA (Stage 4) →';
    } else if (currentStage === 4) {
      btn.style.display = 'inline-block';
      btn.disabled = false;
      btn.style.background = '#d97706';
      btn.style.borderColor = '#b45309';
      btn.textContent = '🏆 Formal PCDA Final Sanction & Issue PPO (Stage 5) →';
    } else if (currentStage >= 5) {
      btn.style.display = 'inline-block';
      btn.disabled = true;
      btn.style.background = '#065f46';
      btn.style.borderColor = '#047857';
      btn.textContent = `✓ Claim Fully Sanctioned (PPO: ${claim.ppo_number || 'Issued'})`;
    }
  }
}

async function handleAdvanceClaimStage() {
  if (!selectedClaim) return;
  const btn = document.getElementById('btnAdvanceClaim');
  const prevText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Processing Sanction & Dispatching Alerts...';
  }

  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/claims/advance', {
      method: 'POST',
      headers,
      body: JSON.stringify({ claim_id: selectedClaim.id })
    });

    if (res.ok) {
      const data = await res.json();
      selectedClaim = data.claim;
      // Update in claimsList
      const idx = claimsList.findIndex(c => c.id === selectedClaim.id);
      if (idx !== -1) claimsList[idx] = selectedClaim;
      renderPipeline(selectedClaim);
      renderClaimsQueueList(claimsList);
      showToast(`✓ Disability Claim advanced to Stage ${data.claim.current_stage}! Alert dispatched to Soldier Health Wallet. (PPO: ${data.ppo_number})`, 'success');
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to advance claim stage.', 'warn');
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText;
      }
    }
  } catch (err) {
    console.error('Error advancing claim:', err);
    showToast('Network error while advancing claim.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevText;
    }
  }
}
window.advanceClaimStage = handleAdvanceClaimStage;

function renderDisputes(claim) {
  const container = document.getElementById('claimsDisputeContainer');
  if (!container || !claim) return;
  if (claim.dispute_report || claim.has_dispute) {
    const d = claim.dispute_report || {};
    container.innerHTML = `
      <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 10px; padding: 14px; color: #92400e;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span> <span>SOLDIER GRIEVANCE / APPEAL DOSSIER FILED</span>
          </strong>
          <span style="font-size: 0.72rem; font-family: monospace; background: #fde68a; color: #78350f; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
            ${d.dispute_id || 'ECHS-DISP-2026-8812'}
          </span>
        </div>
        <div style="font-size: 0.82rem; font-weight: 700; margin-bottom: 4px;">Title: ${d.report_title || 'Disability Quantum Appeal'}</div>
        <div style="font-size: 0.78rem; line-height: 1.4; margin-bottom: 8px;"><strong>Reason:</strong> ${d.dispute_reason || 'Discrepancy in attributability percentage.'}</div>
        <div style="font-size: 0.74rem; color: #b45309; font-family: monospace;">Evidence Summary: ${d.evidence_summary || 'SHA-256 records referenced from personal Health Wallet.'}</div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
        <span>✓</span> <span>No active soldier appeals or grievances pending on this claim.</span>
      </div>
    `;
  }
}

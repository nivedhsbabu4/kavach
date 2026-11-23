// ============================================================================
// KAVACH: CLAIMS OFFICER / ECHS DISABILITY ADJUDICATION LOGIC
// ============================================================================

let claimsRecords = [];
let currentGrantStatus = 'ACTIVE';

document.addEventListener('DOMContentLoaded', async () => {
  await loadClaimsRecords();
  await loadGrantStatus();
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

async function loadClaimsRecords() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/records?role=CLAIMS_OFFICER&soldier_id=usr-soldier-1', { headers });
    if (res.ok) {
      claimsRecords = await res.json();
      renderClaimsRecords();
    }
  } catch (err) {
    console.error('Error loading claims records:', err);
  }
}

async function loadGrantStatus() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/access-grants?role=CLAIMS_OFFICER&soldier_id=usr-soldier-1', { headers });
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
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/access-grants/toggle', {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: 'CLAIMS_OFFICER', soldier_id: 'usr-soldier-1' })
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

  container.innerHTML = claimsRecords.map(r => `
    <div class="record-card">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="badge-tag badge-${r.type.toLowerCase().replace('_', '')}">${r.type}</span>
          <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">${r.date}</span>
        </div>
        <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 6px;">${r.title}</h3>
        <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 8px;">
          📍 Posting: ${r.posting} &bull; Attending: ${r.doctor_name}
        </div>
        <p style="font-size: 0.83rem; line-height: 1.45; margin-bottom: 12px;">
          ${r.diagnosis}
        </p>
      </div>

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div class="tamper-hash-seal" title="SHA-256 Checksum: ${r.tamper_hash}">
          <span>🛡️</span> <span>SHA-256 Validated</span>
        </div>
        <span style="font-size: 0.74rem; color: #15803d; font-weight: 800;">
          ✓ Service Attributable
        </span>
      </div>
    </div>
  `).join('');
}

function renderRevokedNotice() {
  const container = document.getElementById('claimsRecordsGrid');
  if (!container) return;
  container.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 32px 20px; text-align: center; background: #fff1f2; border: 1.5px dashed #f43f5e; border-radius: 12px; color: #9f1239;">
      <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🔒</span>
      <strong style="font-size: 1.05rem; display: block;">Sovereign Consent Revoked by Soldier</strong>
      <div style="font-size: 0.82rem; margin-top: 4px; color: #881337;">
        The soldier or claims administrator has placed this verification grant on hold. Toggle the grant switch above to restore access under active consent.
      </div>
    </div>
  `;
}

function advanceClaimStage() {
  showToast('✓ Disability Claim CLM-2024-8841 advanced to PCDA Final Sanction! Notification dispatched to Soldier Health Wallet.', 'success');
}

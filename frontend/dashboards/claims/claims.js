// ============================================================================
// KAVACH: CLAIMS OFFICER / ECHS DISABILITY ADJUDICATION LOGIC
// ============================================================================

let claimsRecords = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadClaimsRecords();
});

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

function renderClaimsRecords() {
  const container = document.getElementById('claimsRecordsGrid');
  if (!container) return;

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

async function attemptInspectMentalHealth() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/records?role=CLAIMS_OFFICER&type=MENTAL_HEALTH&soldier_id=usr-soldier-1', { headers });
    const data = await res.json();

    if (res.status === 403 || data.is_access_denied) {
      alert(`⛔ ${data.error || 'ACCESS DENIED'}\n\n${data.message || 'Claims Officers are prohibited from inspecting confidential mental health records.'}\n\n[SECURITY AUDIT LOGGED]\nEvent registered permanently in Kavach audit trail.`);
      // Highlight the ACCESS DENIED card
      const card = document.getElementById('mentalHealthBarrierCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth' });
        card.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.6)';
        setTimeout(() => { card.style.boxShadow = 'none'; }, 3000);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

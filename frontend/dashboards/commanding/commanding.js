// ============================================================================
// KAVACH: UNIT REGIMENTAL COMMAND & READINESS CONSOLE
// ============================================================================

let currentCO = null;
let unitReadiness = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCOProfile();
  await loadUnitReadiness();
});

async function loadCOProfile() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/auth/me', { headers });
    if (res.ok) {
      const data = await res.json();
      currentCO = data.user;
      renderCOHeader(data.user);
    }
  } catch (err) {
    console.warn('Failed to load CO profile:', err);
  }
}

function renderCOHeader(user) {
  if (!user) return;
  const nameEl = document.getElementById('coNameTitle');
  const metaEl = document.getElementById('coMetaSub');
  const avatarEl = document.getElementById('coAvatarBadge');
  const unitBadgeEl = document.getElementById('coUnitBadge');

  if (nameEl) nameEl.textContent = `${user.rank || 'Col.'} ${user.name}`;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>Commanding Officer &bull; ${user.service_number || user.service_no || 'IC-51920P'}</span>
      <span>&bull;</span>
      <span class="sync-badge synced"><span class="sync-pulse-dot"></span> <span>${user.unit || '14 RAJPUTANA RIFLES'}</span></span>
    `;
  }
  if (avatarEl && user.name) {
    const initials = user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
  if (unitBadgeEl) {
    unitBadgeEl.textContent = user.unit || '14 RAJPUTANA RIFLES';
  }
}

async function loadUnitReadiness() {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/commanding/readiness', { headers });
    if (res.ok) {
      unitReadiness = await res.json();
      renderReadinessData(unitReadiness);
    }
  } catch (err) {
    console.error('Error loading readiness data:', err);
  }
}

function renderReadinessData(data) {
  if (!data) return;

  const strengthEl = document.getElementById('statBattalionStrength');
  const shape1El = document.getElementById('statShape1Pct');
  const lmcEl = document.getElementById('statLmcCount');
  const prophEl = document.getElementById('statProphylaxisPct');
  const rehabCasesEl = document.getElementById('statRehabCases');
  const subUnitsContainer = document.getElementById('subUnitsContainer');

  if (strengthEl) strengthEl.textContent = `${data.battalion_strength} Jawans`;
  if (shape1El) shape1El.textContent = `${data.shape1_pct}% (${data.shape1_count} Fit)`;
  if (lmcEl) lmcEl.textContent = `${data.lmc_count} Jawans`;
  if (prophEl) prophEl.textContent = `${data.prophylaxis_pct}% Complete`;
  if (rehabCasesEl) rehabCasesEl.textContent = `${data.active_rehab_cases} Active`;

  if (subUnitsContainer && data.sub_units) {
    subUnitsContainer.innerHTML = data.sub_units.map(sub => `
      <div style="padding: 16px; border: 1.5px solid var(--border-color); border-radius: 8px; background: var(--bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="font-size: 0.95rem; color: #0f172a;">${sub.name}</strong>
            <span class="badge-tag" style="background: ${sub.status === 'COMBAT READY' ? '#dcfce7' : '#fef3c7'}; color: ${sub.status === 'COMBAT READY' ? '#15803d' : '#92400e'}; border-color: transparent; font-size: 0.7rem; font-weight: 800;">
              ${sub.status}
            </span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
            Effective Roster: <strong>${sub.strength} Personnel</strong> &bull; Attributable Non-Battle Casualties: 0
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="text-align: right;">
            <div style="font-size: 1.15rem; font-weight: 900; color: #1e293b;">${sub.shape1_pct}%</div>
            <div style="font-size: 0.72rem; color: #15803d; font-weight: 700;">SHAPE-1 Ratio</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

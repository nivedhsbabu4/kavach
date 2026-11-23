// ============================================================================
// KAVACH: Client-side Authentication, Role Verification & Database Registry
// ============================================================================

const DASHBOARD_ROUTES = {
  'SOLDIER': '../dashboards/soldier/soldier.html',
  'DOCTOR': '../dashboards/doctor/doctor.html',
  'PHYSIOTHERAPIST': '../dashboards/physio/physio.html',
  'COUNSELOR': '../dashboards/counselor/counselor.html',
  'CLAIMS_OFFICER': '../dashboards/claims/claims.html',
  'COMMANDING_OFFICER': '../dashboards/commanding/commanding.html'
};

const DEMO_CREDENTIALS = {
  'SOLDIER': '15489201A',
  'DOCTOR': 'MR-09824X',
  'PHYSIOTHERAPIST': 'MR-11204K',
  'COUNSELOR': 'CIV-PSY-042',
  'CLAIMS_OFFICER': 'IC-48291M',
  'COMMANDING_OFFICER': 'IC-51920P'
};

let allDatabaseUsers = [];

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const alertBox = document.getElementById('authAlert');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLoginBtn.classList.remove('active');
    tabRegisterBtn.classList.add('active');
    alertBox.style.display = 'none';
  }
}

function handleLoginRoleChange() {
  const selectedRole = document.getElementById('loginRole').value;
  const serviceNoInput = document.getElementById('loginServiceNo');
  
  // If user just registered with this role, retain their registered credentials
  if (window._justRegisteredServiceNo && selectedRole === window._justRegisteredRole) {
    serviceNoInput.value = window._justRegisteredServiceNo;
    return;
  }

  // Remove registered highlight if role manually changed
  clearRegisteredHighlights();
  if (DEMO_CREDENTIALS[selectedRole]) {
    serviceNoInput.value = DEMO_CREDENTIALS[selectedRole];
  }
}

function quickFillLogin(role, serviceNo) {
  clearRegisteredHighlights();
  window._justRegisteredServiceNo = null;
  window._justRegisteredRole = null;

  document.getElementById('loginRole').value = role;
  document.getElementById('loginServiceNo').value = serviceNo;
  document.getElementById('loginPassword').value = 'kavach123';
  showAlert(`Selected ${role} profile: ${serviceNo}. Click "AUTHENTICATE VIA JWT" to enter.`, 'success');
}

function clearRegisteredHighlights() {
  const svc = document.getElementById('loginServiceNo');
  const pwd = document.getElementById('loginPassword');
  if (svc) svc.classList.remove('input-registered-highlight');
  if (pwd) pwd.classList.remove('input-registered-highlight');
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('authAlert');
  if (!alertBox) return;
  alertBox.className = `auth-alert ${type}`;
  alertBox.innerHTML = message;
  alertBox.style.display = 'block';
}

// 1. Handle Login Submit
async function handleLoginSubmit(event) {
  event.preventDefault();
  const role = document.getElementById('loginRole').value;
  const serviceNo = document.getElementById('loginServiceNo').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const btn = document.getElementById('loginSubmitBtn');

  btn.disabled = true;
  btn.textContent = 'VERIFYING CREDENTIALS...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, service_no: serviceNo, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Authentication failed. Please verify credentials.', 'error');
      btn.disabled = false;
      btn.textContent = 'AUTHENTICATE VIA JWT →';
      return;
    }

    // Role Enforcement Check
    if (data.user.role !== role) {
      showAlert(`⛔ RBAC ACCESS REJECTED: Your account is registered as ${data.user.role}. You are not authorized to login to the ${role} terminal!`, 'error');
      btn.disabled = false;
      btn.textContent = 'AUTHENTICATE VIA JWT →';
      return;
    }

    // Store verified JWT and user profile
    localStorage.setItem('kavach_jwt_token', data.token);
    localStorage.setItem('kavach_user_role', data.user.role);
    localStorage.setItem('kavach_user_name', data.user.name);
    localStorage.setItem('kavach_user_service_no', data.user.service_no);
    localStorage.setItem('kavach_user_id', data.user.id);
    localStorage.setItem('kavach_user_posting', data.user.posting || 'Field Station');

    // Clean up temporary registration markers
    clearRegisteredHighlights();
    window._justRegisteredServiceNo = null;
    window._justRegisteredRole = null;

    showAlert(`✓ Access Granted! Welcome <strong>${data.user.name}</strong> (${data.user.service_no}). Opening your ${data.user.role} console...`, 'success');

    setTimeout(() => {
      window.location.href = DASHBOARD_ROUTES[data.user.role] || '../dashboards/soldier/soldier.html';
    }, 700);

  } catch (err) {
    console.error('Login error:', err);
    showAlert('Server connection error. Please ensure Kavach node is online.', 'error');
    btn.disabled = false;
    btn.textContent = 'AUTHENTICATE VIA JWT →';
  }
}

// 2. Handle Registration Submit
// Flow: Submits registration -> Redirects to Login Form -> Pre-fills registered details -> Ready to authenticate
async function handleRegisterSubmit(event) {
  event.preventDefault();
  const role = document.getElementById('regRole').value;
  const name = document.getElementById('regName').value.trim();
  const serviceNo = document.getElementById('regServiceNo').value.trim();
  const rank = document.getElementById('regRank').value.trim();
  const unit = document.getElementById('regUnit').value.trim();
  const blood = document.getElementById('regBlood').value;
  const branch = document.getElementById('regBranch').value;
  const password = document.getElementById('regPassword').value.trim();
  const posting = document.getElementById('regPosting') ? document.getElementById('regPosting').value.trim() : unit;
  const btn = document.getElementById('regSubmitBtn') || document.getElementById('registerSubmitBtn');

  if (!serviceNo || !name || !password) {
    showAlert('Please fill in all mandatory fields.', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'ENROLLING IN KAVACH NETWORK...';
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        name,
        service_no: serviceNo,
        rank,
        unit,
        posting: posting || unit,
        blood_group: blood,
        branch,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Registration failed. Service number may already be enrolled.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'REGISTER & INITIALIZE WALLET →';
      }
      return;
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'REGISTER & INITIALIZE WALLET →';
    }

    // Clear previous sessions
    localStorage.removeItem('kavach_jwt_token');
    localStorage.removeItem('kavach_user_role');
    localStorage.removeItem('kavach_user_name');
    localStorage.removeItem('kavach_user_service_no');
    localStorage.removeItem('kavach_user_id');

    // Switch to Login Tab
    switchAuthTab('login');

    // Populate the Login form with the newly registered details
    const loginRole = document.getElementById('loginRole');
    const loginServiceNo = document.getElementById('loginServiceNo');
    const loginPassword = document.getElementById('loginPassword');

    loginRole.value = data.user.role;
    loginServiceNo.value = data.user.service_no;
    loginPassword.value = password;

    // Apply visual glow
    loginServiceNo.classList.add('input-registered-highlight');
    loginPassword.classList.add('input-registered-highlight');

    // Store marker so changing roles doesn't wipe this
    window._justRegisteredServiceNo = data.user.service_no;
    window._justRegisteredRole = data.user.role;

    // Show prominent instructions on login screen
    showAlert(
      `✅ <strong>Registration Successful!</strong> Account enrolled for <strong>${data.user.rank} ${data.user.name}</strong> (Service No: <code>${data.user.service_no}</code>).<br />Your registered credentials have been pre-filled below. Click <strong>"AUTHENTICATE VIA JWT"</strong> to log in with your newly registered account.`,
      'success'
    );

    // Refresh database summary count
    fetchDatabaseRegistry();

  } catch (err) {
    console.error('Registration error:', err);
    showAlert('Network error during registration.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'REGISTER & INITIALIZE WALLET →';
    }
  }
}

// ============================================================================
// DATABASE INSPECTOR & LIVE REGISTRY VIEWER
// ============================================================================
async function fetchDatabaseRegistry() {
  try {
    const res = await fetch('/api/database/summary');
    if (!res.ok) return;
    const data = await res.json();
    
    // Update badge count
    const badge = document.getElementById('dbUserCountBadge');
    if (badge) {
      badge.textContent = `${data.total_users} Active Personnel`;
    }

    const countsEl = document.getElementById('dbSummaryCounts');
    if (countsEl) {
      countsEl.textContent = `${data.total_users} Users • ${data.total_records} Encrypted Records • ${data.total_access_grants} Grants`;
    }

    const pathEl = document.getElementById('dbFilePath');
    if (pathEl && data.db_file) {
      pathEl.textContent = data.db_file.split('/').slice(-2).join('/');
    }

    allDatabaseUsers = data.users || [];
    renderDatabaseTable(allDatabaseUsers);
  } catch (err) {
    console.warn('Could not fetch database summary:', err);
  }
}

function renderDatabaseTable(users) {
  const tbody = document.getElementById('dbTableBody');
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No registered personnel found.</td></tr>';
    return;
  }

  const roleIcons = {
    'SOLDIER': '🪖',
    'DOCTOR': '🩺',
    'PHYSIOTHERAPIST': '🏃',
    'COUNSELOR': '🧠',
    'CLAIMS_OFFICER': '⚖️',
    'COMMANDING_OFFICER': '🎖️'
  };

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <span class="db-role-badge db-role-${u.role}">
          ${roleIcons[u.role] || '👤'} ${u.role}
        </span>
      </td>
      <td><strong style="color: #f1f5f9; font-family: var(--font-mono);">${u.service_no}</strong></td>
      <td>
        <div style="font-weight: 700; color: #ffffff;">${u.name}</div>
        <div style="font-size: 0.7rem; color: #94a3b8;">${u.rank || 'Personnel'}</div>
      </td>
      <td>
        <div style="color: #e2e8f0;">${u.unit || 'Field Unit'}</div>
        <div style="font-size: 0.7rem; color: #94a3b8;">${u.posting || 'Station'}</div>
      </td>
      <td style="font-size: 0.72rem; color: #94a3b8; font-family: var(--font-mono);">${u.enlistment_date || 'Enrolled'}</td>
      <td>
        <button type="button" class="btn-select-user" onclick="selectDbUserForLogin('${u.role}', '${u.service_no}', '${u.name.replace(/'/g, "\\'")}')">
          Login As →
        </button>
      </td>
    </tr>
  `).join('');
}

function filterDatabaseTable() {
  const q = (document.getElementById('dbSearchInput')?.value || '').toLowerCase().trim();
  if (!q) {
    renderDatabaseTable(allDatabaseUsers);
    return;
  }
  const filtered = allDatabaseUsers.filter(u => 
    (u.name && u.name.toLowerCase().includes(q)) ||
    (u.service_no && u.service_no.toLowerCase().includes(q)) ||
    (u.role && u.role.toLowerCase().includes(q)) ||
    (u.rank && u.rank.toLowerCase().includes(q)) ||
    (u.unit && u.unit.toLowerCase().includes(q))
  );
  renderDatabaseTable(filtered);
}

function openDatabaseModal() {
  const modal = document.getElementById('dbModalBackdrop');
  if (modal) {
    modal.classList.add('active');
    fetchDatabaseRegistry();
  }
}

function closeDatabaseModal() {
  const modal = document.getElementById('dbModalBackdrop');
  if (modal) {
    modal.classList.remove('active');
  }
}

function handleDbModalBackdropClick(event) {
  if (event.target.id === 'dbModalBackdrop') {
    closeDatabaseModal();
  }
}

function selectDbUserForLogin(role, serviceNo, name) {
  closeDatabaseModal();
  quickFillLogin(role, serviceNo);
  showAlert(`Selected registered profile: <strong>${name}</strong> (<code>${serviceNo}</code>). Password set to default demo PIN. Click "AUTHENTICATE VIA JWT" to enter.`, 'success');
}

// On load: check redirection message and load database summary
document.addEventListener('DOMContentLoaded', () => {
  const msg = sessionStorage.getItem('kavach_auth_msg');
  if (msg) {
    showAlert(msg, 'error');
    sessionStorage.removeItem('kavach_auth_msg');
  }
  fetchDatabaseRegistry();
});

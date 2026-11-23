// ============================================================================
// KAVACH: Client-side Authentication, Role Verification & Redirection
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

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const alertBox = document.getElementById('authAlert');

  alertBox.className = 'auth-alert';
  alertBox.style.display = 'none';

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
  }
}

function handleLoginRoleChange() {
  const selectedRole = document.getElementById('loginRole').value;
  const serviceNoInput = document.getElementById('loginServiceNo');
  if (DEMO_CREDENTIALS[selectedRole]) {
    serviceNoInput.value = DEMO_CREDENTIALS[selectedRole];
  }
}

function quickFillLogin(role, serviceNo) {
  document.getElementById('loginRole').value = role;
  document.getElementById('loginServiceNo').value = serviceNo;
  document.getElementById('loginPassword').value = 'kavach123';
  showAlert(`Selected ${role} profile: ${serviceNo}. Click "Authenticate" to enter.`, 'success');
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('authAlert');
  alertBox.className = `auth-alert ${type}`;
  alertBox.textContent = message;
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

    showAlert(`✓ Access Granted! Redirecting to ${data.user.role} Dashboard...`, 'success');

    setTimeout(() => {
      window.location.href = DASHBOARD_ROUTES[data.user.role] || '../dashboards/soldier/soldier.html';
    }, 800);

  } catch (err) {
    console.error('Login error:', err);
    showAlert('Server connection error. Please ensure Kavach node is online.', 'error');
    btn.disabled = false;
    btn.textContent = 'AUTHENTICATE VIA JWT →';
  }
}

// 2. Handle Registration Submit
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

    // Auto-login registered user into localStorage
    localStorage.setItem('kavach_jwt_token', data.token);
    localStorage.setItem('kavach_user_role', data.user.role);
    localStorage.setItem('kavach_user_name', data.user.name);
    localStorage.setItem('kavach_user_service_no', data.user.service_no);
    localStorage.setItem('kavach_user_id', data.user.id);
    localStorage.setItem('kavach_user_posting', data.user.posting || unit);

    showAlert(`✓ Registration Successful! Welcome ${data.user.name} (${data.user.service_no}). Opening your ${data.user.role} console...`, 'success');

    // Pre-fill login form too in case user returns to login tab
    document.getElementById('loginRole').value = data.user.role;
    document.getElementById('loginServiceNo').value = data.user.service_no;
    document.getElementById('loginPassword').value = password;

    setTimeout(() => {
      window.location.href = DASHBOARD_ROUTES[data.user.role] || '../dashboards/soldier/soldier.html';
    }, 900);

  } catch (err) {
    console.error('Registration error:', err);
    showAlert('Network error during registration.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'REGISTER & INITIALIZE WALLET →';
    }
  }
}

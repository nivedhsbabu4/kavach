// ============================================================================
// KAVACH CLIENT-SIDE AUTH GUARD & RBAC ROUTE PROTECTION
// ============================================================================

/**
 * Enforce RBAC protection on a specific dashboard page.
 * Strictly calls /api/auth/me to verify authenticity with the server.
 * Never trusts localStorage for authorization; uses it solely for client UI routing.
 * @param {string} expectedRole - e.g. 'SOLDIER', 'DOCTOR', 'PHYSIOTHERAPIST', 'COUNSELOR', 'CLAIMS_OFFICER', 'COMMANDING_OFFICER'
 */
async function enforceRoleGuard(expectedRole) {
  const token = localStorage.getItem('kavach_jwt_token');

  // Fast check: No token means unauthenticated
  if (!token) {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('kavach_auth_msg', 'Military Authentication Required. Please login.');
    window.location.href = '../../auth/login.html';
    return false;
  }

  // Fast client UI routing cache check
  const cachedRole = localStorage.getItem('kavach_user_role');
  const cachedName = localStorage.getItem('kavach_user_name');
  if (cachedRole && cachedRole !== expectedRole) {
    sessionStorage.setItem('kavach_auth_msg', `⛔ RBAC ACCESS FORBIDDEN: You are logged in as ${cachedRole} (${cachedName || 'Personnel'}). Redirected to your authorized post.`);
    const dashboardMap = {
      'SOLDIER': '../soldier/soldier.html',
      'DOCTOR': '../doctor/doctor.html',
      'PHYSIOTHERAPIST': '../physio/physio.html',
      'COUNSELOR': '../counselor/counselor.html',
      'CLAIMS_OFFICER': '../claims/claims.html',
      'COMMANDING_OFFICER': '../commanding/commanding.html'
    };
    window.location.href = dashboardMap[cachedRole] || '../../auth/login.html';
    return false;
  }

  // Authoritative server-side verification: call /api/auth/me
  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // 401 or invalid token
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('kavach_auth_msg', 'Session expired or invalid authentication token. Please re-authenticate.');
      window.location.href = '../../auth/login.html';
      return false;
    }

    const data = await res.json();
    const serverRole = data.role || (data.user && data.user.role);

    if (serverRole !== expectedRole) {
      // Role mismatch according to cryptographic server token
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('kavach_auth_msg', `⛔ RBAC ACCESS DENIED: Clearance is for '${serverRole}', but '${expectedRole}' was requested.`);
      window.location.href = '../../auth/login.html';
      return false;
    }

    // Refresh cached user credentials from authoritative server response
    if (data.user) {
      localStorage.setItem('kavach_user_role', serverRole);
      localStorage.setItem('kavach_user_name', data.user.name || '');
      localStorage.setItem('kavach_user_service_no', data.user.service_no || data.user.service_number || '');
      localStorage.setItem('kavach_user_id', data.user.id || '');
      if (data.user.posting) {
        localStorage.setItem('kavach_user_posting', data.user.posting);
      }
    }

    return true;
  } catch (err) {
    console.error('Kavach Auth Guard verification failed:', err);
    // If server unreachable or error, reject
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('kavach_auth_msg', 'Security gateway unreachable. Please re-authenticate.');
    window.location.href = '../../auth/login.html';
    return false;
  }
}

/**
 * Return authorization headers for fetch requests
 */
function getAuthHeaders() {
  const token = localStorage.getItem('kavach_jwt_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Log out and purge all local military credentials
 */
function logoutUser() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '../../auth/login.html';
}

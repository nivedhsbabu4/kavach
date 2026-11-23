// ============================================================================
// KAVACH CLIENT-SIDE AUTH GUARD & RBAC ROUTE PROTECTION
// ============================================================================

/**
 * Enforce RBAC protection on a specific dashboard page
 * @param {string} expectedRole - e.g. 'SOLDIER', 'DOCTOR', 'PHYSIOTHERAPIST', 'COUNSELOR', 'CLAIMS_OFFICER', 'COMMANDING_OFFICER'
 */
function enforceRoleGuard(expectedRole) {
  const token = localStorage.getItem('kavach_jwt_token');
  const role = localStorage.getItem('kavach_user_role');
  const name = localStorage.getItem('kavach_user_name');

  if (!token || !role) {
    sessionStorage.setItem('kavach_auth_msg', 'Military Authentication Required. Please login.');
    window.location.href = '../../auth/login.html';
    return false;
  }

  if (role !== expectedRole) {
    sessionStorage.setItem('kavach_auth_msg', `⛔ RBAC ACCESS FORBIDDEN: You are logged in as ${role} (${name}). Redirected to your authorized post.`);
    
    // Redirect to their own authorized dashboard
    const dashboardMap = {
      'SOLDIER': '../soldier/soldier.html',
      'DOCTOR': '../doctor/doctor.html',
      'PHYSIOTHERAPIST': '../physio/physio.html',
      'COUNSELOR': '../counselor/counselor.html',
      'CLAIMS_OFFICER': '../claims/claims.html',
      'COMMANDING_OFFICER': '../commanding/commanding.html'
    };
    window.location.href = dashboardMap[role] || '../../auth/login.html';
    return false;
  }

  return true;
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
 * Log out and return to the login console
 */
function logoutUser() {
  localStorage.removeItem('kavach_jwt_token');
  localStorage.removeItem('kavach_user_role');
  localStorage.removeItem('kavach_user_name');
  localStorage.removeItem('kavach_user_service_no');
  localStorage.removeItem('kavach_user_id');
  window.location.href = '../../auth/login.html';
}

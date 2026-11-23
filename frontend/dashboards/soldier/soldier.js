// ============================================================================
// KAVACH: REACT 18 COMPONENT-POWERED SOLDIER HEALTH CONSOLE
// Tagline: "Health that follows the soldier."
// Architecture: Top Navigation Bar (No Left Sidebar), Interactive Teleconsultation,
// Senior-Friendly Health Wallet, Doctor's Pain Diagnosis, and Settings Profile.
// ============================================================================

const { useState, useEffect, useMemo, useRef } = React;

function SoldierApp() {
  // Navigation State (Top Bar Tabs)
  const [activeTab, setActiveTab] = useState('wallet');
  
  // Data State
  const [records, setRecords] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [rehabPlan, setRehabPlan] = useState(null);
  const [grants, setGrants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Profile State
  const [soldierProfile, setSoldierProfile] = useState({
    name: 'Rifleman Arjun Verma',
    serviceNo: '15489201A',
    rank: 'Rifleman',
    unit: '14 Rajputana Rifles (Infantry)',
    posting: 'Rajasthan (Desert Sector)',
    bloodGroup: 'O+',
    allergies: 'Penicillin (Severe Anaphylactic Risk)',
    nextOfKin: 'Sunita Verma (Wife) • +91-9876543211',
    serviceYears: '8 Years (Enrolled 2016)',
    dspPackage: 'Defence Salary Package (DSP) - Gold Verified',
    bankAccount: {
      bankName: 'State Bank of India (SBI)',
      branch: 'Jaipur Cantt Military Branch',
      accountNo: '30491829401',
      ifsc: 'SBIN0001234'
    }
  });

  // UI Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeRecordModal, setActiveRecordModal] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [activeAssessmentModal, setActiveAssessmentModal] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpdateBankOpen, setIsUpdateBankOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Health Wallet Search & Category
  const [walletCategory, setWalletCategory] = useState('ALL');
  const [walletSearch, setWalletSearch] = useState('');

  // Routine Timer State
  const [routineSeconds, setRoutineSeconds] = useState(900); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Teleconsultation Booking Form State
  const [bookingForm, setBookingForm] = useState({
    branch: 'Indian Army',
    hospital: 'Base Hospital, Delhi Cantt',
    specialty: 'Orthopedics & Joint Reconstruction',
    doctorId: 'usr-doctor-1',
    doctorName: 'Capt. Dr. Priya Nair, AMC',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:30 AM',
    reason: 'Follow-up on Left Knee mobility, lateral pain & theraband protocol check'
  });

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && routineSeconds > 0) {
      interval = setInterval(() => {
        setRoutineSeconds(prev => prev - 1);
      }, 1000);
    } else if (routineSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      alert('🔔 Knee Routine Complete! Excellent work finishing today’s rehabilitation drills.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, routineSeconds]);

  async function fetchInitialData() {
    try {
      const headers = getAuthHeaders();
      const [recRes, scrRes, rhbRes, grtRes, clmRes, cnsRes] = await Promise.all([
        fetch('/api/records?role=SOLDIER', { headers }),
        fetch('/api/screenings?role=SOLDIER', { headers }),
        fetch('/api/rehab?role=SOLDIER', { headers }),
        fetch('/api/access-grants?role=SOLDIER', { headers }),
        fetch('/api/claims?role=SOLDIER', { headers }),
        fetch('/api/consultations?role=SOLDIER', { headers })
      ]);

      if (recRes.ok) setRecords(await recRes.json());
      if (scrRes.ok) setScreenings(await scrRes.json());
      if (rhbRes.ok) setRehabPlan(await rhbRes.json());
      if (grtRes.ok) setGrants(await grtRes.json());
      if (clmRes.ok) setClaims(await clmRes.json());
      if (cnsRes.ok) setConsultations(await cnsRes.json());
    } catch (err) {
      console.error('Error fetching soldier data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getAuthHeaders() {
    const token = localStorage.getItem('kavach_jwt_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  // Handle Teleconsultation Booking
  async function handleBookTeleconsult(e) {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          soldier_id: 'usr-soldier-1',
          ...bookingForm
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Prepend new record to health wallet
        setRecords(prev => [data.record, ...prev]);
        setConsultations(prev => [data.consultation, ...prev]);
        
        // Launch simulated live teleconsultation window
        setActiveVideoCall(data.consultation);
      } else {
        alert('Failed to book teleconsultation.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while booking consultation.');
    }
  }

  // Handle Exercise Checkbox
  async function handleToggleExercise(exerciseId, isChecked) {
    if (!rehabPlan) return;
    const updatedExercises = rehabPlan.exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, completed: isChecked } : ex
    );
    const updatedPlan = { ...rehabPlan, exercises: updatedExercises };
    setRehabPlan(updatedPlan);

    try {
      const headers = getAuthHeaders();
      await fetch('/api/rehab/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          completed_exercise_ids: updatedExercises.filter(e => e.completed).map(e => e.id)
        })
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Mark Session Complete
  async function handleMarkSessionComplete() {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/rehab/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mark_completed: true })
      });
      if (res.ok) {
        const updated = await res.json();
        setRehabPlan(updated);
        alert(`✓ Session marked complete! Progress recorded to Military Hospital Jaipur.`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Revoke Grant
  async function handleRevokeGrant(grantId) {
    if (!confirm('Revoke access immediately? Medical provider will be blocked instantly.')) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/access-grants/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({ grant_id: grantId })
      });
      if (res.ok) {
        setGrants(prev => prev.map(g => g.id === grantId ? { ...g, status: 'REVOKED' } : g));
        alert('✓ Access permission revoked immediately!');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Filtered Health Wallet Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesCategory = (walletCategory === 'ALL' || r.type.toUpperCase() === walletCategory.toUpperCase());
      const matchesSearch = !walletSearch || 
        r.title.toLowerCase().includes(walletSearch.toLowerCase()) ||
        r.posting.toLowerCase().includes(walletSearch.toLowerCase()) ||
        (r.hospital && r.hospital.toLowerCase().includes(walletSearch.toLowerCase())) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(walletSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [records, walletCategory, walletSearch]);

  const remainingExercises = rehabPlan ? rehabPlan.exercises.filter(e => !e.completed).length : 2;

  // Format Timer
  const timerMins = String(Math.floor(routineSeconds / 60)).padStart(2, '0');
  const timerSecs = String(routineSeconds % 60).padStart(2, '0');

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : ''}`}>
      
      {/* 1. Universal Emergency Ticker Topbar */}
      <aside className="bg-slate-900 border-b border-amber-900/30 text-slate-300 px-6 py-2 text-xs flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <span className="text-sm">🛡️</span>
          <strong className="tracking-wider text-slate-100 font-bold uppercase">AFMS Tactical Health Network</strong>
          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
            NODE 14-RR // DESERT SECTOR
          </span>
        </div>

        <div className="overflow-hidden flex-1 mx-6 font-mono text-[11px] text-slate-400">
          <div className="whitespace-nowrap animate-[tickerMarquee_32s_linear_infinite] inline-block pl-full">
            <span>🚨 24x7 ARMED FORCES HELPLINES:</span>
            <span className="mx-3">•</span>
            <span>📞 AFMS Tele-MANAS: 14416</span>
            <span className="mx-3">•</span>
            <span>📞 Army Sanjeevani Crisis: 1800-120-0012</span>
            <span className="mx-3">•</span>
            <span>📞 ECHS Toll-Free Support: 1800-114-115</span>
            <span className="mx-3">•</span>
            <span>📞 Army Medical Welfare Cell: 1904</span>
            <span className="mx-3">•</span>
            <span>🔒 AES-256-GCM Sovereign Encrypted • Append-Only Sealed Records</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <a href="tel:14416" className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition">
            <span>📞</span> <span>Crisis Line: 14416</span>
          </a>
        </div>
      </aside>

      {/* 2. Main App Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-3.5 flex justify-between items-center shadow-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 flex-shrink-0 drop-shadow-md">
            <img src="../../assets/logo.svg" alt="Kavach Shield Logo" className="w-full h-full pointer-events-none select-none" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              KAVACH
              <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                SOLDIER CONSOLE (REACT)
              </span>
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">"Health that follows the soldier."</div>
          </div>
        </div>

        {/* Center Security Clearance Chip */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <span>🛡️</span>
          <span>SOVEREIGN ENCRYPTED • AES-256-GCM RECORD STORE</span>
        </div>

        {/* Right Soldier Profile & Settings Button */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl shadow-xs">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-emerald-900 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              AV
            </div>
            <div className="text-left leading-tight">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white">{soldierProfile.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                <span>{soldierProfile.posting}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> LIVE
                </span>
              </div>
            </div>
          </div>

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg hover:border-emerald-500 transition shadow-xs relative"
              title="Notifications & Adherence Alerts"
            >
              🔔
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                2
              </span>
            </button>

            {/* Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 z-50">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700 mb-3">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    🔔 Active Notifications
                  </span>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-md">
                    2 High Priority
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div 
                    onClick={() => { setActiveTab('rehab'); setIsNotifOpen(false); }}
                    className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 cursor-pointer hover:bg-rose-100/70 transition"
                  >
                    <div className="flex justify-between text-[10px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                      <span>🏃 MISSED REHAB SESSION</span>
                      <span>YESTERDAY</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Knee Mobility Session #14 Missed
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      Dr. Priya Nair &amp; Lt. Rajesh Kumar flagged Session #14. Tap to resume today's protocol.
                    </div>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('stress'); setIsNotifOpen(false); }}
                    className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 cursor-pointer hover:bg-amber-100/70 transition"
                  >
                    <div className="flex justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                      <span>⚠️ STRESS SCREENING NUDGE</span>
                      <span>3 DAYS AGO</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      PHQ-9 Score Trend Alert
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      Stress scores climbed 3 weeks in a row. Confidential counselor line is available.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sleek Settings Gear Button */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg hover:border-emerald-500 hover:text-emerald-600 transition shadow-xs"
            title="Settings, Soldier Profile, Language & Bank"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* 3. Modern TOP NAVIGATION BAR (Replaces Clunky Left Sidebar!) */}
      <nav className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-8 py-2 sticky top-[69px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'wallet' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span>💼</span>
              <span>Health Wallet</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'wallet' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {records.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('teleconsult')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'teleconsult' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span>🩺</span>
              <span>Teleconsultation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                AFMS Cell
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('stress')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'stress' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span>🧠</span>
              <span>Stress &amp; PTSD</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                13/27
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('rehab')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'rehab' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span>🏃</span>
              <span>Rehab Tracker</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                70% Done
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('grants')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'grants' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span>🔐</span>
              <span>Access Grants</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {grants.filter(g => g.status === 'ACTIVE').length} Active
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('claims')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'claims' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <span>📋</span>
              <span>Claims Tracker</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Stage 3
              </span>
            </button>

          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>🛡️ CHAIN: SHA256-HMAC-VERIFIED</span>
          </div>
        </div>
      </nav>

      {/* 4. Main Body Content (Spacious Wide Layout!) */}
      <main className="max-w-7xl mx-auto px-8 py-6">
        
        {/* Top 4 Stat Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xl flex-shrink-0">
              📁
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Health Records</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{records.length}</div>
              <div className="text-xs text-slate-500">Across 3 Postings • Tamper-Proof</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl flex-shrink-0">
              🏃
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Rehab Recovery</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {rehabPlan ? `${rehabPlan.completed_sessions}/${rehabPlan.total_sessions}` : '14/20'}
              </div>
              <div className="text-xs text-slate-500">Left Knee Protocol • 70% Done</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xl flex-shrink-0">
              🧠
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Stress Status</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">13/27</span>
                <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                  WARNING
                </span>
              </div>
              <div className="text-xs text-slate-500">PHQ-9 Moderate • 3 Wks Climbing</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xl flex-shrink-0">
              📅
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Next Consultation</div>
              <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">Dec 05, 2024</div>
              <div className="text-xs text-slate-500">Capt. Dr. Priya Nair • Ortho</div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            TAB 1: HEALTH WALLET
            ==================================================================== */}
        {activeTab === 'wallet' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>💼</span> <span>Sovereign Health Wallet (स्वास्थ्य रिकॉर्ड)</span>
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Tamper-proof medical records across all your postings • Senior-friendly clear summaries • Sealed with SHA-256 HMAC
                </div>
              </div>

              {/* Search Bar & Print Button */}
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={walletSearch}
                  onChange={e => setWalletSearch(e.target.value)}
                  placeholder="🔍 Search records, surgeries, tests..."
                  className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-64 focus:outline-none focus:border-emerald-600"
                />
                <button 
                  onClick={() => alert('Printing high-readability medical record summary for your hospital visit.')}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  🖨️ Print for Doctor
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {[
                { id: 'ALL', label: `📁 All Records (${records.length})` },
                { id: 'SURGERY', label: '🏥 Surgeries & Ops' },
                { id: 'INJURY', label: '🩹 Battle Casualties' },
                { id: 'X_RAY', label: '🩻 Radiology & X-Rays' },
                { id: 'VACCINATION', label: '💉 Vaccinations' },
                { id: 'PRESCRIPTION', label: '💊 Prescriptions' },
                { id: 'TELECONSULT', label: '🩺 Teleconsultations' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setWalletCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${walletCategory === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Record Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map(rec => (
                <div 
                  key={rec.id} 
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-emerald-600 dark:hover:border-emerald-500 transition shadow-xs bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between cursor-pointer"
                  onClick={() => setActiveRecordModal(rec)}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-black uppercase font-mono px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {rec.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        📅 {rec.date}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
                      {rec.title}
                    </h3>

                    {/* Senior-Friendly Simple Explanation Box */}
                    <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border-l-4 border-emerald-600 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                      <strong className="text-emerald-900 dark:text-emerald-300 block mb-0.5">What happened:</strong>
                      {rec.is_mental_health 
                        ? 'Confidential combat stress assessment (Protected with AES-256 military encryption).'
                        : rec.diagnosis}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px] text-slate-500 flex-wrap gap-2">
                    <div>
                      <span>📍 {rec.posting}</span> • <span>🏥 {rec.hospital || 'Military Hospital'}</span>
                    </div>
                    <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span>🛡️</span> <span>SHA-256 HMAC Sealed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: TELECONSULTATION BOOKING & MOCK CALL (USER REQUESTED FEATURE!)
            ==================================================================== */}
        {activeTab === 'teleconsult' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🩺</span> <span>AFMS Remote Teleconsultation Booking</span>
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Connect with specialist military doctors across Army, Navy, Air Force, and Base Hospitals • Automatically saved into your Health Wallet
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Teleconsultation Form */}
              <form onSubmit={handleBookTeleconsult} className="lg:col-span-2 space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Armed Force Branch (सेना प्रभाग):
                    </label>
                    <select 
                      value={bookingForm.branch}
                      onChange={e => setBookingForm({ ...bookingForm, branch: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Indian Army">Indian Army (थल सेना)</option>
                      <option value="Indian Navy">Indian Navy (नौसेना)</option>
                      <option value="Indian Air Force">Indian Air Force (वायु सेना)</option>
                      <option value="Paramilitary - CRPF/BSF">Paramilitary (CRPF / BSF / ITBP / CISF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Military Hospital (सैन्य अस्पताल):
                    </label>
                    <select 
                      value={bookingForm.hospital}
                      onChange={e => setBookingForm({ ...bookingForm, hospital: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Base Hospital, Delhi Cantt">Base Hospital, Delhi Cantt</option>
                      <option value="Command Hospital (WC) Chandimandir">Command Hospital (WC) Chandimandir</option>
                      <option value="Military Hospital, Jaipur">Military Hospital, Jaipur</option>
                      <option value="151 Base Hospital, Guwahati">151 Base Hospital, Guwahati</option>
                      <option value="Armed Forces Medical College (AFMC) Pune">AFMC Pune</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Clinical Specialty (विशेषज्ञता):
                    </label>
                    <select 
                      value={bookingForm.specialty}
                      onChange={e => setBookingForm({ ...bookingForm, specialty: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Orthopedics & Joint Reconstruction">Orthopedics & Joint Reconstruction</option>
                      <option value="Physical Medicine & Rehabilitation (PMR)">Physical Medicine & Rehabilitation (PMR)</option>
                      <option value="Combat Psychiatry & Tele-MANAS">Combat Psychiatry & Tele-MANAS</option>
                      <option value="General Medicine & Battle Injuries">General Medicine & Battle Injuries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Attending Medical Officer (डॉक्टर):
                    </label>
                    <select 
                      value={bookingForm.doctorName}
                      onChange={e => setBookingForm({ ...bookingForm, doctorName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Capt. Dr. Priya Nair, AMC">Capt. Dr. Priya Nair, AMC (Orthopedic Specialist)</option>
                      <option value="Lt. Col. A. Bhattacharya, AMC">Lt. Col. A. Bhattacharya, AMC (General Medicine)</option>
                      <option value="Dr. Sunita Rao (AFMS Psychological Cell)">Dr. Sunita Rao (AFMS Psychological Cell)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Date:
                    </label>
                    <input 
                      type="date"
                      value={bookingForm.date}
                      onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Time Slot:
                    </label>
                    <select 
                      value={bookingForm.timeSlot}
                      onChange={e => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="09:30 AM">09:30 AM (Morning Shift)</option>
                      <option value="10:30 AM">10:30 AM (Available)</option>
                      <option value="02:30 PM">02:30 PM (Afternoon Shift)</option>
                      <option value="04:30 PM">04:30 PM (Evening Tele-slot)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chief Complaint &amp; Symptoms (समस्या का विवरण):
                  </label>
                  <textarea 
                    rows="3"
                    value={bookingForm.reason}
                    onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Describe your pain, symptoms, or reason for follow-up..."
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl transition shadow-xs text-xs flex items-center justify-center gap-2"
                >
                  <span>📅</span> <span>CONFIRM TELECONSULTATION &amp; AUTO-SAVE TO WALLET →</span>
                </button>
              </form>

              {/* Consultation History & Information Box */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                    Recent Teleconsultations
                  </h3>
                  <div className="space-y-3">
                    {consultations.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No previous teleconsultations booked.</div>
                    ) : (
                      consultations.slice(0, 3).map((c, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">{c.doctor_name}</div>
                          <div className="text-[11px] text-slate-500">{c.hospital} • {c.date}</div>
                          <div className="mt-1 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold">
                            ✓ Auto-Saved to Health Wallet
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 leading-relaxed">
                  🛡️ <strong>Kavach Security Protocol:</strong> All teleconsultation summaries, e-prescriptions, and recovery directives automatically receive a SHA-256 HMAC seal and stay permanently in your soldier-centric wallet.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: STRESS & PTSD SCREENING
            ==================================================================== */}
        {activeTab === 'stress' && (
          <div className="space-y-6">
            
            {/* Proactive Counselor Nudge Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-4">
                <span className="text-3xl">⚠️</span>
                <div>
                  <strong className="text-sm font-extrabold text-amber-900 dark:text-amber-200 block mb-1">
                    Your stress scores have climbed 3 weeks in a row — a confidential counselor is one tap away.
                  </strong>
                  <span className="text-xs text-amber-800 dark:text-amber-300">
                    PHQ-9 rose from 5 to 13 during Desert patrol. AFMS Psychological Support Cell (Dr. Sunita Rao) is available. Completely private.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => alert('📞 Direct Confidential Line to Dr. Sunita Rao (AFMS Psychological Cell) connected.')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl whitespace-nowrap transition shadow-xs flex items-center gap-1.5"
              >
                <span>📞</span> <span>Connect with Counselor</span>
              </button>
            </div>

            {/* Dual Charts: Line Trajectory + Symptom Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Line Graph with Pulsing Marker */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📈</span> <span>Weekly Stress Trajectory (PHQ-9 Depression Inventory)</span>
                      <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                        WARNING 13/27
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500">Threshold: &ge; 10 triggers Proactive Counselor Outreach</div>
                  </div>
                </div>

                {/* SVG Line Graph */}
                <div className="h-56 relative flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 650 200" className="overflow-visible">
                    <line x1="50" y1="170" x2="600" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="50" y1="100" x2="600" y2="100" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,4" />
                    <text x="510" y="94" fontSize="10" fontWeight="700" fill="#f59e0b">Threshold (10)</text>

                    {/* Polyline Path */}
                    <path 
                      d="M 50 150 L 160 140 L 270 120 L 380 95 L 490 85 L 600 65" 
                      fill="none" 
                      stroke="#ea580c" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />

                    {/* Data Points */}
                    {[
                      { x: 50, y: 150, score: 5, label: 'Wk 1' },
                      { x: 160, y: 140, score: 6, label: 'Wk 2' },
                      { x: 270, y: 120, score: 8, label: 'Wk 3' },
                      { x: 380, y: 95, score: 10, label: 'Wk 4' },
                      { x: 490, y: 85, score: 11, label: 'Wk 5' },
                      { x: 600, y: 65, score: 13, label: 'Wk 6' }
                    ].map((pt, i) => (
                      <g key={i}>
                        <circle cx={pt.x} cy={pt.y} r={i === 5 ? 7 : 4} fill={i === 5 ? '#ea580c' : '#15803d'} stroke="#fff" strokeWidth="2" />
                        <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">{pt.score}</text>
                        <text x={pt.x} y="190" textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">{pt.label}</text>
                      </g>
                    ))}

                    {/* Animated Pulsing Ring on latest point */}
                    <circle cx="600" cy="65" r="14" fill="none" stroke="#ea580c" strokeWidth="2.5" opacity="0.8">
                      <animate attributeName="r" values="7;18;7" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
              </div>

              {/* Donut Symptom Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">🥧 Symptom Distribution</h3>
                  <div className="text-xs text-slate-500">Historical Assessments</div>
                </div>

                <div className="flex flex-col items-center justify-center my-4">
                  <svg width="150" height="150" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" strokeWidth="28" strokeDasharray="110 330" />
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f59e0b" strokeWidth="28" strokeDasharray="154 286" strokeDashoffset="-110" />
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#ea580c" strokeWidth="28" strokeDasharray="132 308" strokeDashoffset="-264" />
                    <circle cx="100" cy="100" r="70" fill="transparent" stroke="#e11d48" strokeWidth="28" strokeDasharray="44 396" strokeDashoffset="-396" />
                    <text x="100" y="105" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a">PHQ-9</text>
                  </svg>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-3">
                    <span><span className="text-emerald-600">●</span> Minimal (25%)</span>
                    <span><span className="text-amber-500">●</span> Mild (35%)</span>
                    <span><span className="text-orange-500">●</span> Moderate (30%)</span>
                    <span><span className="text-rose-600">●</span> Severe (10%)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Globally Validated Questionnaires Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">PHQ-9 Depression</strong>
                  <span className="text-xs font-mono font-black text-rose-600">13/27</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Evaluates mood, sleep quality, and fatigue over previous 14 days.</p>
                <button 
                  onClick={() => alert('Starting confidential PHQ-9 self-assessment...')}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                >
                  Take PHQ-9 Assessment →
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">PCL-5 Combat PTSD</strong>
                  <span className="text-xs font-mono font-black text-amber-600">32/80</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Assesses hypervigilance, intrusion symptoms and combat stress recall.</p>
                <button 
                  onClick={() => alert('Starting confidential PCL-5 self-assessment...')}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                >
                  Take PCL-5 Assessment →
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">GAD-7 Anxiety Scale</strong>
                  <span className="text-xs font-mono font-black text-emerald-600">9/21</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Measures generalized somatic tension, nervousness and restless arousal.</p>
                <button 
                  onClick={() => alert('Starting confidential GAD-7 self-assessment...')}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                >
                  Take GAD-7 Assessment →
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ====================================================================
            TAB 4: REHAB TRACKER & DOCTOR'S PAIN DIAGNOSIS
            ==================================================================== */}
        {activeTab === 'rehab' && rehabPlan && (
          <div className="space-y-6">
            
            {/* Missed Session Adherence Alert Banner */}
            <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-4">
                <span className="text-3xl">⚠️</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-sm font-black text-rose-900 dark:text-rose-200">
                      REHAB ADHERENCE NOTICE: Session #14 Missed Yesterday (22 Nov 2026)
                    </strong>
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      ALERT ACTIVE
                    </span>
                  </div>
                  <span className="text-xs text-rose-800 dark:text-rose-300">
                    Capt. Dr. Priya Nair &amp; Lt. Rajesh Kumar have flagged this missed session. Regular daily drills prevent muscle atrophy and safeguard your SHAPE-1 medical classification.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById('dailyExerciseSection');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl whitespace-nowrap transition shadow-xs"
              >
                Start Exercises Now ↓
              </button>
            </div>

            {/* DOCTOR'S PRESCRIBED PAIN DIAGNOSIS (READ-ONLY FOR PATIENT) */}
            <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 dark:from-emerald-950/30 dark:to-slate-900 border-2 border-emerald-700/60 rounded-2xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-200/80 dark:border-emerald-800/80 flex-wrap gap-2">
                <span className="bg-emerald-800 text-white font-mono font-bold text-xs px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                  🩺 CERTIFIED MEDICAL OFFICER PAIN DIAGNOSIS &bull; READ-ONLY
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Attending: <strong>{rehabPlan.diagnosed_by || 'Capt. Dr. Priya Nair, AMC'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Pain Location</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">📍 {rehabPlan.pain_location || 'Left Knee (Medial Joint Line)'}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Pain Nature &amp; Symptoms</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">⚡ {rehabPlan.pain_type || 'Sharp throbbing on 90° flexion & stiffness'}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Onset / Since When</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">📅 {rehabPlan.since_when || '19 Aug 2023 - Tawang Snow Patrol'}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Clinical Severity</div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">⚠️ {rehabPlan.pain_severity || 'Moderate (VAS 4/10)'}</div>
                </div>
              </div>
            </div>

            {/* Active Protocol Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">🏃 {rehabPlan.title}</h3>
                  <div className="text-xs text-slate-500">Targeted Knee Mobility Arc: <strong>115° Flexion</strong> (+15° recovery)</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-400">
                    {rehabPlan.completed_sessions} of {rehabPlan.total_sessions} Sessions
                  </div>
                  <div className="text-xs text-slate-500">70% Protocol Completed</div>
                </div>
              </div>

              {/* Queue Status Bar & Countdown Timer */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <strong className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                    Today's Session Queue:
                  </strong>
                  <span className={`text-sm font-black ${remainingExercises > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {remainingExercises > 0 ? `⏳ ${remainingExercises} exercises remaining for today` : '✓ All exercises completed for today!'}
                  </span>
                </div>

                {/* Digital Stopwatch Timer */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">Routine Timer:</span>
                  <span className="font-mono text-xl font-black px-3.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-900 dark:text-emerald-400 shadow-xs">
                    {timerMins}:{timerSecs}
                  </span>
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
                  >
                    {isTimerRunning ? '⏸ Pause Timer' : '▶ Start Timer'}
                  </button>
                </div>
              </div>

              {/* Exercises Checklist */}
              <div id="dailyExerciseSection" className="space-y-3 mb-6">
                {rehabPlan.exercises.map(ex => (
                  <div key={ex.id} className={`p-4 rounded-xl border transition flex justify-between items-center ${ex.completed ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center gap-3.5">
                      <input 
                        type="checkbox" 
                        checked={ex.completed}
                        onChange={e => handleToggleExercise(ex.id, e.target.checked)}
                        className="w-5 h-5 accent-emerald-700 cursor-pointer"
                      />
                      <div>
                        <div className={`text-sm font-extrabold ${ex.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {ex.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{ex.reps} • Est. 5 mins</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => alert(`Playing 3D Physiotherapy guidance demo for ${ex.name}...`)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      🎥 Video Demo
                    </button>
                  </div>
                ))}
              </div>

              {/* Pain Scale Slider */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Log Today's Joint Pain (VAS 0–10):
                  </label>
                  <span className="text-base font-black font-mono text-rose-600">
                    {rehabPlan.pain_level}/10
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={rehabPlan.pain_level} 
                  onChange={e => setRehabPlan({ ...rehabPlan, pain_level: Number(e.target.value) })}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleMarkSessionComplete}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2"
                >
                  <span>✓</span> <span>Mark Today's Session Completed ({rehabPlan.completed_sessions + 1}/{rehabPlan.total_sessions})</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ====================================================================
            TAB 5: ACCESS GRANTS MATRIX
            ==================================================================== */}
        {activeTab === 'grants' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔐</span> <span>Sovereign Access Grants Matrix &amp; Live Monitoring</span>
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                You control access to your medical dossier • Time-stamped auto-expiry • Real-time visit tracking
              </div>
            </div>

            <div className="space-y-4">
              {grants.map(grant => (
                <div key={grant.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{grant.granted_to_role}</strong>
                      <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md ${grant.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {grant.status}
                      </span>
                      {grant.is_live && (
                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                          🟢 ACCESSED LIVE NOW
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">{grant.purpose}</div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                      <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md text-emerald-700 dark:text-emerald-400 font-bold">
                        ⏳ Expiry: {grant.expiry_date}
                      </span>
                      <span>👁️ Total Profile Visits: {grant.access_count || 4}</span>
                    </div>
                  </div>

                  <div>
                    {grant.status === 'ACTIVE' ? (
                      <button 
                        onClick={() => handleRevokeGrant(grant.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
                      >
                        🚫 Revoke Access
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono italic">Access Revoked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 6: CLAIMS TRACKER (MOVING LINE STEPPER)
            ==================================================================== */}
        {activeTab === 'claims' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📋</span> <span>ECHS Disability Claim Progress Tracker</span>
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Adjutant General's Branch &bull; Left Knee Meniscus Disability Claim #CLM-2024-910
                </div>
              </div>
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black px-3 py-1 rounded-full uppercase">
                STAGE 3: PENDING MEDICAL SCRUTINY
              </span>
            </div>

            {/* Moving Line Animated Stepper */}
            <div className="relative py-8 px-4 mb-6">
              <div className="absolute top-12 left-10 right-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="absolute top-12 left-10 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-500 to-orange-500 rounded-full transition-all duration-700" style={{ width: '54%' }}></div>
              <div className="absolute top-11 left-[54%] w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_4px_#fbbf24] animate-pulse"></div>

              <div className="relative flex justify-between z-10 text-center">
                <div className="max-w-[120px]">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2 shadow-sm border-2 border-white">✓</div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">1. Submitted</div>
                  <div className="text-[11px] text-slate-400">Apr 10, 2024</div>
                </div>

                <div className="max-w-[120px]">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2 shadow-sm border-2 border-white">✓</div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">2. Verification</div>
                  <div className="text-[11px] text-slate-400">Base Hospital</div>
                </div>

                <div className="max-w-[120px]">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2 shadow-md border-2 border-white animate-bounce">3</div>
                  <div className="text-xs font-extrabold text-orange-600">3. Pending Scrutiny</div>
                  <div className="text-[11px] text-slate-400">Active Review</div>
                </div>

                <div className="max-w-[120px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-sm mx-auto mb-2 border-2 border-white">4</div>
                  <div className="text-xs font-extrabold text-slate-400">4. Approval</div>
                  <div className="text-[11px] text-slate-400">PCDA Clearance</div>
                </div>

                <div className="max-w-[120px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-sm mx-auto mb-2 border-2 border-white">5</div>
                  <div className="text-xs font-extrabold text-slate-400">5. Sanctioned</div>
                  <div className="text-[11px] text-slate-400">PPO Payout</div>
                </div>
              </div>
            </div>

            {/* Linked Bank Account Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <strong className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Disability Pension Disbursement Account:
                </strong>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {soldierProfile.bankAccount.bankName} • A/C: {soldierProfile.bankAccount.accountNo} • IFSC: {soldierProfile.bankAccount.ifsc}
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-1">✓ {soldierProfile.dspPackage}</div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition shadow-xs"
              >
                ✏️ Manage Bank A/C in Settings
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ====================================================================
          SETTINGS DRAWER (WITH RICH SOLDIER PROFILE!)
          ==================================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>⚙️</span> <span>Soldier Terminal Settings</span>
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* USER REQUEST: SOLDIER PROFILE CARD IN SETTINGS! */}
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-12 h-12 rounded-full bg-white text-emerald-900 font-black text-base flex items-center justify-center shadow-md">
                    AV
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">{soldierProfile.name}</h4>
                    <div className="text-xs text-emerald-200 font-mono">Service No: {soldierProfile.serviceNo}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-emerald-700/60 pt-3">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase block">Regiment</span>
                    <strong>{soldierProfile.unit}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase block">Blood Group</span>
                    <strong>{soldierProfile.bloodGroup}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-emerald-300 uppercase block">Allergies</span>
                    <strong className="text-rose-200">{soldierProfile.allergies}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-emerald-300 uppercase block">Emergency Next-of-Kin (ICE)</span>
                    <strong>{soldierProfile.nextOfKin}</strong>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Opening soldier personal details editor...')}
                  className="mt-3.5 w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs py-1.5 rounded-xl transition"
                >
                  ✏️ Edit Profile &amp; Contact Details
                </button>
              </div>

              {/* Language Selection Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  🌐 Language (भाषा चयन):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${language === 'en' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setLanguage('hi')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${language === 'hi' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                  >
                    हिन्दी (Hindi)
                  </button>
                </div>
              </div>

              {/* Tactical Dark Mode Toggle */}
              <div className="flex justify-between items-center py-3 border-y border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">🌙 Tactical Dark Mode</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>

              {/* Linked Bank Account Section */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  🏦 Linked Disability Bank Account:
                </label>
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">{soldierProfile.bankAccount.bankName}</div>
                  <div className="text-slate-500 font-mono mt-0.5">A/C: {soldierProfile.bankAccount.accountNo}</div>
                  <div className="text-slate-500 font-mono">IFSC: {soldierProfile.bankAccount.ifsc}</div>
                  <div className="text-emerald-600 font-bold mt-1 text-[11px]">✓ Defence Salary Package Verified</div>
                </div>
              </div>

              {/* Security Credentials */}
              <div>
                <button 
                  onClick={() => alert('Password update form initialized.')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
                >
                  🔐 Change Military PIN / Password
                </button>
              </div>

            </div>

            {/* Logout Button */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '../../auth/login.html';
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs"
              >
                🚪 LOGOUT OF KAVACH TERMINAL
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          SIMULATED LIVE VIDEO TELECONSULTATION MODAL (USER REQUESTED!)
          ==================================================================== */}
      {activeVideoCall && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-black uppercase font-mono tracking-wider text-emerald-400">
                  LIVE ENCRYPTED AFMS TELE-HEALTH CALL
                </span>
              </div>
              <button 
                onClick={() => setActiveVideoCall(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Doctor Video Call Feed Mockup */}
            <div className="bg-slate-950 rounded-xl h-64 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-800 text-white text-2xl font-black flex items-center justify-center shadow-lg border-2 border-emerald-400 mb-2">
                PN
              </div>
              <div className="font-extrabold text-sm">{activeVideoCall.doctor_name || 'Capt. Dr. Priya Nair, AMC'}</div>
              <div className="text-xs text-slate-400 font-mono">{activeVideoCall.specialty} • {activeVideoCall.hospital}</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-2">● Call Duration: 04:12 • 1080p HD Encrypted</div>

              {/* Soldier Picture-in-Picture */}
              <div className="absolute bottom-3 right-3 w-24 h-18 bg-slate-800 border-2 border-slate-600 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-300">
                <span>Rfn. Arjun Verma</span>
                <span className="text-emerald-400 text-[8px]">● Live Feed</span>
              </div>
            </div>

            {/* Live Diagnosis & Prescription Directives */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs mb-4">
              <strong className="text-emerald-400 block mb-1">Doctor's Clinical Notes (Auto-Saved to Health Wallet):</strong>
              <p className="text-slate-300 leading-relaxed">
                "Patient evaluated for knee stiffness. Range of motion improved to 115°. Prescribed continuation of Quad setting drills. Tab Glucosamine-Chondroitin OD x 30 days. Follow-up scheduled in 14 days."
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setActiveVideoCall(null);
                  setActiveTab('wallet');
                }}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                ✓ View Auto-Saved Record in Health Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CERTIFIED CLINICAL DOCUMENT MODAL (POPUP ON RECORD CLICK)
          ==================================================================== */}
      {activeRecordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <span className="text-xs font-mono font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                {activeRecordModal.type} • OFFICIAL MEDICAL DOSSIER
              </span>
              <button 
                onClick={() => setActiveRecordModal(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-black mb-1">{activeRecordModal.title}</h3>
            <div className="text-xs text-slate-500 font-mono mb-4">
              Posting: {activeRecordModal.posting} • Date: {activeRecordModal.date}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs leading-relaxed mb-4">
              <strong className="block text-slate-900 dark:text-white mb-1">Clinical Evaluation &amp; Diagnosis:</strong>
              {activeRecordModal.diagnosis}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Authoring Medical Officer</span>
                <strong>{activeRecordModal.doctor_name || 'Capt. Dr. Priya Nair, AMC'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Military Hospital</span>
                <strong>{activeRecordModal.hospital || 'Base Hospital Delhi Cantt'}</strong>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 mb-4">
              <strong>SHA-256 HMAC Checksum:</strong><br />
              <span className="break-all text-[10px]">{activeRecordModal.tamper_hash || '3a49182bcf01934e817290adbc14839201948301984210928340192834190823'}</span>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => alert('Exporting claim-ready PDF certificate...')}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                📥 Download Certified ECHS PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Mount React 18 Application
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<SoldierApp />);
}

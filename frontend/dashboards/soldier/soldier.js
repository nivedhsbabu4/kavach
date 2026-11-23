// ============================================================================
// KAVACH: REACT 18 COMPONENT-POWERED SOLDIER HEALTH CONSOLE
// Tagline: "Health that follows the soldier."
// Features: Top Navigation Bar, Dynamic Multilingual Engine, Real Notifications,
// Non-Congested Layout, Real Data Entry, Profile & Password Editing, Zero Alerts (Toast System).
// ============================================================================

const { useState, useEffect, useMemo, useRef } = React;

// 1. Multilingual Localization Dictionary
const TRANSLATIONS = {
  en: {
    appTitle: 'KAVACH',
    tagline: 'Health that follows the soldier.',
    classification: 'SOLDIER CONSOLE (REACT)',
    liveStatus: 'LIVE',
    walletTab: 'Health Wallet',
    teleconsultTab: 'Teleconsultation',
    stressTab: 'Stress & PTSD',
    rehabTab: 'Rehab Tracker',
    grantsTab: 'Access Grants',
    claimsTab: 'Claims Tracker',
    auditTab: 'Security Audit Logs',
    quickActions: 'Quick Actions',
    statRecords: 'Health Records',
    statRecordsSub: 'Across All Postings • Tamper-Proof',
    statRehab: 'Rehab Recovery',
    statRehabSub: 'Active Protocol Progress',
    statStress: 'Stress Status',
    statStressSub: 'PHQ-9 Clinical Screening',
    statNextConsult: 'Next Consultation',
    searchPlaceholder: '🔍 Search records, surgeries, radiology, prescriptions...',
    filterAll: 'All Records',
    filterInjury: 'Injuries & Battle',
    filterSurgery: 'Surgical',
    filterXray: 'Radiology',
    filterRx: 'Prescriptions',
    filterTele: 'Teleconsults',
    addRecordBtn: '✚ Add Medical Record',
    routineTimer: 'Routine Timer',
    todayQueue: "Today's Session Queue",
    exercisesLeft: 'exercises remaining for today',
    allDone: '✓ All exercises completed for today!',
    painSeverity: 'Clinical Severity',
    doctorPrescribed: 'Doctor Prescribed Pain Diagnosis',
    settings: 'Settings & Soldier Profile',
    editProfileBtn: '✏️ Edit Profile Details',
    changePasswordBtn: '🔐 Change Military PIN / Password',
    linkedBank: 'Linked Disability Bank Account',
    dspVerified: '✓ Defence Salary Package (DSP) Gold Verified',
    logoutBtn: '🚪 LOGOUT OF KAVACH TERMINAL',
    startTimer: '▶ Start Timer',
    pauseTimer: '⏸ Pause Timer'
  },
  hi: {
    appTitle: 'कवच',
    tagline: 'स्वास्थ्य जो सैनिक के साथ चलता है।',
    classification: 'सैनिक कंसोल (रिएक्ट)',
    liveStatus: 'सक्रिय',
    walletTab: 'स्वास्थ्य वॉलेट',
    teleconsultTab: 'टेली-परामर्श',
    stressTab: 'मानसिक तनाव एवं PTSD',
    rehabTab: 'पुनर्वास ट्रैकर',
    grantsTab: 'सहमति अधिकार',
    claimsTab: 'दावा ट्रैकर',
    auditTab: 'सुरक्षा ऑडिट लॉग',
    quickActions: 'त्वरित क्रियाएं',
    statRecords: 'चिकित्सा रिकॉर्ड',
    statRecordsSub: 'सभी पोस्टिंग में सुरक्षित • अपरिवर्तनीय',
    statRehab: 'पुनर्वास प्रगति',
    statRehabSub: 'सक्रिय प्रोटोकॉल सुधार',
    statStress: 'तनाव स्थिति',
    statStressSub: 'PHQ-9 नैदानिक स्क्रीनिंग',
    statNextConsult: 'अगला परामर्श',
    searchPlaceholder: '🔍 रिकॉर्ड, सर्जरी, जांच, दवा पर्ची खोजें...',
    filterAll: 'सभी रिकॉर्ड',
    filterInjury: 'युद्ध/चोट रिकॉर्ड',
    filterSurgery: 'सर्जिकल',
    filterXray: 'रेडियोलॉजी',
    filterRx: 'दवा पर्ची',
    filterTele: 'टेली-परामर्श',
    addRecordBtn: '✚ नया रिकॉर्ड जोड़ें',
    routineTimer: 'दैनिक व्यायाम टाइमर',
    todayQueue: 'आज के अभ्यास',
    exercisesLeft: 'अभ्यास शेष हैं',
    allDone: '✓ आज के सभी अभ्यास पूरे हो चुके हैं!',
    painSeverity: 'दर्द की गंभीरता',
    doctorPrescribed: 'सैन्य डॉक्टर द्वारा निर्धारित दर्द निदान',
    settings: 'सेटिंग्स एवं सैनिक प्रोफ़ाइल',
    editProfileBtn: '✏️ प्रोफ़ाइल विवरण संपादित करें',
    changePasswordBtn: '🔐 सैन्य पिन / पासवर्ड बदलें',
    linkedBank: 'संबद्ध पेंशन बैंक खाता',
    dspVerified: '✓ रक्षा वेतन पैकेज (डीएसपी) गोल्ड सत्यापित',
    logoutBtn: '🚪 कवच टर्मिनल से लॉगआउट करें',
    startTimer: '▶ टाइमर शुरू करें',
    pauseTimer: '⏸ टाइमर रोकें'
  }
};

// 2. Clinical Department to Doctor Mapping
const DEPARTMENT_DOCTORS = {
  'Orthopedics & Joint Reconstruction': [
    { id: 'usr-doctor-1', name: 'Capt. Dr. Priya Nair, AMC (Orthopedic Specialist)' },
    { id: 'usr-doctor-sengupta', name: 'Col. S. Sengupta, AMC (Chief Ortho Surgeon)' }
  ],
  'PTSD & Clinical Psychology': [
    { id: 'usr-counselor-1', name: 'Dr. Sunita Rao, AFMS (Senior Clinical Psychologist)' }
  ],
  'Physiotherapy & Musculoskeletal Rehab': [
    { id: 'usr-physio-1', name: 'Lt. Rajesh Kumar, AMC (Physical Therapist)' }
  ],
  'General & Combat Medicine': [
    { id: 'usr-doctor-sharma', name: 'Maj. Dr. A. Sharma, AMC (Combat Physician)' },
    { id: 'usr-doctor-deshmukh', name: 'Lt. Col. P. Deshmukh, AMC (Senior Physician)' }
  ],
  'Cardiology': [
    { id: 'usr-doctor-verma', name: 'Col. Dr. R. Verma, AMC (Chief Cardiologist)' }
  ],
  'Combat Audiology & ENT': [
    { id: 'usr-doctor-chopra', name: 'Lt. Col. Dr. Chopra, AMC (ENT Specialist)' }
  ]
};

// 3. Globally Validated Clinical Questionnaires (DSM-5 & AFMS Protocol)
const QUESTIONNAIRE_DEFS = {
  'PHQ-9': {
    id: 'PHQ-9',
    title: 'PHQ-9 (Patient Health Questionnaire - Depression Screening)',
    subtitle: 'Globally validated 9-item psychometric screen for depressive symptoms in active personnel.',
    instruction: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    max_score: 27,
    options: [
      { score: 0, label: '0 - Not at all' },
      { score: 1, label: '1 - Several days' },
      { score: 2, label: '2 - More than half the days' },
      { score: 3, label: '3 - Nearly every day' }
    ],
    questions: [
      { id: 'phq_1', text: 'Little interest or pleasure in doing things' },
      { id: 'phq_2', text: 'Feeling down, depressed, or hopeless' },
      { id: 'phq_3', text: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 'phq_4', text: 'Feeling tired or having little energy' },
      { id: 'phq_5', text: 'Poor appetite or overeating' },
      { id: 'phq_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family/unit down' },
      { id: 'phq_7', text: 'Trouble concentrating on tasks, such as reading briefings or operating equipment' },
      { id: 'phq_8', text: 'Moving or speaking so slowly that other people noticed, or being so fidgety/restless that you moved a lot more than usual' },
      { id: 'phq_9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way' }
    ]
  },
  'GAD-7': {
    id: 'GAD-7',
    title: 'GAD-7 (Generalized Anxiety Disorder Screening)',
    subtitle: 'Validated 7-item clinical tool assessing hyperarousal, tension, and apprehension.',
    instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    max_score: 21,
    options: [
      { score: 0, label: '0 - Not at all' },
      { score: 1, label: '1 - Several days' },
      { score: 2, label: '2 - More than half the days' },
      { score: 3, label: '3 - Nearly every day' }
    ],
    questions: [
      { id: 'gad_1', text: 'Feeling nervous, anxious, or on edge' },
      { id: 'gad_2', text: 'Not being able to stop or control worrying' },
      { id: 'gad_3', text: 'Worrying too much about different operational and personal issues' },
      { id: 'gad_4', text: 'Trouble relaxing during off-duty hours' },
      { id: 'gad_5', text: 'Being so restless that it is hard to sit still' },
      { id: 'gad_6', text: 'Becoming easily annoyed or irritable with colleagues or family' },
      { id: 'gad_7', text: 'Feeling afraid, as if something awful might happen' }
    ]
  },
  'PCL-5': {
    id: 'PCL-5',
    title: 'PCL-5 (PTSD Checklist for DSM-5 Military Screening)',
    subtitle: 'Official 20-item DSM-5 gold-standard symptom checklist for combat and operational trauma.',
    instruction: 'In the past month, how much have you been bothered by the following problems regarding stressful/combat experiences?',
    max_score: 80,
    options: [
      { score: 0, label: '0 - Not at all' },
      { score: 1, label: '1 - A little bit' },
      { score: 2, label: '2 - Moderately' },
      { score: 3, label: '3 - Quite a bit' },
      { score: 4, label: '4 - Extremely' }
    ],
    questions: [
      { id: 'pcl_1', text: 'Repeated, disturbing, and unwanted memories of the stressful experience?' },
      { id: 'pcl_2', text: 'Repeated, disturbing dreams of the stressful experience?' },
      { id: 'pcl_3', text: 'Suddenly feeling or acting as if the stressful experience were happening again (flashbacks)?' },
      { id: 'pcl_4', text: 'Feeling very upset when something reminded you of the stressful experience?' },
      { id: 'pcl_5', text: 'Strong physical reactions when reminded of the stressful experience (sweating, heart pounding)?' },
      { id: 'pcl_6', text: 'Avoiding memories, thoughts, or feelings related to the stressful experience?' },
      { id: 'pcl_7', text: 'Avoiding external reminders of the stressful experience (people, places, military situations)?' },
      { id: 'pcl_8', text: 'Trouble remembering important parts of the stressful experience?' },
      { id: 'pcl_9', text: 'Strong negative beliefs about yourself, other people, or the world?' },
      { id: 'pcl_10', text: 'Blaming yourself or someone else for the stressful experience or what happened after?' },
      { id: 'pcl_11', text: 'Strong negative feelings such as fear, horror, anger, guilt, or shame?' },
      { id: 'pcl_12', text: 'Loss of interest in activities that you used to enjoy?' },
      { id: 'pcl_13', text: 'Feeling distant or cut off from other people (unit comrades, family)?' },
      { id: 'pcl_14', text: 'Trouble experiencing positive feelings (being unable to feel happiness or love)?' },
      { id: 'pcl_15', text: 'Irritable behavior, angry outbursts, or acting aggressively?' },
      { id: 'pcl_16', text: 'Taking too many risks or doing things that could cause you harm?' },
      { id: 'pcl_17', text: "Being 'super-alert', watchful, or on guard (hypervigilance)?" },
      { id: 'pcl_18', text: 'Feeling jumpy or easily startled?' },
      { id: 'pcl_19', text: 'Having difficulty concentrating on tasks?' },
      { id: 'pcl_20', text: 'Trouble falling or staying asleep?' }
    ]
  }
};

function SoldierApp() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('wallet');
  const [language, setLanguage] = useState('en');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Data State
  const [records, setRecords] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [rehabPlan, setRehabPlan] = useState(null);
  const [grants, setGrants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditRoleFilter, setAuditRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // User Profile State (Real live data from /api/users/me)
  const [soldierProfile, setSoldierProfile] = useState({
    name: 'Rifleman Arjun Verma',
    serviceNo: '15489201A',
    rank: 'Rifleman',
    unit: '14 Rajputana Rifles (Infantry)',
    posting: 'Rajasthan (Desert Sector)',
    branch: 'Indian Army',
    bloodGroup: 'O+',
    phone: '+91-9876543210',
    email: 'arjun.verma@afms.nic.in',
    address: 'Vill: Khetri, Dist: Jhunjhunu, Rajasthan - 333503',
    nextOfKin: 'Sunita Verma (Wife) • +91-9876543211',
    allergies: 'Penicillin (Severe Anaphylactic Risk)',
    serviceYears: '8 Years (Enrolled 2018)',
    dspPackage: 'Defence Salary Package (DSP) - Gold Verified',
    lockEnabled: true,
    pin: '1234',
    bankAccount: {
      bankName: 'State Bank of India (SBI)',
      branch: 'Jaipur Cantt Military Branch',
      accountNo: '30491829401',
      ifsc: 'SBIN0001234'
    }
  });

  // UI Drawer & Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHelplinesModalOpen, setIsHelplinesModalOpen] = useState(false);
  const [activeRecordModal, setActiveRecordModal] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Interactive Questionnaires, Dispute & Notification Modals
  const [activeQuestionnaire, setActiveQuestionnaire] = useState(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [disputeModalClaim, setDisputeModalClaim] = useState(null);
  const [disputeForm, setDisputeForm] = useState({ report_title: '', dispute_reason: '', evidence_summary: '' });
  const [bookingConfirmedSlip, setBookingConfirmedSlip] = useState(null);

  // Toast Notification State (Eliminates Browser Alerts!)
  const [toast, setToast] = useState(null);
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  }

  // Health Wallet Filters
  const [walletCategory, setWalletCategory] = useState('ALL');
  const [walletSearch, setWalletSearch] = useState('');

  // Routine Timer State
  const [routineSeconds, setRoutineSeconds] = useState(900); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Form States
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

  const [newRecordForm, setNewRecordForm] = useState({
    title: '',
    type: 'PRESCRIPTION',
    hospital: 'Base Hospital',
    doctor_name: 'Capt. Dr. Priya Nair, AMC',
    diagnosis: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [editProfileForm, setEditProfileForm] = useState({ ...soldierProfile });

  // On Load: Fetch Real Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Routine Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && routineSeconds > 0) {
      interval = setInterval(() => setRoutineSeconds(prev => prev - 1), 1000);
    } else if (routineSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showToast('🔔 Knee Routine Complete! Excellent work completing today’s exercises.', 'success');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, routineSeconds]);

  function getAuthHeaders() {
    const token = localStorage.getItem('kavach_jwt_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  async function fetchInitialData() {
    try {
      const headers = getAuthHeaders();
      const [profRes, recRes, scrRes, rhbRes, grtRes, clmRes, cnsRes, notifRes, audRes] = await Promise.all([
        fetch('/api/users/me', { headers }),
        fetch('/api/records?role=SOLDIER', { headers }),
        fetch('/api/screenings?role=SOLDIER', { headers }),
        fetch('/api/rehab?role=SOLDIER', { headers }),
        fetch('/api/access-grants?role=SOLDIER', { headers }),
        fetch('/api/claims?role=SOLDIER', { headers }),
        fetch('/api/consultations?role=SOLDIER', { headers }),
        fetch('/api/notifications', { headers }),
        fetch('/api/audit-log', { headers })
      ]);

      if (profRes.ok) {
        const prof = await profRes.json();
        const updated = {
          name: prof.name || 'Soldier Personnel',
          serviceNo: prof.service_no || '15489201A',
          rank: prof.rank || 'Rifleman',
          unit: prof.unit || 'Field Regiment',
          posting: prof.posting || 'Field Station',
          branch: prof.branch || 'Indian Army',
          bloodGroup: prof.blood_group || 'O+',
          phone: prof.phone || '+91-9876540000',
          email: prof.email || `${prof.service_no?.toLowerCase()}@afms.nic.in`,
          address: prof.address || `Station HQ, ${prof.posting}`,
          nextOfKin: prof.emergency_contact || 'Family Next of Kin',
          allergies: prof.allergies || 'None Reported',
          serviceYears: prof.enlistment_date ? `${new Date().getFullYear() - new Date(prof.enlistment_date).getFullYear()} Years` : '6 Years',
          dspPackage: 'Defence Salary Package (DSP) - Gold Verified',
          lockEnabled: prof.lock_enabled ?? true,
          pin: prof.pin || '1234',
          bankAccount: prof.bank_account || {
            bankName: 'State Bank of India (SBI)',
            branch: 'Cantt Military Branch',
            accountNo: '30491829401',
            ifsc: 'SBIN0001234'
          }
        };
        setSoldierProfile(updated);
        setEditProfileForm(updated);
      }

      if (recRes.ok) setRecords(await recRes.json());
      if (scrRes.ok) setScreenings(await scrRes.json());
      if (rhbRes.ok) setRehabPlan(await rhbRes.json());
      if (grtRes.ok) setGrants(await grtRes.json());
      if (clmRes.ok) setClaims(await clmRes.json());
      if (cnsRes.ok) setConsultations(await cnsRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (audRes.ok) setAuditLogs(await audRes.json());
    } catch (err) {
      console.error('Error fetching soldier data:', err);
    } finally {
      setLoading(false);
    }
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
          soldier_id: soldierProfile.id || soldierProfile.serviceNo,
          ...bookingForm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecords(prev => [data.record, ...prev]);
        setConsultations(prev => [data.consultation, ...prev]);
        setBookingConfirmedSlip(data);
        showToast(`✓ Teleconsultation Booked! Reference No: ${data.reference_no || 'AFMS-TC-2026-8819'}`, 'success');
      } else {
        showToast('Failed to book teleconsultation.', 'warn');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while booking consultation.', 'warn');
    }
  }

  // Handle Submit Screening Questionnaire
  async function submitScreeningQuestionnaire() {
    if (!activeQuestionnaire) return;
    const questions = activeQuestionnaire.questions;
    const answersList = questions.map(q => {
      const a = questionnaireAnswers[q.id];
      return (typeof a === 'number') ? a : 0;
    });
    const calculatedScore = answersList.reduce((acc, v) => acc + v, 0);

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/screenings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          soldier_id: soldierProfile.id || soldierProfile.serviceNo || 'usr-soldier-1',
          questionnaire_type: activeQuestionnaire.id,
          answers: answersList,
          score: calculatedScore
        })
      });

      if (res.ok) {
        const data = await res.json();
        setScreenings(prev => [data, ...prev]);

        // Prepend new audit log entry
        const auditEntry = {
          id: `aud-${Date.now()}`,
          user_id: soldierProfile.serviceNo || '15489201A',
          user_role: 'SOLDIER',
          soldier_id: soldierProfile.serviceNo || '15489201A',
          action: 'PSYCHOMETRIC_SCREENING',
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          details: `Completed certified ${data.questionnaire_type} screening. Score: ${data.score}/${data.max_score} (${data.severity}). Tamper-sealed into Health Wallet.`,
          ip_address: '10.14.82.19 (Station HQ Secure Military Gateway)'
        };
        setAuditLogs(prev => [auditEntry, ...prev]);

        setActiveQuestionnaire(null);
        setQuestionnaireAnswers({});
        showToast(`✓ ${data.questionnaire_type} Complete! Score: ${data.score}/${data.max_score} (${data.severity})`, 'success');
      } else {
        showToast('Failed to record assessment.', 'warn');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error submitting screening.', 'warn');
    }
  }

  // Handle File Claim Grievance / Appeal Report
  async function handleFileDispute(e) {
    e.preventDefault();
    if (!disputeModalClaim || !disputeForm.report_title || !disputeForm.dispute_reason) {
      showToast('Please enter report title and reason for appeal.', 'warn');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/claims/dispute', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          claim_id: disputeModalClaim.id,
          ...disputeForm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setClaims(prev => prev.map(c => c.id === disputeModalClaim.id ? { ...c, dispute_report: data.dispute, has_dispute: true } : c));
        setDisputeModalClaim(null);
        setDisputeForm({ report_title: '', dispute_reason: '', evidence_summary: '' });
        showToast(`✓ Appeal Report Submitted! Official Tracking ID: ${data.dispute.dispute_id}`, 'success');
      } else {
        showToast('Failed to file appeal report.', 'warn');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error filing dispute.', 'warn');
    }
  }

  // Handle Add Personal Medical Record
  async function handleAddPersonalRecord(e) {
    e.preventDefault();
    if (!newRecordForm.title || !newRecordForm.diagnosis) {
      showToast('Please enter record title and clinical notes.', 'warn');
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/records', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          soldier_id: soldierProfile.serviceNo,
          type: newRecordForm.type,
          title: newRecordForm.title,
          hospital: newRecordForm.hospital,
          doctor_name: newRecordForm.doctor_name,
          diagnosis: newRecordForm.diagnosis,
          posting: soldierProfile.posting,
          is_mental_health: false
        })
      });
      if (res.ok) {
        const added = await res.json();
        setRecords(prev => [added, ...prev]);
        setIsAddRecordOpen(false);
        setNewRecordForm({ title: '', type: 'PRESCRIPTION', hospital: 'Base Hospital', doctor_name: 'Capt. Dr. Priya Nair, AMC', diagnosis: '' });
        showToast('✓ New health record cryptographically signed and added to wallet!', 'success');
      }
    } catch (err) {
      showToast('Failed to add record.', 'warn');
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
          soldier_id: soldierProfile.serviceNo,
          completed_exercise_ids: updatedExercises.filter(e => e.completed).map(e => e.id)
        })
      });
      showToast(isChecked ? '✓ Exercise completed and synced!' : 'Exercise marked as pending.', 'success');
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Pain Slider
  async function handlePainChange(newVal) {
    if (!rehabPlan) return;
    const updated = { ...rehabPlan, pain_level: newVal };
    setRehabPlan(updated);
    try {
      const headers = getAuthHeaders();
      await fetch('/api/rehab/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ soldier_id: soldierProfile.serviceNo, pain_level: newVal })
      });
      showToast(`Pain level updated to ${newVal}/10. Telemetry synced.`, 'success');
    } catch (err) {
      console.error(err);
    }
  }

  // Handle Save Profile Details
  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: editProfileForm.name,
          rank: editProfileForm.rank,
          unit: editProfileForm.unit,
          posting: editProfileForm.posting,
          branch: editProfileForm.branch,
          blood_group: editProfileForm.bloodGroup,
          phone: editProfileForm.phone,
          email: editProfileForm.email,
          address: editProfileForm.address,
          emergency_contact: editProfileForm.nextOfKin,
          allergies: editProfileForm.allergies,
          pin: editProfileForm.pin
        })
      });

      if (res.ok) {
        setSoldierProfile({ ...editProfileForm });
        localStorage.setItem('kavach_user_name', editProfileForm.name);
        localStorage.setItem('kavach_user_posting', editProfileForm.posting);
        setIsEditProfileOpen(false);
        showToast('✓ Soldier Profile successfully updated and saved to military node!', 'success');
      } else {
        showToast('Failed to update profile.', 'warn');
      }
    } catch (err) {
      showToast('Network error while saving profile.', 'warn');
    }
  }

  // Handle Password Change
  async function handleChangePassword(e) {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      showToast('Please enter a new password.', 'warn');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'warn');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/users/password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsChangePasswordOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('✓ Military PIN / Password updated successfully!', 'success');
      } else {
        showToast(data.error || 'Password update failed.', 'warn');
      }
    } catch (err) {
      showToast('Network error while updating password.', 'warn');
    }
  }

  // Handle Mark Notifications Read
  async function handleMarkNotificationsRead() {
    try {
      const headers = getAuthHeaders();
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: 'ALL' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('✓ All notifications marked as read.', 'success');
    } catch (err) {
      console.error(err);
    }
  }

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesCategory = walletCategory === 'ALL' || r.type === walletCategory;
      const matchesSearch = !walletSearch || 
        r.title.toLowerCase().includes(walletSearch.toLowerCase()) ||
        r.diagnosis.toLowerCase().includes(walletSearch.toLowerCase()) ||
        r.posting.toLowerCase().includes(walletSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [records, walletCategory, walletSearch]);

  const remainingExercises = useMemo(() => {
    if (!rehabPlan || !rehabPlan.exercises) return 0;
    return rehabPlan.exercises.filter(e => !e.completed).length;
  }, [rehabPlan]);

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (auditRoleFilter === 'ALL') return true;
      return log.user_role === auditRoleFilter;
    });
  }, [auditLogs, auditRoleFilter]);

  const questionnaireScore = useMemo(() => {
    if (!activeQuestionnaire) return 0;
    return Object.values(questionnaireAnswers).reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
  }, [activeQuestionnaire, questionnaireAnswers]);

  const questionnaireAnsweredCount = useMemo(() => {
    if (!activeQuestionnaire) return 0;
    return Object.keys(questionnaireAnswers).filter(k => typeof questionnaireAnswers[k] === 'number').length;
  }, [activeQuestionnaire, questionnaireAnswers]);

  const questionnaireSeverityPreview = useMemo(() => {
    if (!activeQuestionnaire) return { label: 'Normal', color: '#10b981' };
    const qType = activeQuestionnaire.id;
    const score = questionnaireScore;
    if (qType === 'PHQ-9') {
      if (score < 5) return { label: 'Minimal Depression', color: '#10b981' };
      if (score < 10) return { label: 'Mild Depression', color: '#eab308' };
      if (score < 15) return { label: 'Moderate Depression', color: '#f97316' };
      if (score < 20) return { label: 'Moderately Severe', color: '#ef4444' };
      return { label: 'Severe Depression', color: '#dc2626' };
    } else if (qType === 'GAD-7') {
      if (score < 5) return { label: 'Minimal Anxiety', color: '#10b981' };
      if (score < 10) return { label: 'Mild Anxiety', color: '#eab308' };
      if (score < 15) return { label: 'Moderate Anxiety', color: '#f97316' };
      return { label: 'Severe Anxiety', color: '#dc2626' };
    } else if (qType === 'PCL-5') {
      if (score < 21) return { label: 'Subthreshold / Normal', color: '#10b981' };
      if (score < 31) return { label: 'Mild Combat Stress', color: '#eab308' };
      if (score < 51) return { label: 'Probable PTSD (Elevated)', color: '#f97316' };
      return { label: 'Severe PTSD Reactivity', color: '#dc2626' };
    }
    return { label: 'Baseline', color: '#10b981' };
  }, [activeQuestionnaire, questionnaireScore]);

  const timerMins = Math.floor(routineSeconds / 60).toString().padStart(2, '0');
  const timerSecs = (routineSeconds % 60).toString().padStart(2, '0');

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f7faf8] text-slate-900'} font-sans`}>
      
      {/* Toast Notification Notification Banner */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-xs font-bold transition-all animate-bounce"
          style={{ background: toast.type === 'success' ? '#15803d' : '#be123c' }}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Universal Top Emergency Ticker */}
      <aside className="bg-emerald-950 text-emerald-100 px-6 py-1.5 text-xs font-medium flex justify-between items-center border-b border-emerald-900 overflow-hidden">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          <div className="inline-block animate-marquee">
            <span>🚨 24x7 ARMED FORCES HELPLINES:</span>
            <span className="mx-3">•</span>
            <span>📞 AFMS Tele-MANAS: 14416</span>
            <span className="mx-3">•</span>
            <span>📞 Army Sanjeevani Crisis: 1800-120-0012</span>
            <span className="mx-3">•</span>
            <span>📞 ECHS Toll-Free Support: 1800-114-115</span>
            <span className="mx-3">•</span>
            <span>🔒 AES-256-GCM Sovereign Encrypted • Append-Only Records</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={() => setIsHelplinesModalOpen(true)}
            className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition"
          >
            Directory 📋
          </button>
        </div>
      </aside>

      {/* 2. Main App Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-3.5 flex justify-between items-center shadow-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 flex-shrink-0 drop-shadow-md">
            <img src="../../assets/logo.svg" alt="Kavach Shield Logo" className="w-full h-full pointer-events-none select-none" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {t.appTitle}
              <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                {t.classification}
              </span>
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.tagline}</div>
          </div>
        </div>

        {/* Center Security Clearance Chip */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <span>🛡️</span>
          <span>SOVEREIGN ENCRYPTED • AES-256-GCM RECORD STORE</span>
        </div>

        {/* Right Soldier Profile Cluster */}
        <div className="flex items-center gap-3">
          
          {/* Quick Actions Dropdown Button */}
          <button 
            onClick={() => setIsQuickActionsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition"
          >
            <span>⚡</span>
            <span>{t.quickActions}</span>
          </button>

          {/* User Profile Pill */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs cursor-pointer hover:border-emerald-500 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-700 to-emerald-900 text-white font-bold text-xs flex items-center justify-center">
              {soldierProfile.name.split(' ').map(n=>n[0]).join('').slice(0, 2)}
            </div>
            <div className="text-left leading-tight hidden md:block">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white">{soldierProfile.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {soldierProfile.rank} • {soldierProfile.serviceNo}
              </div>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-base hover:border-emerald-500 transition shadow-xs relative"
              title="Notifications"
            >
              🔔
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      🔔 Notifications
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      {notifications.length} Total
                    </span>
                  </div>
                  <button 
                    onClick={handleMarkNotificationsRead}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center italic">No active notifications.</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          setSelectedNotification(n);
                          setIsNotifOpen(false);
                        }}
                        className={`p-3 rounded-xl border transition text-xs cursor-pointer hover:border-emerald-500 hover:shadow-xs ${
                          n.priority === 'HIGH' 
                            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900' 
                            : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            n.priority === 'HIGH' ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {n.type || 'NOTIFICATION'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.created_at ? n.created_at.slice(0, 10) : 'Recent'}
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 dark:text-white mb-0.5">{n.title}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">{n.message}</div>
                        <div className="mt-2 flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>From: {n.sender_name}</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Open Detail →</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-base hover:border-emerald-500 transition shadow-xs"
            title="Settings & Profile"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* 3. Top Navigation App Bar */}
      <nav className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-2 sticky top-[65px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'wallet' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>💼</span>
              <span>{t.walletTab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'wallet' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {records.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('teleconsult')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'teleconsult' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>🩺</span>
              <span>{t.teleconsultTab}</span>
            </button>

            <button 
              onClick={() => setActiveTab('stress')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'stress' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>🧠</span>
              <span>{t.stressTab}</span>
            </button>

            <button 
              onClick={() => setActiveTab('rehab')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'rehab' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>🏃</span>
              <span>{t.rehabTab}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {rehabPlan ? `${rehabPlan.completed_sessions}/${rehabPlan.total_sessions}` : '0/10'}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('grants')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'grants' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>🔐</span>
              <span>{t.grantsTab}</span>
            </button>

            <button 
              onClick={() => setActiveTab('claims')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'claims' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>📋</span>
              <span>{t.claimsTab}</span>
            </button>

            <button 
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>🛡️</span>
              <span>{t.auditTab || 'Security Audit Logs'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'audit' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {auditLogs.length}
              </span>
            </button>

          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>🛡️ SHA256-HMAC IMMUTABLE RECORD CHAIN</span>
          </div>
        </div>
      </nav>

      {/* 4. Main Body Content (Spacious, Uncluttered Layout) */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        
        {/* Top 4 Stat Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-lg flex-shrink-0">
              📁
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{t.statRecords}</div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{records.length}</div>
              <div className="text-[11px] text-slate-500">{t.statRecordsSub}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-lg flex-shrink-0">
              🏃
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{t.statRehab}</div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {rehabPlan ? `${rehabPlan.completed_sessions}/${rehabPlan.total_sessions}` : '0/10'}
              </div>
              <div className="text-[11px] text-slate-500">{t.statRehabSub}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-lg flex-shrink-0">
              🧠
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{t.statStress}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {screenings.length > 0 ? `${screenings[0].score}/${screenings[0].max_score}` : 'Normal'}
                </span>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{t.statStressSub}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-lg flex-shrink-0">
              📅
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{t.statNextConsult}</div>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {consultations.length > 0 ? consultations[0].date : 'On Demand'}
              </div>
              <div className="text-[11px] text-slate-500">
                {consultations.length > 0 ? consultations[0].doctor_name : 'AFMS Tele-Health Gateway'}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            TAB 1: SOVEREIGN HEALTH WALLET
            ==================================================================== */}
        {activeTab === 'wallet' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>💼</span> <span>{t.walletTab}</span>
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Tamper-proof encrypted records &bull; Verified across all transfers and retirement &bull; SHA-256 HMAC
                </div>
              </div>

              {/* Search Bar & Add Record Button */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <input 
                  type="text" 
                  value={walletSearch}
                  onChange={e => setWalletSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-64 focus:outline-none focus:border-emerald-600"
                />
                <button 
                  onClick={() => setIsAddRecordOpen(true)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>{t.addRecordBtn}</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition border border-slate-300 dark:border-slate-700"
                  title="Print Claim-Ready Dossier"
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              {[
                { id: 'ALL', label: t.filterAll },
                { id: 'INJURY', label: t.filterInjury },
                { id: 'SURGERY', label: t.filterSurgery },
                { id: 'X_RAY', label: t.filterXray },
                { id: 'PRESCRIPTION', label: t.filterRx },
                { id: 'TELECONSULT', label: t.filterTele }
              ].map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setWalletCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    walletCategory === cat.id 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Records Grid */}
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="text-3xl block mb-2">📂</span>
                <p className="text-sm font-bold">No health records found in this category.</p>
                <p className="text-xs text-slate-500 mt-1">Click "{t.addRecordBtn}" to add your first certified medical entry.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecords.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => setActiveRecordModal(r)}
                    className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-5 cursor-pointer transition shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          r.type === 'INJURY' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          r.type === 'SURGERY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          r.type === 'TELECONSULT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {r.type}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-bold">{r.date}</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5">{r.title}</h3>
                      <div className="text-xs text-slate-500 mb-2 font-mono">
                        📍 {r.posting} • 👨‍⚕️ {r.doctor_name}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                        {r.diagnosis}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="truncate max-w-[160px]" title={r.tamper_hash}>
                        🛡️ SHA256: {r.tamper_hash ? r.tamper_hash.slice(0, 10) + '...' : 'Verified'}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">Inspect →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 2: TELECONSULTATION MODULE
            ==================================================================== */}
        {activeTab === 'teleconsult' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🩺</span> <span>{t.teleconsultTab}</span>
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Book secure teleconsultations across Military Hospitals &bull; Auto-saves certified directives to Health Wallet
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Teleconsultation Form */}
              <form onSubmit={handleBookTeleconsult} className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Armed Force Branch:
                    </label>
                    <select 
                      value={bookingForm.branch} 
                      onChange={e => setBookingForm({ ...bookingForm, branch: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="Indian Army">Indian Army</option>
                      <option value="Indian Navy">Indian Navy</option>
                      <option value="Indian Air Force">Indian Air Force</option>
                      <option value="CRPF">CRPF</option>
                      <option value="BSF">BSF</option>
                      <option value="ITBP">ITBP</option>
                      <option value="CISF">CISF</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Base / Military Hospital:
                    </label>
                    <select 
                      value={bookingForm.hospital} 
                      onChange={e => setBookingForm({ ...bookingForm, hospital: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="Base Hospital, Delhi Cantt">Base Hospital, Delhi Cantt</option>
                      <option value="Command Hospital (Central), Lucknow">Command Hospital (Central), Lucknow</option>
                      <option value="Command Hospital (Southern), Pune">Command Hospital (Southern), Pune</option>
                      <option value="Military Hospital, Jaipur">Military Hospital, Jaipur</option>
                      <option value="Military Hospital, Tezpur">Military Hospital, Tezpur</option>
                      <option value="Command Hospital (Northern), Udhampur">Command Hospital (Northern), Udhampur</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Clinical Department / Specialty:
                    </label>
                    <select 
                      value={bookingForm.specialty} 
                      onChange={e => {
                        const newSpec = e.target.value;
                        const docList = DEPARTMENT_DOCTORS[newSpec] || [];
                        const firstDoc = docList[0] || { id: 'usr-doctor-1', name: 'Medical Officer' };
                        setBookingForm({
                          ...bookingForm,
                          specialty: newSpec,
                          doctorId: firstDoc.id,
                          doctorName: firstDoc.name
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="Orthopedics & Joint Reconstruction">Orthopedics & Joint Reconstruction</option>
                      <option value="General & Combat Medicine">General & Combat Medicine</option>
                      <option value="PTSD & Clinical Psychology">PTSD & Clinical Psychology</option>
                      <option value="Physiotherapy & Musculoskeletal Rehab">Physiotherapy & Musculoskeletal Rehab</option>
                      <option value="Combat Audiology & ENT">Combat Audiology & ENT</option>
                      <option value="Cardiology">Cardiology</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Attending Medical Officer ({bookingForm.specialty.split(' ')[0]}):
                    </label>
                    <select 
                      value={bookingForm.doctorName} 
                      onChange={e => {
                        const selName = e.target.value;
                        const docList = DEPARTMENT_DOCTORS[bookingForm.specialty] || [];
                        const match = docList.find(d => d.name === selName) || { id: 'usr-doctor-1', name: selName };
                        setBookingForm({ ...bookingForm, doctorName: match.name, doctorId: match.id });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      {(DEPARTMENT_DOCTORS[bookingForm.specialty] || []).map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Appointment Date:
                    </label>
                    <input 
                      type="date" 
                      value={bookingForm.date} 
                      onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Time Slot:
                    </label>
                    <select 
                      value={bookingForm.timeSlot} 
                      onChange={e => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:45 AM">11:45 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    Reason for Consultation / Symptoms:
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

              {/* Consultation History Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                    Recent Teleconsultations
                  </h3>
                  <div className="space-y-3">
                    {consultations.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No previous teleconsultations booked.</div>
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
            
            {screenings.length === 0 ? (
              /* UNASSESSED STATE FOR NEW PERSONNEL */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                  🌱
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                  No Psychological Assessments on Record Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6 leading-relaxed">
                  Regular private self-assessments protect operational readiness and detect psychological strain early with zero command stigma. Your screening responses are strictly confidential and sealed under AFMS mental health separation.
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <button 
                    onClick={() => { setActiveQuestionnaire(QUESTIONNAIRE_DEFS['PHQ-9']); setQuestionnaireAnswers({}); }} 
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>🧠</span> <span>Take PHQ-9 (Depression Check) →</span>
                  </button>
                  <button 
                    onClick={() => { setActiveQuestionnaire(QUESTIONNAIRE_DEFS['PCL-5']); setQuestionnaireAnswers({}); }} 
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>🛡️</span> <span>Take PCL-5 (Combat Trauma) →</span>
                  </button>
                  <button 
                    onClick={() => { setActiveQuestionnaire(QUESTIONNAIRE_DEFS['GAD-7']); setQuestionnaireAnswers({}); }} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>📈</span> <span>Take GAD-7 (Anxiety) →</span>
                  </button>
                </div>
              </div>
            ) : (() => {
              const latestScr = screenings[0];
              const plotScr = screenings.slice(0, 6).reverse();
              const indicatorColor = latestScr.color_code || (latestScr.score >= 10 ? '#ef4444' : (latestScr.score >= 5 ? '#f59e0b' : '#10b981'));
              const pts = plotScr.map((s, idx) => ({
                x: 60 + (idx * (530 / Math.max(plotScr.length - 1, 1))),
                y: 165 - ((s.score / (s.max_score || 27)) * 125),
                score: s.score,
                label: s.date ? s.date.slice(5) : `Wk ${idx + 1}`,
                type: s.questionnaire_type
              }));

              const minimalCount = screenings.filter(s => s.score < 5).length;
              const mildCount = screenings.filter(s => s.score >= 5 && s.score < 10).length;
              const modCount = screenings.filter(s => s.score >= 10 && s.score < 15).length;
              const sevCount = screenings.filter(s => s.score >= 15).length;
              const totalCount = screenings.length || 1;

              return (
                <div className="space-y-6">
                  {/* Proactive Counselor Nudge Banner if elevated */}
                  {screenings.some(s => s.counselor_nudge_triggered) && (
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">⚠️</span>
                        <div>
                          <strong className="text-sm font-extrabold text-amber-900 dark:text-amber-200 block mb-1">
                            Your recent stress scores indicate elevated tension — a confidential counselor is available.
                          </strong>
                          <span className="text-xs text-amber-800 dark:text-amber-300">
                            AFMS Psychological Support Cell (Dr. Sunita Rao) is on duty. Completely private with zero command exposure.
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => showToast('Direct Confidential Line to Dr. Sunita Rao (AFMS Psychological Cell) connected.', 'success')}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl whitespace-nowrap transition shadow-xs flex items-center gap-1.5"
                      >
                        <span>📞</span> <span>Connect with Counselor</span>
                      </button>
                    </div>
                  )}

                  {/* Stress Graphs Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dynamic Line Graph */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>📈</span> <span>Dynamic Stress Score Trend ({latestScr.questionnaire_type})</span>
                          </h3>
                          <div className="text-xs text-slate-500">Calculated from validated self-assessments over operational timeline</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: indicatorColor }}></span>
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black font-mono" style={{ backgroundColor: `${indicatorColor}20`, color: indicatorColor }}>
                            {latestScr.severity.toUpperCase()} ({latestScr.score}/{latestScr.max_score})
                          </span>
                        </div>
                      </div>

                      <div className="relative h-56 flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 650 200" className="overflow-visible">
                          <line x1="50" y1="170" x2="620" y2="170" stroke="#cbd5e1" strokeWidth="1" />
                          <line x1="50" y1="115" x2="620" y2="115" stroke="#e2e8f0" strokeDasharray="4 4" />
                          <line x1="50" y1="60" x2="620" y2="60" stroke="#fecaca" strokeDasharray="4 4" />

                          <path 
                            d={pts.length > 1 ? `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}` : `M 50 ${pts[0]?.y || 120} L 600 ${pts[0]?.y || 120}`} 
                            fill="none" 
                            stroke={indicatorColor} 
                            strokeWidth="3.5" 
                          />

                          {pts.map((pt, i) => (
                            <g key={i}>
                              <circle cx={pt.x} cy={pt.y} r={i === pts.length - 1 ? 7 : 4.5} fill={i === pts.length - 1 ? indicatorColor : '#15803d'} stroke="#fff" strokeWidth="2" />
                              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">{pt.score}</text>
                              <text x={pt.x} y="190" textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">{pt.label}</text>
                            </g>
                          ))}

                          {pts.length > 0 && (
                            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="14" fill="none" stroke={indicatorColor} strokeWidth="2.5" opacity="0.8">
                              <animate attributeName="r" values="7;18;7" dur="1.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </svg>
                      </div>
                    </div>

                    {/* Donut Symptom Breakdown */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">🥧 Symptom Distribution</h3>
                        <div className="text-xs text-slate-500">Historical Check-in Assessment</div>
                      </div>

                      <div className="flex flex-col items-center justify-center my-4">
                        <svg width="140" height="140" viewBox="0 0 200 200">
                          <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" strokeWidth="26" strokeDasharray="110 330" />
                          <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f59e0b" strokeWidth="26" strokeDasharray="154 286" strokeDashoffset="-110" />
                          <circle cx="100" cy="100" r="70" fill="transparent" stroke="#ea580c" strokeWidth="26" strokeDasharray="132 308" strokeDashoffset="-264" />
                          <circle cx="100" cy="100" r="70" fill="transparent" stroke="#e11d48" strokeWidth="26" strokeDasharray="44 396" strokeDashoffset="-396" />
                          <text x="100" y="105" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a">{latestScr.questionnaire_type}</text>
                        </svg>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300 mt-3 font-medium">
                          <span><span className="text-emerald-600">●</span> Minimal ({Math.round(minimalCount/totalCount*100)}%)</span>
                          <span><span className="text-amber-500">●</span> Mild ({Math.round(mildCount/totalCount*100)}%)</span>
                          <span><span className="text-orange-500">●</span> Moderate ({Math.round(modCount/totalCount*100)}%)</span>
                          <span><span className="text-rose-600">●</span> Severe ({Math.round(sevCount/totalCount*100)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Globally Validated Questionnaires Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">PHQ-9 Depression</strong>
                  <span className="text-xs font-mono font-black text-rose-600">
                    {screenings.find(s => s.questionnaire_type === 'PHQ-9') ? `${screenings.find(s => s.questionnaire_type === 'PHQ-9').score}/27` : 'Unassessed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Evaluates mood, sleep quality, and energy over the previous 14 days (9 questions).</p>
                <button 
                  onClick={() => { setActiveQuestionnaire(QUESTIONNAIRE_DEFS['PHQ-9']); setQuestionnaireAnswers({}); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                >
                  Take PHQ-9 Check-in →
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">PCL-5 Combat PTSD</strong>
                  <span className="text-xs font-mono font-black text-amber-600">
                    {screenings.find(s => s.questionnaire_type === 'PCL-5') ? `${screenings.find(s => s.questionnaire_type === 'PCL-5').score}/80` : 'Unassessed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Screens combat trauma recall, hyperarousal, and emotional numbing (20 questions).</p>
                <button 
                  onClick={() => { setActiveQuestionnaire(QUESTIONNAIRE_DEFS['PCL-5']); setQuestionnaireAnswers({}); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                >
                  Take PCL-5 Assessment →
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">GAD-7 Anxiety Scale</strong>
                  <span className="text-xs font-mono font-black text-emerald-600">
                    {screenings.find(s => s.questionnaire_type === 'GAD-7') ? `${screenings.find(s => s.questionnaire_type === 'GAD-7').score}/21` : 'Unassessed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Measures generalized somatic tension, nervousness, and restlessness (7 questions).</p>
                <button 
                  onClick={() => { setActiveQuestionnaire(QUESTIONNAIRE_DEFS['GAD-7']); setQuestionnaireAnswers({}); }}
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
                    Capt. Dr. Priya Nair &amp; Lt. Rajesh Kumar flagged this session. Completing daily drills prevents joint stiffness relapse.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById('dailyExerciseSection');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2 rounded-xl whitespace-nowrap transition shadow-xs"
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
                  <div className="text-xs text-slate-500">Protocol Progress</div>
                </div>
              </div>

              {/* Queue Status Bar & Countdown Timer */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <strong className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                    {t.todayQueue}:
                  </strong>
                  <span className={`text-sm font-black ${remainingExercises > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {remainingExercises > 0 ? `⏳ ${remainingExercises} ${t.exercisesLeft}` : t.allDone}
                  </span>
                </div>

                {/* Digital Stopwatch Timer */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">{t.routineTimer}:</span>
                  <span className="font-mono text-xl font-black px-3.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-900 dark:text-emerald-400 shadow-xs">
                    {timerMins}:{timerSecs}
                  </span>
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
                  >
                    {isTimerRunning ? t.pauseTimer : t.startTimer}
                  </button>
                </div>
              </div>

              {/* Exercises Checklist */}
              <div id="dailyExerciseSection" className="space-y-3 mb-6">
                {rehabPlan.exercises && rehabPlan.exercises.map(ex => (
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
                        <div className="text-xs text-slate-500 font-mono">{ex.reps}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => showToast(`Playing 3D physiotherapy guidance demo for ${ex.name}...`, 'success')}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      3D Form Guide ▷
                    </button>
                  </div>
                ))}
              </div>

              {/* Daily Pain Level Log Slider */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Log Today's Knee Pain Level (VAS Scale 0-10):
                  </span>
                  <span className={`text-sm font-black font-mono px-2.5 py-0.5 rounded-md ${
                    (rehabPlan.pain_level || 4) <= 3 ? 'bg-emerald-100 text-emerald-800' :
                    (rehabPlan.pain_level || 4) <= 6 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {rehabPlan.pain_level || 4} / 10
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={rehabPlan.pain_level || 4}
                  onChange={e => handlePainChange(parseInt(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>0 - No Pain</span>
                  <span>5 - Moderate (Affects Running)</span>
                  <span>10 - Severe (Immobilized)</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: SOVEREIGN ACCESS GRANTS & REVOCATION
            ==================================================================== */}
        {activeTab === 'grants' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔐</span> <span>Sovereign Access Consent Control</span>
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                You possess sole sovereign ownership of your records &bull; Time-stamped consent expires automatically &bull; Instant one-tap revocation
              </div>
            </div>

            <div className="space-y-4">
              {grants.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center italic">No active external access grants.</div>
              ) : (
                grants.map(g => (
                  <div key={g.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{g.granted_to_role} ACCESS</strong>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${g.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {g.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Purpose: {g.purpose || 'Clinical Follow-up & Evaluation'}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                        ⏱️ Time-Stamped Expiry: {g.expiry_date}
                      </div>
                    </div>

                    <div>
                      {g.status === 'ACTIVE' ? (
                        <button 
                          onClick={async () => {
                            const headers = getAuthHeaders();
                            const res = await fetch('/api/access-grants/toggle', {
                              method: 'POST',
                              headers,
                              body: JSON.stringify({ grant_id: g.id, role: g.granted_to_role, soldier_id: soldierProfile.id || soldierProfile.serviceNo })
                            });
                            if (res.ok) {
                              setGrants(prev => prev.map(item => item.id === g.id ? { ...item, status: 'REVOKED' } : item));
                              showToast('✓ Access Grant instantly revoked! Clinician barred from reading records.', 'success');
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs whitespace-nowrap"
                        >
                          🔒 Revoke Access Now
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            const headers = getAuthHeaders();
                            const res = await fetch('/api/access-grants/toggle', {
                              method: 'POST',
                              headers,
                              body: JSON.stringify({ grant_id: g.id, role: g.granted_to_role, soldier_id: soldierProfile.id || soldierProfile.serviceNo })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setGrants(prev => prev.map(item => item.id === g.id ? { ...item, status: 'ACTIVE', expiry_date: data.grant.expiry_date } : item));
                              showToast('✓ Access Re-Granted! Valid for 30 days.', 'success');
                            }
                          }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs whitespace-nowrap"
                        >
                          🔓 Re-Grant Access (30 Days)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 6: ECHS CLAIMS ADJUDICATION TRACKER
            ==================================================================== */}
        {activeTab === 'claims' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span> <span>ECHS Disability Claim Tracker</span>
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Real-time tracking of battle casualty disability pension &bull; Tamper-proof medical dossier attached &bull; Transparent Dispute &amp; Appeal Redressal
              </div>
            </div>

            {claims.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-3xl block mb-2">📋</span>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No active ECHS claims found for your service profile.</p>
                <p className="text-xs text-slate-400 mt-1">Disability claims filed during medical discharge or annual board will synchronize here.</p>
              </div>
            ) : (
              claims.map(claim => (
                <div key={claim.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-400 uppercase">CLAIM ID: {claim.id}</div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {claim.title}
                      </h3>
                    </div>
                    <span className="bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full font-mono">
                      STAGE {claim.current_stage || 3}: {claim.status_label || 'UNDER ADJUDICATION'}
                    </span>
                  </div>

                  {/* 5-Stage Moving Line */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs mb-6">
                    {(claim.stages || [
                      { id: 1, name: "Submitted", date: "10 Oct 2024", completed: true, note: "Records Verified" },
                      { id: 2, name: "Waiting for Verification", date: "28 Oct 2024", completed: true, note: "Base Hospital Board" },
                      { id: 3, name: "Pending", date: "Current Review", completed: true, current: true, note: "Disability Directorate" },
                      { id: 4, name: "Waiting for Approval", date: "Pending", completed: false, note: "Financial Sanction" },
                      { id: 5, name: "Claim Sanctioned / Rejected", date: "Pending", completed: false, note: "PPO Order" }
                    ]).map((stg, sIdx) => {
                      const isDone = stg.completed && !stg.current;
                      const isCurr = stg.current || stg.id === claim.current_stage;
                      return (
                        <div 
                          key={sIdx}
                          className={`p-3 rounded-xl border transition ${
                            isCurr ? 'bg-blue-50 border-2 border-blue-500 text-blue-900 shadow-xs dark:bg-blue-950/40 dark:text-blue-200' :
                            isDone ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300' :
                            'bg-slate-100 border border-slate-200 text-slate-400 dark:bg-slate-800/60 dark:border-slate-700'
                          }`}
                        >
                          <div className={`font-bold text-[10px] uppercase ${isCurr ? 'text-blue-700 dark:text-blue-300' : isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            Stage {stg.id}: {stg.name}
                          </div>
                          <div className="font-extrabold mt-1 text-xs">{stg.date || 'Pending'}</div>
                          <div className="text-[10px] opacity-80 mt-0.5">{stg.note || (isDone ? '✓ Verified' : 'In Queue')}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grievance / Appeal Dispute Column */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                        Dispute &amp; Grievance Redressal Status:
                      </div>
                      {claim.dispute_report || claim.has_dispute ? (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                              ⚠️ Active Grievance Report: {claim.dispute_report?.report_title || 'Disability Board Percentage Dispute'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold">
                              {claim.dispute_report?.status || 'UNDER_ECHS_GRIEVANCE_BOARD'}
                            </span>
                          </div>
                          <div className="text-xs text-amber-900 dark:text-amber-200">
                            <strong>Reason:</strong> {claim.dispute_report?.dispute_reason || 'Medical board assessment dispute.'}
                          </div>
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-1">
                            Tracking ID: {claim.dispute_report?.dispute_id || 'ECHS-DISP-2026-8812'} &bull; Date: {claim.dispute_report?.created_at?.slice(0, 10) || 'Today'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          No dispute filed. If your claim percentage is contested or rejected by the Medical Board, you may file an official ECHS Grievance Report with supporting wallet records.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={() => {
                          setDisputeModalClaim(claim);
                          setDisputeForm({ report_title: '', dispute_reason: '', evidence_summary: '' });
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                      >
                        <span>📝</span>
                        <span>File Grievance / Appeal Report</span>
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
                      >
                        🖨️ Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 7: SOVEREIGN SECURITY AUDIT LOGS & ACCESS TRAIL
            ==================================================================== */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🛡️</span> <span>Sovereign Security &amp; Access Audit Trail</span>
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Cryptographically sealed, append-only security logs &bull; Zero undetected tampering &bull; Strict RBAC and Sovereign Soldier Consent
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Export Certified Audit Dossier</span>
                </button>
              </div>
            </div>

            {/* Security Architecture Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Recorded Events</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{auditLogs.length}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ 100% Append-Only Persisted</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Command Interception</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">0 Breach Attempts</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Zero Command Exposure Barrier</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Cryptographic Algorithm</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">AES-256-GCM</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">SHA-256 HMAC Hash Chain</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Access Status</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">ACTIVE CONSENT</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sovereign Soldier Control</div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {['ALL', 'SOLDIER', 'DOCTOR', 'COUNSELOR', 'CLAIMS_OFFICER', 'SYSTEM'].map(f => (
                <button
                  key={f}
                  onClick={() => setAuditRoleFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    auditRoleFilter === f 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f === 'ALL' ? 'All Roles' : f}
                </button>
              ))}
            </div>

            {/* Audit Log Table / Cards */}
            <div className="space-y-3">
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                  No security audit events found matching the selected filter.
                </div>
              ) : (
                filteredAuditLogs.map(log => (
                  <div key={log.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition hover:border-emerald-500">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded uppercase ${
                          log.status === 'SUCCESS' || log.status === 'ALLOWED' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' 
                            : (log.status === 'REVOKED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200')
                        }`}>
                          {log.status || 'ALLOWED'}
                        </span>
                        <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-400">&bull;</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {log.user_role} ({log.user_id})
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {log.details}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-2">
                        <span>⏱️ {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : 'Just now'}</span>
                        <span>&bull;</span>
                        <span>IP: {log.ip_address || '10.14.82.19 (Mil Gateway)'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 shadow-xs">
                        <span>🛡️</span>
                        <span>HMAC Sealed</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ====================================================================
          QUICK ACTIONS DRAWER (DECLUTTERS DASHBOARD!)
          ==================================================================== */}
      {isQuickActionsOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>⚡</span> <span>{t.quickActions}</span>
                </h3>
                <button 
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setIsQuickActionsOpen(false); setIsQrModalOpen(true); }}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left transition flex items-center gap-3.5"
                >
                  <span className="text-2xl">📱</span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">Emergency Medical QR Card</div>
                    <div className="text-[11px] text-slate-500">Scan offline in combat zone for blood group, allergies &amp; ICE</div>
                  </div>
                </button>

                <button 
                  onClick={() => { setIsQuickActionsOpen(false); setIsAddRecordOpen(true); }}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left transition flex items-center gap-3.5"
                >
                  <span className="text-2xl">✚</span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">Add Personal Health Document</div>
                    <div className="text-[11px] text-slate-500">Append test report, prescription, or surgery record with HMAC seal</div>
                  </div>
                </button>

                <button 
                  onClick={() => { setIsQuickActionsOpen(false); window.print(); }}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left transition flex items-center gap-3.5"
                >
                  <span className="text-2xl">🖨️</span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">Print Claim-Ready Dossier</div>
                    <div className="text-[11px] text-slate-500">Clean formatted printout for ECHS Disability Board</div>
                  </div>
                </button>

                <button 
                  onClick={() => { setIsQuickActionsOpen(false); setIsHelplinesModalOpen(true); }}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left transition flex items-center gap-3.5"
                >
                  <span className="text-2xl">📞</span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">24x7 Military Crisis Helpline Directory</div>
                    <div className="text-[11px] text-slate-500">AFMS Tele-MANAS, Army Sanjeevani &amp; Welfare cells</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center font-mono">
              KAVACH v2.4 &bull; SECURE MILITARY HEALTH NODE
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SETTINGS & SOLDIER PROFILE DRAWER
          ==================================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>⚙️</span> <span>{t.settings}</span>
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Comprehensive Soldier Profile Card */}
              <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50 dark:from-emerald-950/40 dark:to-slate-900 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
                <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-900 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                    {soldierProfile.name.split(' ').map(n=>n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">{soldierProfile.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {soldierProfile.rank} &bull; {soldierProfile.serviceNo}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {soldierProfile.unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Current Station</span>
                    <strong className="text-slate-800 dark:text-slate-200">{soldierProfile.posting}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Armed Force Branch</span>
                    <strong className="text-slate-800 dark:text-slate-200">{soldierProfile.branch}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Blood Group</span>
                    <strong className="text-rose-600 font-bold">{soldierProfile.bloodGroup}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Drug Allergies</span>
                    <strong className="text-amber-600 font-bold">{soldierProfile.allergies}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Phone Number</span>
                    <strong className="text-slate-800 dark:text-slate-200">{soldierProfile.phone}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Official Email</span>
                    <strong className="text-slate-800 dark:text-slate-200 break-all">{soldierProfile.email}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Home Station Address</span>
                    <strong className="text-slate-800 dark:text-slate-200">{soldierProfile.address}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    🛡️ App Lock: {soldierProfile.lockEnabled ? 'PIN Protected (1234)' : 'Disabled'}
                  </span>
                  <button 
                    onClick={() => {
                      setEditProfileForm({ ...soldierProfile });
                      setIsEditProfileOpen(true);
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    {t.editProfileBtn}
                  </button>
                </div>
              </div>

              {/* Language Switcher */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  🌐 Language / भाषा:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      setLanguage('en');
                      showToast('Language updated to English', 'success');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      language === 'en' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    English (Military)
                  </button>
                  <button 
                    onClick={() => {
                      setLanguage('hi');
                      showToast('भाषा बदलकर हिंदी कर दी गई है', 'success');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      language === 'hi' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    हिंदी (Hindi)
                  </button>
                </div>
              </div>

              {/* Dark / Light Mode */}
              <div className="flex justify-between items-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold">🌓 Interface Theme:</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-xs"
                >
                  {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </div>

              {/* Password Change Button */}
              <div>
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center justify-center gap-2"
                >
                  <span>{t.changePasswordBtn}</span>
                </button>
              </div>

            </div>

            {/* Single Clean Logout Button */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '../../auth/login.html';
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <span>{t.logoutBtn}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EDIT SOLDIER PROFILE (REAL PERSISTENCE!)
          ==================================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400">
                ✏️ Edit Soldier Profile Details
              </h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Full Name:</label>
                  <input 
                    type="text" 
                    value={editProfileForm.name} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                    required 
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Military Rank:</label>
                  <input 
                    type="text" 
                    value={editProfileForm.rank} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, rank: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Unit / Regiment:</label>
                  <input 
                    type="text" 
                    value={editProfileForm.unit} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, unit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                    required 
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Current Station:</label>
                  <input 
                    type="text" 
                    value={editProfileForm.posting} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, posting: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Phone Number:</label>
                  <input 
                    type="text" 
                    value={editProfileForm.phone} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Official Email:</label>
                  <input 
                    type="email" 
                    value={editProfileForm.email} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Home Address / Station:</label>
                <input 
                  type="text" 
                  value={editProfileForm.address} 
                  onChange={e => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Blood Group:</label>
                  <input 
                    type="text" 
                    value={editProfileForm.bloodGroup} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, bloodGroup: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" 
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">App Lock PIN (4 Digits):</label>
                  <input 
                    type="text" 
                    maxLength="4"
                    value={editProfileForm.pin} 
                    onChange={e => setEditProfileForm({ ...editProfileForm, pin: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsEditProfileOpen(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl">Save Changes →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CHANGE PASSWORD / MILITARY PIN (REAL PERSISTENCE!)
          ==================================================================== */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400">
                🔐 Change Military PIN
              </h3>
              <button onClick={() => setIsChangePasswordOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Current Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">New Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new military password"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Confirm New Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsChangePasswordOpen(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD PERSONAL HEALTH RECORD (REAL PERSISTENCE!)
          ==================================================================== */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400">
                ✚ Add Certified Medical Entry to Wallet
              </h3>
              <button onClick={() => setIsAddRecordOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddPersonalRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Record Type:</label>
                  <select 
                    value={newRecordForm.type}
                    onChange={e => setNewRecordForm({ ...newRecordForm, type: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="PRESCRIPTION">Medical Prescription</option>
                    <option value="INJURY">Battle / Physical Injury</option>
                    <option value="SURGERY">Surgical Intervention</option>
                    <option value="X_RAY">Radiology / Imaging Report</option>
                    <option value="TELECONSULT">Teleconsultation Summary</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Attending Hospital:</label>
                  <input 
                    type="text" 
                    value={newRecordForm.hospital}
                    onChange={e => setNewRecordForm({ ...newRecordForm, hospital: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Record Title:</label>
                <input 
                  type="text" 
                  value={newRecordForm.title}
                  onChange={e => setNewRecordForm({ ...newRecordForm, title: e.target.value })}
                  placeholder="e.g. Annual Combat Fitness Review / Knee Ultrasound"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Attending Doctor Name:</label>
                <input 
                  type="text" 
                  value={newRecordForm.doctor_name}
                  onChange={e => setNewRecordForm({ ...newRecordForm, doctor_name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Clinical Evaluation / Prescription Notes:</label>
                <textarea 
                  rows="3"
                  value={newRecordForm.diagnosis}
                  onChange={e => setNewRecordForm({ ...newRecordForm, diagnosis: e.target.value })}
                  placeholder="Enter clinical assessment, dosage, and physician directives..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                ></textarea>
              </div>

              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                🛡️ Record is cryptographically signed with SHA-256 HMAC and appended permanently to soldier wallet.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddRecordOpen(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl">Sign &amp; Append Record →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EMERGENCY MEDICAL QR CARD
          ==================================================================== */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl text-center">
            <h3 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400 mb-1">
              📱 Combat Emergency QR Health Card
            </h3>
            <p className="text-xs text-slate-500 mb-4">Instantly scannable offline by combat medics</p>

            <div className="bg-white p-4 rounded-xl border-2 border-slate-800 inline-block mb-4 shadow-sm">
              <svg width="150" height="150" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#ffffff" />
                <rect x="10" y="10" width="25" height="25" fill="#000" />
                <rect x="15" y="15" width="15" height="15" fill="#fff" />
                <rect x="18" y="18" width="9" height="9" fill="#000" />
                <rect x="65" y="10" width="25" height="25" fill="#000" />
                <rect x="70" y="15" width="15" height="15" fill="#fff" />
                <rect x="73" y="18" width="9" height="9" fill="#000" />
                <rect x="10" y="65" width="25" height="25" fill="#000" />
                <rect x="15" y="70" width="15" height="15" fill="#fff" />
                <rect x="18" y="73" width="9" height="9" fill="#000" />
                <rect x="45" y="15" width="10" height="20" fill="#000" />
                <rect x="40" y="45" width="20" height="20" fill="#000" />
                <rect x="70" y="55" width="15" height="15" fill="#000" />
              </svg>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1 text-left font-mono mb-4">
              <div><strong>Name:</strong> {soldierProfile.name}</div>
              <div><strong>Service No:</strong> {soldierProfile.serviceNo}</div>
              <div><strong>Blood Group:</strong> <span className="text-rose-600 font-bold">{soldierProfile.bloodGroup}</span></div>
              <div><strong>ICE Contact:</strong> {soldierProfile.nextOfKin}</div>
              <div><strong>Allergies:</strong> <span className="text-amber-600 font-bold">{soldierProfile.allergies}</span></div>
            </div>

            <button onClick={() => setIsQrModalOpen(false)} className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl">Close Card</button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CRISIS HELPLINES DIRECTORY
          ==================================================================== */}
      {isHelplinesModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-black uppercase text-rose-700">📞 24x7 Armed Forces Helplines</h3>
              <button onClick={() => setIsHelplinesModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">AFMS Tele-MANAS (Mental Health)</div>
                  <div className="text-[11px] text-slate-500">24x7 Confidential Psychological Support</div>
                </div>
                <a href="tel:14416" className="bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg">14416</a>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">Army Sanjeevani Crisis Helpline</div>
                  <div className="text-[11px] text-slate-500">Emergency Suicide Prevention &amp; Counseling</div>
                </div>
                <a href="tel:18001200012" className="bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg">1800-120-0012</a>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">ECHS Central Toll-Free Helpdesk</div>
                  <div className="text-[11px] text-slate-500">Veteran Medical Treatment &amp; Claim Enquiries</div>
                </div>
                <a href="tel:1800114115" className="bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg">1800-114-115</a>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">Army Medical Corps (AMC) Welfare Cell</div>
                  <div className="text-[11px] text-slate-500">Base Hospital Patient Coordination</div>
                </div>
                <a href="tel:1904" className="bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg">1904</a>
              </div>
            </div>

            <button onClick={() => setIsHelplinesModalOpen(false)} className="w-full mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 rounded-xl">Close</button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: LIVE VIDEO TELECONSULTATION SIMULATION WINDOW
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
              <button onClick={() => setActiveVideoCall(null)} className="text-slate-400 hover:text-white font-bold">✕ Close</button>
            </div>

            <div className="bg-slate-950 rounded-xl h-60 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-800 text-white text-xl font-black flex items-center justify-center shadow-lg border-2 border-emerald-400 mb-2">
                PN
              </div>
              <div className="font-extrabold text-sm">{activeVideoCall.doctor_name || 'Capt. Dr. Priya Nair, AMC'}</div>
              <div className="text-xs text-slate-400 font-mono">{activeVideoCall.specialty} &bull; {activeVideoCall.hospital}</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-2">● Call Duration: 04:12 &bull; 1080p Encrypted TLS 1.3</div>

              <div className="absolute bottom-3 right-3 w-24 h-16 bg-slate-800 border-2 border-slate-600 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-300">
                <span>{soldierProfile.name}</span>
                <span className="text-emerald-400 text-[8px]">● Live Feed</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs mb-4">
              <strong className="text-emerald-400 block mb-1">Doctor's Clinical Notes (Auto-Saved to Health Wallet):</strong>
              <p className="text-slate-300 leading-relaxed">
                "Patient evaluated for knee stiffness. Range of motion improved to 115°. Prescribed continuation of Quad setting drills. Tab Glucosamine OD x 30 days. Follow-up scheduled in 14 days."
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setActiveVideoCall(null);
                  setActiveTab('wallet');
                  showToast('✓ Teleconsult record verified in Health Wallet!', 'success');
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
          MODAL: CERTIFIED CLINICAL DOCUMENT MODAL (RECORD INSPECT)
          ==================================================================== */}
      {activeRecordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <span className="text-xs font-mono font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                {activeRecordModal.type} &bull; OFFICIAL MEDICAL DOSSIER
              </span>
              <button onClick={() => setActiveRecordModal(null)} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold">✕</button>
            </div>

            <h3 className="text-base font-black mb-1">{activeRecordModal.title}</h3>
            <div className="text-xs text-slate-500 font-mono mb-4">
              Posting: {activeRecordModal.posting} &bull; Date: {activeRecordModal.date}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs leading-relaxed mb-4">
              <strong className="block text-slate-900 dark:text-white mb-1">Clinical Evaluation &amp; Directives:</strong>
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
                onClick={() => {
                  window.print();
                  showToast('Exporting certified medical document to PDF...', 'success');
                }}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                📥 Download Certified ECHS PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: INTERACTIVE PSYCHOMETRIC QUESTIONNAIRE (PHQ-9, GAD-7, PCL-5)
          ==================================================================== */}
      {activeQuestionnaire && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative my-8 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-3 flex-shrink-0">
              <div>
                <span className="text-[10px] font-mono font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                  CLINICAL SELF-ASSESSMENT &bull; {activeQuestionnaire.id}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {activeQuestionnaire.title}
                </h3>
              </div>
              <button 
                onClick={() => { setActiveQuestionnaire(null); setQuestionnaireAnswers({}); }} 
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Live Progress & Score Calculation Strip */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Progress: {questionnaireAnsweredCount} of {activeQuestionnaire.questions.length} Questions Answered</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold">
                    {Math.round((questionnaireAnsweredCount / activeQuestionnaire.questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(questionnaireAnsweredCount / activeQuestionnaire.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Dynamic Live Calculated Score Box */}
              <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0">
                <div className="text-right">
                  <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Calculated Score</div>
                  <div className="text-base font-black font-mono leading-none mt-0.5 text-slate-900 dark:text-white">
                    {questionnaireScore} <span className="text-xs text-slate-400">/ {activeQuestionnaire.max_score || (activeQuestionnaire.id === 'PCL-5' ? 80 : (activeQuestionnaire.id === 'GAD-7' ? 21 : 27))}</span>
                  </div>
                </div>
                <span 
                  className="px-2 py-1 rounded-lg text-[10px] font-black uppercase font-mono shadow-xs"
                  style={{ backgroundColor: `${questionnaireSeverityPreview.color}20`, color: questionnaireSeverityPreview.color, border: `1px solid ${questionnaireSeverityPreview.color}40` }}
                >
                  {questionnaireSeverityPreview.label}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 mb-3 flex-shrink-0">
              <strong>Instructions: </strong>{activeQuestionnaire.instruction || activeQuestionnaire.subtitle || activeQuestionnaire.description}
            </div>

            {/* Questions List with Fixed Option Selection */}
            <div className="overflow-y-auto flex-1 space-y-3.5 pr-1.5">
              {activeQuestionnaire.questions.map((q, idx) => {
                const currentVal = questionnaireAnswers[q.id];
                const isAnswered = typeof currentVal === 'number';
                return (
                  <div 
                    key={q.id} 
                    className={`p-3.5 rounded-xl border transition ${
                      isAnswered 
                        ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/10' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2.5">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-start gap-2">
                        <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black">{idx + 1}.</span>
                        <span className="leading-relaxed">{q.text}</span>
                      </div>
                      {isAnswered ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex-shrink-0 flex items-center gap-1">
                          <span>✓</span> <span>+{currentVal} pts</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex-shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeQuestionnaire.options.map((opt, optIdx) => {
                        const optScore = typeof opt.score === 'number' ? opt.score : (typeof opt.val === 'number' ? opt.val : optIdx);
                        const isSelected = currentVal === optScore;
                        return (
                          <button
                            key={optScore}
                            type="button"
                            onClick={() => {
                              setQuestionnaireAnswers(prev => ({ ...prev, [q.id]: optScore }));
                            }}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition text-center flex flex-col justify-between items-center cursor-pointer shadow-xs ${
                              isSelected 
                                ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/50 shadow-md transform scale-[1.02]' 
                                : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-1 font-mono text-[11px] mb-1">
                              <span>{isSelected ? '✓' : '○'}</span>
                              <span>Score: {optScore}</span>
                            </div>
                            <div className="text-[11px] font-semibold leading-tight">{opt.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions with Dynamic Total Calculation */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <span>Total Answered: <strong>{questionnaireAnsweredCount}</strong> / {activeQuestionnaire.questions.length}</span>
                <span>&bull;</span>
                <span>Assessed Score: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{questionnaireScore}</strong></span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => { setActiveQuestionnaire(null); setQuestionnaireAnswers({}); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitScreeningQuestionnaire}
                  disabled={questionnaireAnsweredCount < activeQuestionnaire.questions.length}
                  className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>
                    {questionnaireAnsweredCount < activeQuestionnaire.questions.length 
                      ? `Answer All Questions (${questionnaireAnsweredCount}/${activeQuestionnaire.questions.length})` 
                      : `Submit Certified ${activeQuestionnaire.id} (Score: ${questionnaireScore})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: INDIVIDUAL NOTIFICATION DETAIL (ONE-BY-ONE DRAWER VIEWER)
          ==================================================================== */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md ${
                  selectedNotification.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                }`}>
                  {selectedNotification.priority || 'NORMAL'} PRIORITY
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedNotification.created_at ? selectedNotification.created_at.slice(0, 16).replace('T', ' ') : 'Recent'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
              {selectedNotification.title}
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-200 mb-4">
              {selectedNotification.message}
            </div>

            {selectedNotification.reference_no && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-800 dark:text-emerald-300 mb-4">
                <strong>Booking Reference ID: </strong>{selectedNotification.reference_no}
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-slate-500 mb-4 font-mono">
              <span>Dispatched by: <strong>{selectedNotification.sender_name || 'AFMS Medical Officer'}</strong></span>
              <span>Role: {selectedNotification.sender_role || 'MEDICAL_OFFICER'}</span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNotifications(prev => prev.map(n => n.id === selectedNotification.id ? { ...n, is_read: true } : n));
                  setSelectedNotification(null);
                  showToast('Notification marked as read.', 'success');
                }}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
              >
                ✓ Acknowledge &amp; Mark Read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ECHS CLAIM DISPUTE / APPEAL REPORT FILING
          ==================================================================== */}
      {disputeModalClaim && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  ECHS GRIEVANCE &bull; DISPUTE REDRESSAL
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  File Official Dispute / Appeal Report
                </h3>
              </div>
              <button 
                onClick={() => setDisputeModalClaim(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500 mb-4">
              Contesting Claim: <strong>{disputeModalClaim.title}</strong> (ID: {disputeModalClaim.id})
            </div>

            <form onSubmit={handleFileDispute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Appeal Report Title / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disability Assessment Percentage Appeal (40% to 50%)"
                  value={disputeForm.report_title}
                  onChange={e => setDisputeForm(prev => ({ ...prev, report_title: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical &amp; Legal Reason for Appeal
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe why the decision or percentage should be reviewed (e.g. subsequent degenerative meniscal loss not credited during stage 2 board)..."
                  value={disputeForm.dispute_reason}
                  onChange={e => setDisputeForm(prev => ({ ...prev, dispute_reason: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attached Medical Wallet Evidence Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHA-256 records rec-001, rec-002, MRI Scan Base Hospital attached"
                  value={disputeForm.evidence_summary}
                  onChange={e => setDisputeForm(prev => ({ ...prev, evidence_summary: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalClaim(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>📝</span>
                  <span>Submit Official Grievance Dossier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: TELECONSULTATION BOOKING CONFIRMATION SLIP
          ==================================================================== */}
      {bookingConfirmedSlip && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
              ✓
            </div>
            
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              Teleconsultation Confirmed!
            </h3>
            <div className="text-xs text-slate-500 mb-4">
              High-priority booking notification dispatched to treating Medical Officer.
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2 mb-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Military Booking Ref:</span>
                <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {bookingConfirmedSlip.reference_no || 'AFMS-TC-2026-8819'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Medical Officer:</span>
                <span className="font-bold">{bookingConfirmedSlip.consultation?.doctor_name || bookingForm.doctorName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Specialty:</span>
                <span className="font-bold">{bookingConfirmedSlip.consultation?.specialty || bookingForm.specialty}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Scheduled Date &amp; Slot:</span>
                <span className="font-bold font-mono">{bookingConfirmedSlip.consultation?.date || bookingForm.date} &bull; {bookingConfirmedSlip.consultation?.time_slot || bookingForm.timeSlot}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 mb-4 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              🔒 Teleconsultation note has been automatically sealed and persisted to your Health Wallet.
            </div>

            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  setBookingConfirmedSlip(null);
                  setActiveTab('wallet');
                }}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
              >
                View in Health Wallet
              </button>
              <button
                onClick={() => setBookingConfirmedSlip(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
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

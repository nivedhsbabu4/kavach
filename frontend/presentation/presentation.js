// ============================================================================
// KAVACH PITCH DECK PRESENTATION CONTROLLER
// Arrow Keys / Space / Touch / 15-Min Timer / Speaker Notes / Fullscreen
// ============================================================================

let currentSlideIndex = 0;
const totalSlides = 9;

// 15-Minute Presentation Stage Allocation
// 0:00 - 3:00  (180s) -> Presentation Slides (Slides 1 - 8)
// 3:00 - 10:00 (420s) -> Live Interactive System Demo (Slide 9 & Platform)
// 10:00 - 15:00 (300s) -> Jury Defense & Technical Q&A
let timerSeconds = 0;
let timerInterval = null;
let isTimerRunning = true;

const SPEAKER_NOTES = {
  0: "Slide 1 [Title]: Good morning esteemed evaluators. We are proud to present KAVACH (कवच) — the Sovereign Military Health & Rehabilitation Operating System. Our core thesis: Health that follows the soldier across every posting, battlefield, and into ECHS retirement.",
  1: "Slide 2 [Problem]: The Indian Armed Forces face three critical vulnerabilities today: First, frequent rotational transfers between Siachen, Thar, and North East cause 65% of medical records to fragment. Second, combat rehabilitation dropouts lead to permanent operational downgrades. Third, mental health stigma causes soldiers to hide PTSD due to career fears.",
  2: "Slide 3 [Solution]: KAVACH solves this with a 4-pillar sovereign architecture: 1) A tamper-proof Soldier Health Wallet. 2) Real-time physiotherapy adherence with proactive medical officer alert telemetry. 3) Cryptographic separation of mental health under AES-256-GCM. 4) A 5-stage automated ECHS disability adjudication pipeline with SHA-256 HMAC seals.",
  3: "Slide 4 [Market & Customers]: Our addressable ecosystem spans 1.4M active military personnel, 1.0M CAPF paramilitaries, and 3.2M ECHS veterans and families. Our primary stakeholders are Active Soldiers, AFMS Military Doctors, ECHS Adjudicators, and Regimental Commanding Officers.",
  4: "Slide 5 [Architecture]: Designed for harsh operational environments: Local offline caching with combat QR cards, append-only cryptographic audit logs, SHA-256 HMAC digital attestation, WebRTC teleconsultation, and microservices backend with zero external dependencies.",
  5: "Slide 6 [Business Model & ROI]: Procured via Ministry of Defence enterprise institutional contracts. It yields direct financial ROI by eliminating 80% of military disability pension litigation, reducing fraudulent claims, and preventing costly medical invalidations.",
  6: "Slide 7 [Competitive Advantage]: Unlike civilian EHRs (Epic/Cerner) or ABDM, KAVACH is built natively for sovereign defense: it operates offline in forward pickets, enforces strict command-mental health separation, and integrates directly with the PCDA Allahabad pension treasury.",
  7: "Slide 8 [Team]: Built by our dedicated defense engineering and medical informatics team, bridging full-stack systems engineering, clinical protocols, and cryptographic security.",
  8: "Slide 9 [Demo]: Now we transition directly into our 7-minute live platform demonstration across all five specialized roles: Soldier, Doctor, Physiotherapist, Counselor, and Claims Adjudicator."
};

document.addEventListener('DOMContentLoaded', () => {
  renderDots();
  showSlide(0);
  startTimer();

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prevSlide();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNotes();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key >= '1' && e.key <= '9') {
      showSlide(parseInt(e.key) - 1);
    }
  });

  // Touch swipe support
  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) nextSlide();
    if (touchEndX - touchStartX > 50) prevSlide();
  });
});

function showSlide(index) {
  if (index < 0 || index >= totalSlides) return;
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.progress-dot');

  slides.forEach((s, idx) => {
    s.classList.remove('active', 'prev');
    if (idx < index) s.classList.add('prev');
    if (idx === index) s.classList.add('active');
  });

  dots.forEach((d, idx) => {
    d.classList.toggle('active', idx === index);
  });

  currentSlideIndex = index;
  document.getElementById('currentSlideNum').textContent = index + 1;

  // Update speaker notes
  const notesText = document.getElementById('notesText');
  if (notesText) {
    notesText.textContent = SPEAKER_NOTES[index] || 'No speaker notes for this slide.';
  }
}

function nextSlide() {
  if (currentSlideIndex < totalSlides - 1) {
    showSlide(currentSlideIndex + 1);
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    showSlide(currentSlideIndex - 1);
  }
}

function renderDots() {
  const container = document.getElementById('footerDots');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = `progress-dot ${i === 0 ? 'active' : ''}`;
    dot.title = `Jump to Slide ${i + 1}`;
    dot.onclick = () => showSlide(i);
    container.appendChild(dot);
  }
}

function toggleNotes() {
  const drawer = document.getElementById('notesDrawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.warn(err));
  } else {
    document.exitFullscreen().catch(err => console.warn(err));
  }
}

// Presentation 15-Minute Timer
function startTimer() {
  const timerDisplay = document.getElementById('timerDisplay');
  const phaseDisplay = document.getElementById('phaseDisplay');

  timerInterval = setInterval(() => {
    if (!isTimerRunning) return;
    timerSeconds++;

    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timerDisplay) timerDisplay.textContent = timeFormatted;

    // Phase Indicator based on whiteboard 15-min guideline
    if (phaseDisplay) {
      if (timerSeconds <= 180) {
        phaseDisplay.textContent = '⏱️ PHASE 1: SLIDE PITCH (0-3 MIN)';
        phaseDisplay.style.color = '#eab308';
      } else if (timerSeconds <= 600) {
        phaseDisplay.textContent = '🚀 PHASE 2: LIVE SYSTEM DEMO (3-10 MIN)';
        phaseDisplay.style.color = '#22c55e';
      } else if (timerSeconds <= 900) {
        phaseDisplay.textContent = '💡 PHASE 3: JURY Q&A DEFENSE (10-15 MIN)';
        phaseDisplay.style.color = '#38bdf8';
      } else {
        phaseDisplay.textContent = '⚠️ TIME EXCEEDED (15+ MIN)';
        phaseDisplay.style.color = '#f43f5e';
      }
    }
  }, 1000);
}

function resetTimer() {
  timerSeconds = 0;
  const timerDisplay = document.getElementById('timerDisplay');
  if (timerDisplay) timerDisplay.textContent = '00:00';
}

function launchLivePlatform() {
  window.open('../auth/login.html', '_blank');
}

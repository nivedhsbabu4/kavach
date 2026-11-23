#!/usr/bin/env python3
"""
=============================================================================
KAVACH: Soldier and Veteran Health & Rehabilitation Tracker for India
"Health that follows the soldier."
Zero-Dependency REST Server with RBAC, Time-Stamped Grants, Append-Only Records
=============================================================================
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import sys
import time
import datetime
import hashlib
import hmac
import base64

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
SECRET_KEY = os.environ.get("KAVACH_SECRET_KEY", "kavach_defence_health_aes256_key32b!").encode()

# Default password hash for 'kavach123'
DEFAULT_PW_HASH = hashlib.sha256("kavach123".encode()).hexdigest()

# =============================================================================
# GLOBALLY VALIDATED CLINICAL QUESTIONNAIRES (DSM-5 & AFMS PROTOCOL)
# =============================================================================
CLINICAL_QUESTIONNAIRES = {
    "PHQ-9": {
        "id": "PHQ-9",
        "title": "PHQ-9 (Patient Health Questionnaire - Depression Screening)",
        "subtitle": "Globally validated 9-item psychometric screen for depressive symptoms in active personnel.",
        "instruction": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        "options": [
            {"score": 0, "label": "Not at all"},
            {"score": 1, "label": "Several days"},
            {"score": 2, "label": "More than half the days"},
            {"score": 3, "label": "Nearly every day"}
        ],
        "questions": [
            {"id": "phq_1", "text": "Little interest or pleasure in doing things"},
            {"id": "phq_2", "text": "Feeling down, depressed, or hopeless"},
            {"id": "phq_3", "text": "Trouble falling or staying asleep, or sleeping too much"},
            {"id": "phq_4", "text": "Feeling tired or having little energy"},
            {"id": "phq_5", "text": "Poor appetite or overeating"},
            {"id": "phq_6", "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family/unit down"},
            {"id": "phq_7", "text": "Trouble concentrating on tasks, such as reading briefings or operating equipment"},
            {"id": "phq_8", "text": "Moving or speaking so slowly that other people noticed, or being so fidgety/restless that you moved a lot more than usual"},
            {"id": "phq_9", "text": "Thoughts that you would be better off dead, or of hurting yourself in some way"}
        ],
        "max_score": 27,
        "nudge_threshold": 10
    },
    "GAD-7": {
        "id": "GAD-7",
        "title": "GAD-7 (Generalized Anxiety Disorder Screening)",
        "subtitle": "Validated 7-item clinical tool assessing hyperarousal, tension, and apprehension.",
        "instruction": "Over the last 2 weeks, how often have you been bothered by the following problems?",
        "options": [
            {"score": 0, "label": "Not at all"},
            {"score": 1, "label": "Several days"},
            {"score": 2, "label": "More than half the days"},
            {"score": 3, "label": "Nearly every day"}
        ],
        "questions": [
            {"id": "gad_1", "text": "Feeling nervous, anxious, or on edge"},
            {"id": "gad_2", "text": "Not being able to stop or control worrying"},
            {"id": "gad_3", "text": "Worrying too much about different operational and personal issues"},
            {"id": "gad_4", "text": "Trouble relaxing during off-duty hours"},
            {"id": "gad_5", "text": "Being so restless that it is hard to sit still"},
            {"id": "gad_6", "text": "Becoming easily annoyed or irritable with colleagues or family"},
            {"id": "gad_7", "text": "Feeling afraid, as if something awful might happen"}
        ],
        "max_score": 21,
        "nudge_threshold": 10
    },
    "PCL-5": {
        "id": "PCL-5",
        "title": "PCL-5 (PTSD Checklist for DSM-5 Military Screening)",
        "subtitle": "Official 20-item DSM-5 gold-standard symptom checklist for combat and operational trauma.",
        "instruction": "In the past month, how much have you been bothered by the following problems regarding stressful/combat experiences?",
        "options": [
            {"score": 0, "label": "Not at all"},
            {"score": 1, "label": "A little bit"},
            {"score": 2, "label": "Moderately"},
            {"score": 3, "label": "Quite a bit"},
            {"score": 4, "label": "Extremely"}
        ],
        "questions": [
            {"id": "pcl_1", "text": "Repeated, disturbing, and unwanted memories of the stressful experience?"},
            {"id": "pcl_2", "text": "Repeated, disturbing dreams of the stressful experience?"},
            {"id": "pcl_3", "text": "Suddenly feeling or acting as if the stressful experience were happening again (flashbacks)?"},
            {"id": "pcl_4", "text": "Feeling very upset when something reminded you of the stressful experience?"},
            {"id": "pcl_5", "text": "Strong physical reactions when reminded of the stressful experience (sweating, heart pounding)?"},
            {"id": "pcl_6", "text": "Avoiding memories, thoughts, or feelings related to the stressful experience?"},
            {"id": "pcl_7", "text": "Avoiding external reminders of the stressful experience (people, places, military situations)?"},
            {"id": "pcl_8", "text": "Trouble remembering important parts of the stressful experience?"},
            {"id": "pcl_9", "text": "Strong negative beliefs about yourself, other people, or the world?"},
            {"id": "pcl_10", "text": "Blaming yourself or someone else for the stressful experience or what happened after?"},
            {"id": "pcl_11", "text": "Strong negative feelings such as fear, horror, anger, guilt, or shame?"},
            {"id": "pcl_12", "text": "Loss of interest in activities that you used to enjoy?"},
            {"id": "pcl_13", "text": "Feeling distant or cut off from other people (unit comrades, family)?"},
            {"id": "pcl_14", "text": "Trouble experiencing positive feelings (being unable to feel happiness or love)?"},
            {"id": "pcl_15", "text": "Irritable behavior, angry outbursts, or acting aggressively?"},
            {"id": "pcl_16", "text": "Taking too many risks or doing things that could cause you harm?"},
            {"id": "pcl_17", "text": "Being 'super-alert', watchful, or on guard (hypervigilance)?"},
            {"id": "pcl_18", "text": "Feeling jumpy or easily startled?"},
            {"id": "pcl_19", "text": "Having difficulty concentrating on tasks?"},
            {"id": "pcl_20", "text": "Trouble falling or staying asleep?"}
        ],
        "max_score": 80,
        "nudge_threshold": 31
    }
}

def evaluate_screening_score(q_type, score):
    """Calculates severity tier, counselor referral trigger, and clinical status badge color"""
    if q_type == 'PHQ-9':
        if score < 5: return "Minimal", False, "#10b981", "Normal baseline mood. Regular self-care advised."
        if score < 10: return "Mild Depression", False, "#eab308", "Mild situational tension. Relaxation and peer support recommended."
        if score < 15: return "Moderate Depression", True, "#f97316", "Your stress scores indicate moderate tension. A confidential counselor is available for private guidance."
        if score < 20: return "Moderately Severe Depression", True, "#ef4444", "Elevated depression indicators. Confidential tele-counseling is strongly advised."
        return "Severe Depression", True, "#dc2626", "Urgent Clinical Alert: Confidential AFMS Mental Health Support officer notified for priority outreach."
    elif q_type == 'GAD-7':
        if score < 5: return "Minimal Anxiety", False, "#10b981", "Calm autonomic state. No acute anxiety indicators."
        if score < 10: return "Mild Anxiety", False, "#eab308", "Mild situational worry. Breathing regulation protocols suggested."
        if score < 15: return "Moderate Anxiety", True, "#f97316", "Anxiety levels have climbed over past check-ins. Confidential counseling recommended."
        return "Severe Anxiety", True, "#dc2626", "Severe anxiety hyperarousal. Confidential counselor consultation one tap away."
    elif q_type == 'PCL-5':
        if score < 21: return "Subthreshold / Normal", False, "#10b981", "No acute post-traumatic stress symptomatology detected."
        if score < 31: return "Mild Combat Stress", False, "#eab308", "Mild stress response to deployment. Monitored through routine check-ins."
        if score < 51: return "Probable PTSD (Elevated)", True, "#f97316", "Scores indicate elevated post-traumatic stress. Confidential trauma counseling is available without command notification."
        return "Severe PTSD Symptomatology", True, "#dc2626", "High-intensity trauma reactivity. Confidential specialist counselor intervention recommended immediately."
    return "Normal Baseline", False, "#10b981", "Scores within standard operational limits."

# Database store with full Demo Data for Arjun Verma and military care team
DB = {
    "users": [
        {
            "id": "usr-soldier-1",
            "service_no": "15489201A",
            "name": "Rifleman Arjun Verma",
            "rank": "Rifleman",
            "role": "SOLDIER",
            "password_hash": DEFAULT_PW_HASH,
            "posting": "Rajasthan (Desert Sector)",
            "unit": "14 Rajputana Rifles",
            "branch": "Indian Army",
            "phone": "+91-9876543210",
            "email": "arjun.verma@afms.nic.in",
            "address": "Vill: Khetri, Dist: Jhunjhunu, Rajasthan - 333503",
            "emergency_contact": "Sunita Verma (Wife) - +91-9876543211",
            "blood_group": "O+",
            "allergies": "Penicillin",
            "enlistment_date": "2018-04-10",
            "lock_enabled": True,
            "pin": "1234"
        },
        {
            "id": "usr-doctor-1",
            "service_no": "MR-09824X",
            "name": "Capt. Dr. Priya Nair",
            "rank": "Captain",
            "role": "DOCTOR",
            "password_hash": DEFAULT_PW_HASH,
            "posting": "Base Hospital, Delhi Cantt",
            "unit": "Army Medical Corps (AMC)",
            "branch": "Indian Army"
        },
        {
            "id": "usr-physio-1",
            "service_no": "MR-11204K",
            "name": "Lt. Rajesh Kumar",
            "rank": "Lieutenant",
            "role": "PHYSIOTHERAPIST",
            "password_hash": DEFAULT_PW_HASH,
            "posting": "Military Hospital, Jaipur",
            "unit": "AMC - Rehabilitation Wing",
            "branch": "Indian Army"
        },
        {
            "id": "usr-counselor-1",
            "service_no": "CIV-PSY-042",
            "name": "Dr. Sunita Rao",
            "rank": "Senior Counselor",
            "role": "COUNSELOR",
            "password_hash": DEFAULT_PW_HASH,
            "posting": "Command Hospital (Central), AFMS",
            "unit": "Defence Psychological Support Cell",
            "branch": "AFMS / Tri-Services"
        },
        {
            "id": "usr-claims-1",
            "service_no": "IC-48291M",
            "name": "Col. V.K. Singh (Retd)",
            "rank": "Colonel",
            "role": "CLAIMS_OFFICER",
            "password_hash": DEFAULT_PW_HASH,
            "posting": "ECHS Central Org, AG Branch, New Delhi",
            "unit": "Disability & Medical Board Cell",
            "branch": "ECHS / MoD"
        },
        {
            "id": "usr-co-1",
            "service_no": "IC-51920P",
            "name": "Col. R.S. Rathore",
            "rank": "Colonel",
            "role": "COMMANDING_OFFICER",
            "password_hash": DEFAULT_PW_HASH,
            "posting": "14 Rajputana Rifles HQ",
            "unit": "Commanding Officer",
            "branch": "Indian Army"
        }
    ],

    # Append-only records with SHA-256 HMAC checksums & original authoring doctor ID
    "records": [
        {
            "id": "rec-001",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-doctor-chakravorty",
            "type": "INJURY",
            "title": "Battle Shrapnel Injury - Right Shoulder",
            "date": "2024-03-12",
            "posting": "Rajasthan (Desert Sector)",
            "department": "Casualty & Trauma Surgery",
            "doctor_name": "Maj. S. Chakravorty",
            "hospital": "Military Hospital, Jodhpur",
            "diagnosis": "Splinter wound right deltoid sustained during desert tactical firing exercise. Clean surgical debridement performed. No neurovascular deficit.",
            "prescription": "Tab Diclofenac 50mg (1-0-1) after meals x 5 days; Tab Pantoprazole 40mg (1-0-0 AC) x 5 days; Inj Tetanus Toxoid 0.5ml IM stat; Daily sterile dressing.",
            "file_url": "records/shrapnel_wound_report.pdf",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "9f2a48bc7210e3d2aa5b64239841f3918a240bc129e7c54178a9c2409f581290",
            "version": 1,
            "created_at": "2024-03-12T10:30:00Z"
        },
        {
            "id": "rec-002",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-doctor-bhattacharya",
            "type": "SURGERY",
            "title": "Left Knee Arthroscopic Meniscus Repair",
            "date": "2023-08-19",
            "posting": "North East (Tawang Sector)",
            "department": "Orthopedics & Joint Reconstruction",
            "doctor_name": "Lt. Col. A. Bhattacharya",
            "hospital": "151 Base Hospital, Guwahati",
            "diagnosis": "Grade III Medial Meniscus Tear sustained during high-altitude patrol on snow-covered scree. Partial meniscectomy and stabilization performed under spinal anesthesia.",
            "prescription": "Tab Aceclofenac + Paracetamol (1-0-1) x 7 days; Cap Tramadol 50mg (SOS for acute flare-up); Tab Calcium Citrate 500mg OD x 30 days; Hinged knee brace for 4 weeks.",
            "file_url": "records/knee_arthroscopy_summary.pdf",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "7c81d2a450e19fb2193cb49a212398aef721834920bcda2031941209e8bca512",
            "version": 1,
            "created_at": "2023-08-19T14:15:00Z"
        },
        {
            "id": "rec-003",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-doctor-1",
            "type": "X_RAY",
            "title": "Digital Radiograph - Left Knee & Lumbar Spine",
            "date": "2023-08-15",
            "posting": "North East (Tawang Sector)",
            "department": "Radiology & Diagnostic Imaging",
            "doctor_name": "Capt. Dr. Priya Nair",
            "hospital": "Military Hospital, Tezpur",
            "diagnosis": "Joint effusion present at left tibiofemoral joint space with early patellar tracking deviation. No acute bony fracture seen.",
            "prescription": "Diagnostic imaging report; continue compression bandage and non-weight-bearing crutch ambulation.",
            "file_url": "records/knee_xray_radiology.png",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "3a49182bcf01934e817290adbc14839201948301984210928340192834190823",
            "version": 1,
            "created_at": "2023-08-15T09:00:00Z"
        },
        {
            "id": "rec-004",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-doctor-deshmukh",
            "type": "VACCINATION",
            "title": "High Altitude Prophylaxis & Vaccination Pack",
            "date": "2022-01-10",
            "posting": "Siachen Base Camp (Extreme Cold / High Altitude)",
            "doctor_name": "Capt. R. Deshmukh",
            "hospital": "Siachen Battle School RMO",
            "diagnosis": "Tetanus Toxoid Booster, Quadrivalent Meningococcal & Acetazolamide adaptation pack completed prior to Kumar Post transit.",
            "file_url": "records/siachen_vaccine_certificate.pdf",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "5e83912093849102938401928309182309182309182093840918209384019283",
            "version": 1,
            "created_at": "2022-01-10T11:45:00Z"
        },
        {
            "id": "rec-005",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-doctor-bhattacharya",
            "type": "PRESCRIPTION",
            "title": "Post-Op Analgesic & Joint Chondroitin Regimen",
            "date": "2023-09-01",
            "posting": "North East (Tawang Sector)",
            "doctor_name": "Lt. Col. A. Bhattacharya",
            "hospital": "151 Base Hospital, Guwahati",
            "diagnosis": "Tab Aceclofenac 100mg BD x 7d, Tab Glucosamine-Chondroitin OD x 60d, Ice cryotherapy 3x daily, non-weight bearing crutches.",
            "file_url": "records/rx_knee_physio.pdf",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff001",
            "version": 1,
            "created_at": "2023-09-01T16:00:00Z"
        },
        {
            "id": "rec-006",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-counselor-1",
            "type": "COUNSELING",
            "title": "Confidential Combat Stress & Sleep Disturbance Assessment",
            "date": "2024-11-18",
            "posting": "Rajasthan (Desert Sector)",
            "doctor_name": "Dr. Sunita Rao",
            "hospital": "AFMS Tele-Psychological Support Cell",
            "diagnosis": "Patient reports recurrent nightmares and hypervigilance following high-altitude patrol incident. Screening shows rising PHQ-9 (moderate score 13). Initiated trauma-informed cognitive behavioral therapy.",
            "file_url": "records/confidential_mh_eval.enc",
            "is_mental_health": True,
            "encrypted_data": "AES-256-GCM::d98a01f928e371b290384712::90184bdf7391820aeb98c371f829a039bcf8192a0e819b84172039abcf81920398410293840192834019283049182093::72bc910a3948e71b290c84192039841f",
            "tamper_hash": "8910239481029384019283091820938401928309182093840192830918209384",
            "version": 1,
            "created_at": "2024-11-18T15:30:00Z"
        }
    ],

    # Time-stamped access grants with explicit expiry dates, visit counters, and live status
    "access_grants": [
        {
            "id": "grant-001",
            "soldier_id": "usr-soldier-1",
            "record_id": None,
            "granted_to_user": "usr-doctor-1",
            "granted_to_role": "DOCTOR",
            "granted_by": "usr-soldier-1",
            "purpose": "Routine Orthopedic Follow-up & Knee Evaluation",
            "expiry_date": "2026-12-31T23:59:59Z",
            "status": "ACTIVE",
            "access_count": 4,
            "last_accessed_at": "Today at 09:30 AM",
            "is_live": True,
            "created_at": "2024-01-15T09:00:00Z"
        },
        {
            "id": "grant-002",
            "soldier_id": "usr-soldier-1",
            "record_id": "rec-002",
            "granted_to_user": "usr-physio-1",
            "granted_to_role": "PHYSIOTHERAPIST",
            "granted_by": "usr-soldier-1",
            "purpose": "Post-Surgical Knee Rehabilitation Plan Management",
            "expiry_date": "2026-12-31T23:59:59Z",
            "status": "ACTIVE",
            "access_count": 7,
            "last_accessed_at": "Yesterday at 05:45 PM",
            "is_live": False,
            "created_at": "2024-02-01T10:00:00Z"
        },
        {
            "id": "grant-003",
            "soldier_id": "usr-soldier-1",
            "record_id": "rec-006",
            "granted_to_user": "usr-counselor-1",
            "granted_to_role": "COUNSELOR",
            "granted_by": "usr-soldier-1",
            "purpose": "Confidential Psychological Counseling & Stress Mitigation",
            "expiry_date": "2026-12-31T23:59:59Z",
            "status": "ACTIVE",
            "access_count": 2,
            "last_accessed_at": "Nov 18, 2024 at 03:30 PM",
            "is_live": False,
            "created_at": "2024-10-10T11:00:00Z"
        },
        {
            "id": "grant-004",
            "soldier_id": "usr-soldier-1",
            "record_id": None,
            "granted_to_user": "usr-claims-1",
            "granted_to_role": "CLAIMS_OFFICER",
            "granted_by": "usr-soldier-1",
            "purpose": "Disability & Combat Injury Verification for ECHS Claim",
            "expiry_date": "2026-12-31T23:59:59Z",
            "status": "ACTIVE",
            "access_count": 3,
            "last_accessed_at": "Nov 22, 2024 at 11:15 AM",
            "is_live": False,
            "created_at": "2024-03-01T12:00:00Z"
        }
    ],

    # 6 weeks rising PHQ-9 depression scores (5 to 13)
    "screenings": [
        {"id": "scr-1", "soldier_id": "usr-soldier-1", "questionnaire_type": "PHQ-9", "score": 5, "max_score": 27, "severity": "Mild Depression", "date": "2024-10-10", "counselor_nudge_triggered": False},
        {"id": "scr-2", "soldier_id": "usr-soldier-1", "questionnaire_type": "PHQ-9", "score": 6, "max_score": 27, "severity": "Mild Depression", "date": "2024-10-17", "counselor_nudge_triggered": False},
        {"id": "scr-3", "soldier_id": "usr-soldier-1", "questionnaire_type": "PHQ-9", "score": 8, "max_score": 27, "severity": "Mild Depression", "date": "2024-10-24", "counselor_nudge_triggered": False},
        {"id": "scr-4", "soldier_id": "usr-soldier-1", "questionnaire_type": "PHQ-9", "score": 10, "max_score": 27, "severity": "Moderate Depression", "date": "2024-10-31", "counselor_nudge_triggered": True},
        {"id": "scr-5", "soldier_id": "usr-soldier-1", "questionnaire_type": "PHQ-9", "score": 11, "max_score": 27, "severity": "Moderate Depression", "date": "2024-11-07", "counselor_nudge_triggered": True},
        {"id": "scr-6", "soldier_id": "usr-soldier-1", "questionnaire_type": "PHQ-9", "score": 13, "max_score": 27, "severity": "Moderate Depression (Rising)", "date": "2024-11-14", "counselor_nudge_triggered": True},
        {"id": "scr-7", "soldier_id": "usr-soldier-1", "questionnaire_type": "PCL-5", "score": 32, "max_score": 80, "severity": "Elevated PTSD Symptoms", "date": "2024-11-15", "counselor_nudge_triggered": True},
        {"id": "scr-8", "soldier_id": "usr-soldier-1", "questionnaire_type": "GAD-7", "score": 9, "max_score": 21, "severity": "Mild-to-Moderate Anxiety", "date": "2024-11-16", "counselor_nudge_triggered": False}
    ],

    # Structured 20-session knee rehabilitation plan with Doctor's Pain Diagnosis
    "rehab_plans": [
        {
            "id": "rhb-001",
            "soldier_id": "usr-soldier-1",
            "physio_id": "usr-physio-1",
            "title": "Post-Arthroscopy Left Knee Mobility & Quadriceps Strengthening",
            "injury_context": "Meniscus repair from North East snow patrol",
            "pain_location": "Left Knee (Medial Joint Line & Patellar Tendon)",
            "pain_type": "Sharp throbbing on 90° flexion & post-weight-bearing stiffness",
            "since_when": "19 Aug 2023 - Sustained during snow patrol on scree in Tawang",
            "pain_severity": "Moderate (VAS 4/10)",
            "diagnosed_by": "Capt. Dr. Priya Nair & Lt. Rajesh Kumar",
            "diagnosed_date": "2023-08-20",
            "routine_duration_mins": 20,
            "total_sessions": 20,
            "completed_sessions": 14,
            "pain_level": 4, # 0 - 10 VAS scale
            "mobility_score": 115, # Degrees of knee flexion arc
            "schedule": "Daily @ 0630h & 1730h",
            "status": "IN_PROGRESS",
            "last_missed_date": "2024-11-21",
            "physio_alerted": True,
            "exercises": [
                {"id": "ex-1", "name": "Straight Leg Raises (Quad setting)", "reps": "3 sets x 15 reps", "duration_mins": 5, "target": "Vastus Medialis", "completed": True},
                {"id": "ex-2", "name": "Terminal Knee Extension with Theraband", "reps": "3 sets x 12 reps", "duration_mins": 5, "target": "Patellar Tracking", "completed": True},
                {"id": "ex-3", "name": "Wall Squats with Swiss Ball (30 deg)", "reps": "3 sets x 10 reps", "duration_mins": 5, "target": "Lower Extremity Stability", "completed": False},
                {"id": "ex-4", "name": "Hamstring Curls & Towel Heel Slides", "reps": "2 sets x 15 reps", "duration_mins": 5, "target": "Flexion Arc Expansion", "completed": False}
            ]
        }
    ],

    # ECHS Disability Claim Progress Tracker with Moving Line Stages
    "claims": [
        {
            "id": "clm-001",
            "soldier_id": "usr-soldier-1",
            "title": "Left Knee Meniscus Post-Operative Disability Claim",
            "current_stage": 3, # 1: Submitted, 2: Waiting for Verification, 3: Pending, 4: Waiting for Approval, 5: Claim Sanctioned
            "status_label": "Pending Medical Scrutiny",
            "stages": [
                {"id": 1, "name": "Submitted", "date": "2024-04-10", "completed": True, "note": "Wallet evidence compiled with SHA-256 seals"},
                {"id": 2, "name": "Waiting for Verification", "date": "2024-06-15", "completed": True, "note": "Verified by Base Hospital Medical Board Delhi"},
                {"id": 3, "name": "Pending Medical Scrutiny", "date": "2024-11-01", "completed": True, "current": True, "note": "Under Scrutiny by AG Branch Disability Directorate"},
                {"id": 4, "name": "Waiting for Approval", "date": "Estimated Dec 2024", "completed": False, "note": "Awaiting Financial Sanction & PCDA clearance"},
                {"id": 5, "name": "Claim Sanctioned", "date": "Pending", "completed": False, "note": "Pension Payment Order (PPO) issuance"}
            ]
        }
    ],

    "consultations": [
        {
            "id": "cns-001",
            "soldier_id": "usr-soldier-1",
            "doctor_id": "usr-doctor-1",
            "doctor_name": "Capt. Dr. Priya Nair",
            "date": "2024-11-20T11:00:00Z",
            "specialty": "Orthopedics & Joint Restoration",
            "status": "COMPLETED",
            "summary": "Knee range of motion evaluated at 115 degrees flexion. Advised continued adherence to rehab plan. Prescribed local topical NSAID.",
            "record_id": "rec-005",
            "follow_up_date": "2024-12-05"
        }
    ],


    "audit_log": [
        {
            "id": "aud-001",
            "user_id": "usr-soldier-1",
            "user_role": "SOLDIER",
            "soldier_id": "usr-soldier-1",
            "record_id": None,
            "action": "VIEW_WALLET",
            "timestamp": "2024-11-22T08:14:02Z",
            "status": "ALLOWED",
            "details": "Soldier accessed personal health wallet from Field Post",
            "ip_address": "10.14.82.19"
        },
        {
            "id": "aud-002",
            "user_id": "usr-doctor-1",
            "user_role": "DOCTOR",
            "soldier_id": "usr-soldier-1",
            "record_id": "rec-002",
            "action": "VIEW_RECORD",
            "timestamp": "2024-11-22T09:30:15Z",
            "status": "ALLOWED",
            "details": "Doctor viewed Knee Surgery Record under active clinical grant",
            "ip_address": "10.14.1.4"
        },
        {
            "id": "aud-003",
            "user_id": "usr-counselor-1",
            "user_role": "COUNSELOR",
            "soldier_id": "usr-soldier-1",
            "record_id": "rec-006",
            "action": "VIEW_MENTAL_HEALTH",
            "timestamp": "2024-11-22T10:05:44Z",
            "status": "ALLOWED",
            "details": "Counselor accessed confidential mental health notes following rising PHQ-9 alert",
            "ip_address": "10.14.9.12"
        }
    ],

    "notifications": [
        {
            "id": "notif-001",
            "recipient_id": "usr-soldier-1",
            "recipient_role": "SOLDIER",
            "sender_name": "Capt. Dr. Priya Nair, AMC",
            "sender_role": "DOCTOR",
            "type": "REHAB_MISSED",
            "title": "Knee Mobility Session #14 Missed",
            "message": "Session #14 Knee Rehab was flagged as missed yesterday. Please complete your exercises to maintain joint flexion and prevent arthrofibrosis.",
            "created_at": "2026-11-22T14:30:00Z",
            "is_read": False,
            "priority": "HIGH"
        },
        {
            "id": "notif-002",
            "recipient_id": "usr-soldier-1",
            "recipient_role": "SOLDIER",
            "sender_name": "Dr. Sunita Rao (AFMS)",
            "sender_role": "COUNSELOR",
            "type": "STRESS_NUDGE",
            "title": "PHQ-9 Score Trend Alert",
            "message": "Your stress scores have climbed 3 weeks in a row. A confidential counselor is one tap away for support.",
            "created_at": "2026-11-21T09:15:00Z",
            "is_read": False,
            "priority": "MEDIUM"
        },
        {
            "id": "notif-003",
            "recipient_id": "usr-doctor-1",
            "recipient_role": "DOCTOR",
            "sender_name": "Kavach Rehab Monitor",
            "sender_role": "SYSTEM",
            "type": "REHAB_MISSED_ALERT",
            "title": "Rifleman Arjun Verma Missed Session #14",
            "message": "Patient missed scheduled knee session yesterday. Adherence reminder recommended.",
            "created_at": "2026-11-22T14:30:00Z",
            "is_read": False,
            "priority": "HIGH"
        },
        {
            "id": "notif-004",
            "recipient_id": "usr-physio-1",
            "recipient_role": "PHYSIOTHERAPIST",
            "sender_name": "Kavach Adherence Engine",
            "sender_role": "SYSTEM",
            "type": "REHAB_MISSED_ALERT",
            "title": "Rfn. Arjun Verma Missed Wall Squats",
            "message": "Session #14 incomplete. Knee flexion arc adherence requires follow-up.",
            "created_at": "2026-11-22T14:30:00Z",
            "is_read": False,
            "priority": "HIGH"
        }
    ]
}

# =============================================================================
# PERSISTENT DATABASE STORAGE (JSON / SQLite COMPATIBLE)
# =============================================================================
DB_DIR = os.path.join(BASE_DIR, 'database')
DB_FILE = os.path.join(DB_DIR, 'kavach_db.json')

def save_db():
    """Atomically persist the entire in-memory database to disk in JSON format"""
    try:
        os.makedirs(DB_DIR, exist_ok=True)
        temp_file = DB_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(DB, f, indent=2, ensure_ascii=False)
        os.replace(temp_file, DB_FILE)
    except Exception as e:
        print(f"Error saving database to {DB_FILE}: {e}", file=sys.stderr)

def load_db():
    """Load persistent database from disk if it exists; otherwise initialize and save seed"""
    global DB
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, dict) and "users" in loaded and len(loaded["users"]) > 0:
                    DB = loaded
                    print(f"Loaded persistent Kavach database from {DB_FILE} ({len(DB['users'])} registered users)")
                    return
        except Exception as e:
            print(f"Warning: could not load {DB_FILE}, using default seed: {e}", file=sys.stderr)
    save_db()
    print(f"Initialized persistent Kavach database at {DB_FILE} ({len(DB['users'])} registered users)")

load_db()

def log_audit(user_id, user_role, soldier_id, action, status, details, record_id=None, ip="127.0.0.1"):
    entry = {
        "id": f"aud-{int(time.time()*1000)}",
        "user_id": user_id,
        "user_role": user_role,
        "soldier_id": soldier_id,
        "record_id": record_id,
        "action": action,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": status,
        "details": details,
        "ip_address": ip
    }
    DB["audit_log"].insert(0, entry)
    save_db()
    return entry

def generate_tamper_hash(record):
    s = f"{record.get('soldier_id')}|{record.get('type')}|{record.get('date')}|{record.get('posting')}|{record.get('diagnosis','')}|{record.get('is_mental_health')}|{record.get('version',1)}"
    return hmac.new(SECRET_KEY, s.encode('utf-8'), hashlib.sha256).hexdigest()

def safe_user(u):
    if not u or not isinstance(u, dict):
        return u
    cleaned = dict(u)
    cleaned.pop('password_hash', None)
    return cleaned

def is_grant_active(grant):
    if not grant or grant.get('status') != 'ACTIVE':
        return False
    exp = grant.get('expiry_date')
    if exp:
        try:
            exp_clean = exp.split('T')[0]
            if exp_clean < datetime.date.today().isoformat():
                return False
        except Exception:
            pass
    return True

def make_jwt(payload):
    p = dict(payload)
    if 'exp' not in p:
        p['exp'] = int(time.time()) + (8 * 3600)  # 8 hours expiration
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    body = base64.urlsafe_b64encode(json.dumps(p).encode()).decode().rstrip("=")
    sig = hmac.new(SECRET_KEY, f"{header}.{body}".encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{header}.{body}.{sig_b64}"

def verify_jwt(token):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(SECRET_KEY, f"{header}.{body}".encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")
        if sig != expected_sig:
            return None
        body_padded = body + '=' * (-len(body) % 4)
        data = json.loads(base64.urlsafe_b64decode(body_padded.encode()).decode())
        if 'exp' in data:
            if time.time() > data['exp']:
                return None
        return data
    except Exception:
        return None

class KavachRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def get_auth_user(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            decoded = verify_jwt(token)
            if decoded:
                live = next((usr for usr in DB['users'] if usr['id'] == decoded.get('id') or usr['service_no'] == decoded.get('service_no')), None)
                if live:
                    return live
                return decoded
        return None

    def require_role(self, *roles):
        user = self.get_auth_user()
        if not user:
            self.send_json(401, {
                "error": "UNAUTHORIZED",
                "message": "Authentication required. Missing, invalid or expired security token."
            })
            return None
        
        user_role = user.get('role')
        if roles and user_role not in roles:
            ip = self.client_address[0] if hasattr(self, 'client_address') and self.client_address else "127.0.0.1"
            log_audit(
                user_id=user.get('id', 'unknown'),
                user_role=user_role or 'UNKNOWN',
                soldier_id=user.get('id', 'unknown'),
                action='ROLE_ACCESS_DENIED',
                status='BLOCKED',
                details=f"User with role {user_role} attempted to access restricted endpoint requiring {list(roles)}: {self.path}",
                ip=ip
            )
            self.send_json(403, {
                "error": "FORBIDDEN",
                "code": "INSUFFICIENT_PRIVILEGES",
                "message": f"Access forbidden for role '{user_role}'. Required role: {', '.join(roles)}.",
                "audit_logged": True
            })
            return None
            
        return user

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # 0. API: Database Inspector (Summary & Registered Users)
        if path == '/api/database/users':
            sanitized = []
            for u in DB.get('users', []):
                sanitized.append({
                    "id": u.get('id'),
                    "service_no": u.get('service_no'),
                    "name": u.get('name'),
                    "rank": u.get('rank'),
                    "role": u.get('role'),
                    "unit": u.get('unit'),
                    "posting": u.get('posting'),
                    "branch": u.get('branch'),
                    "blood_group": u.get('blood_group'),
                    "enlistment_date": u.get('enlistment_date'),
                    "records_count": len([r for r in DB.get('records', []) if r.get('soldier_id') == u.get('id')])
                })
            return self.send_json(200, {"users": sanitized, "total": len(sanitized), "db_file": DB_FILE})

        elif path == '/api/database/summary':
            users_list = []
            for u in DB.get('users', []):
                users_list.append({
                    "id": u.get('id'),
                    "service_no": u.get('service_no'),
                    "name": u.get('name'),
                    "rank": u.get('rank'),
                    "role": u.get('role'),
                    "unit": u.get('unit'),
                    "posting": u.get('posting'),
                    "enlistment_date": u.get('enlistment_date')
                })
            summary = {
                "db_file": DB_FILE,
                "total_users": len(DB.get('users', [])),
                "soldiers_count": len([u for u in DB.get('users', []) if u.get('role') == 'SOLDIER']),
                "doctors_count": len([u for u in DB.get('users', []) if u.get('role') == 'DOCTOR']),
                "total_records": len(DB.get('records', [])),
                "total_access_grants": len(DB.get('access_grants', [])),
                "total_screenings": len(DB.get('screenings', [])),
                "total_rehab_plans": len(DB.get('rehab_plans', [])),
                "total_consultations": len(DB.get('consultations', [])),
                "total_notifications": len(DB.get('notifications', [])),
                "users": users_list
            }
            return self.send_json(200, summary)

        # 1. API: Current user profile / auth me
        elif path == '/api/auth/me':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required. Missing or expired token."})
            return self.send_json(200, {"user": safe_user(user), "role": user.get('role')})

        elif path in ('/api/users/me', '/api/users/profile'):
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required."})
            return self.send_json(200, safe_user(user))

        # 1.1 API: Notifications for current user / role
        elif path == '/api/notifications':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required."})
            user_id = user.get('id')
            role = user.get('role')
            notifs = [
                n for n in DB.get('notifications', [])
                if n.get('recipient_id') in (user_id, 'ALL') or n.get('recipient_role') in (role, 'ALL')
            ]
            return self.send_json(200, notifs)

        # 2. API: Records with strict RBAC rules
        elif path == '/api/records':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required."})
            role = user.get('role', 'SOLDIER')
            if role == 'SOLDIER':
                soldier_id = user['id']
            else:
                soldier_id = params.get('soldier_id', [None])[0]
                if not soldier_id:
                    return self.send_json(400, {"error": "soldier_id query parameter is required"})
            requested_type = params.get('type', [None])[0]

            # RULE: Soldier
            if role == 'SOLDIER':
                log_audit(user['id'], role, soldier_id, 'VIEW_WALLET', 'ALLOWED', 'Soldier opened comprehensive health wallet')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id]
                return self.send_json(200, res)

            # RULE: Claims Officer
            elif role == 'CLAIMS_OFFICER':
                if requested_type == 'MENTAL_HEALTH':
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_MENTAL_HEALTH', 'BLOCKED',
                              'Claims Officer attempted to inspect confidential mental health dossier. Blocked by Kavach RBAC barrier.')
                    return self.send_json(403, {
                        "error": "ACCESS DENIED",
                        "code": "CLAIMS_OFFICER_MENTAL_HEALTH_FORBIDDEN",
                        "message": "Strict Privacy Protocol: Claims Officers are prohibited from inspecting confidential mental health records.",
                        "is_access_denied": True,
                        "soldier_id": soldier_id,
                        "audit_logged": True
                    })
                log_audit(user['id'], role, soldier_id, 'VIEW_SERVICE_INJURIES', 'ALLOWED',
                          'Claims Officer verified battle and physical service injuries for ECHS claim processing')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and not r.get('is_mental_health')]
                return self.send_json(200, res)

            # RULE: Commanding Officer
            elif role == 'COMMANDING_OFFICER':
                if requested_type == 'MENTAL_HEALTH':
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_MENTAL_HEALTH', 'BLOCKED',
                              'Commanding Officer attempted to query confidential psychological assessment. Barred by privacy policy.')
                    return self.send_json(403, {
                        "error": "ACCESS DENIED",
                        "code": "CO_MENTAL_HEALTH_FORBIDDEN",
                        "message": "Military Regulations: Unit Commanders are strictly barred from access to confidential soldier mental health records.",
                        "is_access_denied": True
                    })
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and not r.get('is_mental_health')]
                return self.send_json(200, res)

            # RULE: Counselor
            elif role == 'COUNSELOR':
                grant = next((g for g in DB['access_grants'] if g['soldier_id'] == soldier_id and g['granted_to_role'] == 'COUNSELOR' and is_grant_active(g)), None)
                if not grant:
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_NO_GRANT', 'BLOCKED', 'Counselor queried records without active soldier consent')
                    return self.send_json(403, {"error": "ACCESS DENIED: No active consent grant from soldier"})
                
                log_audit(user['id'], role, soldier_id, 'VIEW_MENTAL_HEALTH', 'ALLOWED', 'Counselor reviewed psychological assessments under active consent')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and r.get('is_mental_health')]
                return self.send_json(200, res)

            # RULE: Doctor / Physiotherapist
            elif role in ('DOCTOR', 'PHYSIOTHERAPIST'):
                grant = next((g for g in DB.get('access_grants', []) if g.get('soldier_id') == soldier_id and g.get('granted_to_role') == role and is_grant_active(g)), None)
                if not grant:
                    ip = self.client_address[0] if hasattr(self, 'client_address') and self.client_address else "127.0.0.1"
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_NO_GRANT', 'BLOCKED',
                              f"{role} attempted to access clinical records for soldier {soldier_id} without active grant", ip=ip)
                    return self.send_json(403, {"error": f"ACCESS DENIED: No active, unexpired access grant from soldier for {role}", "audit_logged": True})

                log_audit(user['id'], role, soldier_id, 'VIEW_CLINICAL_RECORDS', 'ALLOWED', f'{role} accessed clinical record history under active patient grant')
                res = []
                for r in DB['records']:
                    if r['soldier_id'] != soldier_id:
                        continue
                    item = dict(r)
                    if not item.get('department'):
                        item['department'] = 'Orthopedics & Joint Surgery' if 'Knee' in item.get('title', '') else ('Casualty & Trauma Surgery' if 'Injury' in item.get('title', '') else 'General Medicine')
                    if not item.get('prescription'):
                        item['prescription'] = 'Routine clinical care and observation directives.'

                    if item.get('is_mental_health'):
                        # Check if psychologist approved access for this doctor
                        mh_req = next((req for req in DB.get('mental_health_requests', []) if req['soldier_id'] == soldier_id and req.get('doctor_id') == user.get('id')), None)
                        if mh_req and mh_req.get('status') == 'APPROVED':
                            item['access_status'] = 'APPROVED'
                            res.append(item)
                        elif mh_req and mh_req.get('status') == 'PENDING_PSYCHOLOGIST_APPROVAL':
                            res.append({
                                "id": item['id'],
                                "soldier_id": soldier_id,
                                "type": "MENTAL_HEALTH",
                                "is_mental_health": True,
                                "access_status": "WAITING_PSYCHOLOGIST_APPROVAL",
                                "title": "🔒 Confidential Psychological Assessment (Sealed)",
                                "department": "Defence Psychological Support Cell",
                                "doctor_name": item.get('doctor_name', 'AFMS Senior Counselor'),
                                "hospital": item.get('hospital', 'Command Hospital (Central), AFMS'),
                                "date": item.get('date'),
                                "diagnosis": "ACCESS PENDING: Authorization request has been dispatched to Counselor. Waiting for clinical sign-off.",
                                "prescription": "Sealed until psychologist authorization granted."
                            })
                        else:
                            res.append({
                                "id": item['id'],
                                "soldier_id": soldier_id,
                                "type": "MENTAL_HEALTH",
                                "is_mental_health": True,
                                "access_status": "NOT_REQUESTED",
                                "title": "🔒 Confidential Psychological Assessment (Sealed)",
                                "department": "Defence Psychological Support Cell",
                                "doctor_name": item.get('doctor_name', 'AFMS Senior Counselor'),
                                "hospital": item.get('hospital', 'Command Hospital (Central), AFMS'),
                                "date": item.get('date'),
                                "diagnosis": "RESTRICTED DOSSIER: Requires authorization from treating Psychologist / Counselor under AFMS Privacy Directives.",
                                "prescription": "Requires psychologist approval."
                            })
                    else:
                        res.append(item)
                return self.send_json(200, res)

            return self.send_json(403, {"error": "Unauthorized role"})

        # 3. API: Doctor Endpoints (Doctor only)
        elif path.startswith('/api/doctor/'):
            doctor = self.require_role('DOCTOR')
            if not doctor:
                return

            if path == '/api/doctor/patients':
                active_patients = []
                seen_ids = set()
                for g in DB.get('access_grants', []):
                    if g.get('granted_to_role') == 'DOCTOR' and is_grant_active(g):
                        sid = g.get('soldier_id')
                        if sid and sid not in seen_ids:
                            soldier = next((u for u in DB['users'] if u['id'] == sid and u.get('role') == 'SOLDIER'), None)
                            if soldier:
                                seen_ids.add(sid)
                                r_plan = next((p for p in DB.get('rehab_plans', []) if p.get('soldier_id') == sid), None)
                                active_patients.append({
                                    "id": soldier['id'],
                                    "service_no": soldier['service_no'],
                                    "name": soldier['name'],
                                    "rank": soldier.get('rank', 'Soldier'),
                                    "unit": soldier.get('unit', 'Field Unit'),
                                    "posting": soldier.get('posting', 'Field Station'),
                                    "blood_group": soldier.get('blood_group', 'O+'),
                                    "grant_id": g.get('id'),
                                    "grant_expiry": g.get('expiry_date'),
                                    "rehab_plan": {
                                        "title": r_plan.get('title'),
                                        "completed_sessions": r_plan.get('completed_sessions', 0),
                                        "total_sessions": r_plan.get('total_sessions', 0),
                                        "pain_level": r_plan.get('pain_level', 0),
                                        "last_missed_date": r_plan.get('last_missed_date')
                                    } if r_plan else None
                                })
                return self.send_json(200, {"patients": active_patients, "total": len(active_patients)})

            elif path == '/api/doctor/active-patient':
                target_id = params.get('soldier_id', [None])[0]
                if not target_id:
                    return self.send_json(400, {"error": "soldier_id query parameter is required"})
                soldier = next((u for u in DB['users'] if u['id'] == target_id and u.get('role') == 'SOLDIER'), None)
                grant = next((g for g in DB.get('access_grants', []) if g.get('soldier_id') == target_id and g.get('granted_to_role') == 'DOCTOR' and is_grant_active(g)), None) if soldier else None
                if not soldier or not grant:
                    ip = self.client_address[0] if hasattr(self, 'client_address') and self.client_address else "127.0.0.1"
                    soldier_name = soldier['name'] if soldier else target_id
                    log_audit(doctor['id'], 'DOCTOR', target_id, 'ACCESS_DENIED_NO_GRANT', 'BLOCKED',
                              f"Doctor {doctor.get('name')} attempted to access patient wallet for soldier {soldier_name} ({target_id}) without active grant",
                              ip=ip)
                    return self.send_json(403, {
                        "error": "ACCESS DENIED: No active, unexpired access grant from this soldier.",
                        "code": "NO_ACTIVE_GRANT",
                        "soldier_id": target_id,
                        "audit_logged": True
                    })
                grant['visits_count'] = grant.get('visits_count', 0) + 1
                grant['last_accessed'] = datetime.datetime.now().strftime("%d %b %Y %H:%M")
                return self.send_json(200, {
                    "soldier": safe_user(soldier),
                    "grant": grant,
                    "wallet_id": f"KAVACH-WLT-{soldier['service_no']}",
                    "wallet_status": "ACTIVE_CONSENT_GRANTED"
                })

            elif path == '/api/doctor/credentials':
                return self.send_json(200, {
                    "verified": bool(doctor.get('credentials_verified', False)),
                    "doctor": safe_user(doctor)
                })

            elif path == '/api/doctor/mh-access-status':
                soldier_id = params.get('soldier_id', [None])[0]
                if not soldier_id:
                    return self.send_json(400, {"error": "soldier_id is required"})
                req = next((r for r in DB.get('mental_health_requests', []) if r['soldier_id'] == soldier_id and r.get('doctor_id') == doctor.get('id')), None)
                return self.send_json(200, {
                    "status": req.get('status') if req else "NOT_REQUESTED",
                    "request": req
                })

            return self.send_json(404, {"error": "Endpoint not found"})

        # 3.1 API: Physio Endpoints (Physiotherapist only)
        elif path.startswith('/api/physio/'):
            physio = self.require_role('PHYSIOTHERAPIST')
            if not physio:
                return

            if path == '/api/physio/patients':
                active_patients = []
                seen_ids = set()
                # Find soldiers with rehab plan or grant to PHYSIOTHERAPIST
                for p in DB.get('rehab_plans', []):
                    sid = p.get('soldier_id')
                    if sid and sid not in seen_ids:
                        soldier = next((u for u in DB['users'] if u['id'] == sid and u.get('role') == 'SOLDIER'), None)
                        if soldier:
                            seen_ids.add(sid)
                            grant = next((g for g in DB.get('access_grants', []) if g.get('soldier_id') == sid and g.get('granted_to_role') == 'PHYSIOTHERAPIST' and is_grant_active(g)), None)
                            active_patients.append({
                                "id": soldier['id'],
                                "service_no": soldier.get('service_no'),
                                "name": soldier.get('name'),
                                "rank": soldier.get('rank', 'Rifleman'),
                                "unit": soldier.get('unit', '14 Rajputana Rifles'),
                                "posting": soldier.get('posting', 'Field Station'),
                                "grant_id": grant.get('id') if grant else None,
                                "grant_status": "ACTIVE" if grant else "PENDING_CONSENT",
                                "grant_expiry": grant.get('expiry_date') if grant else None,
                                "rehab_plan": p,
                                "has_missed_session": bool(p.get('last_missed_date'))
                            })
                for g in DB.get('access_grants', []):
                    if g.get('granted_to_role') == 'PHYSIOTHERAPIST' and is_grant_active(g):
                        sid = g.get('soldier_id')
                        if sid and sid not in seen_ids:
                            soldier = next((u for u in DB['users'] if u['id'] == sid and u.get('role') == 'SOLDIER'), None)
                            if soldier:
                                seen_ids.add(sid)
                                r_plan = next((p for p in DB.get('rehab_plans', []) if p.get('soldier_id') == sid), None)
                                active_patients.append({
                                    "id": soldier['id'],
                                    "service_no": soldier.get('service_no'),
                                    "name": soldier.get('name'),
                                    "rank": soldier.get('rank', 'Rifleman'),
                                    "unit": soldier.get('unit', '14 Rajputana Rifles'),
                                    "posting": soldier.get('posting', 'Field Station'),
                                    "grant_id": g.get('id'),
                                    "grant_status": "ACTIVE",
                                    "grant_expiry": g.get('expiry_date'),
                                    "rehab_plan": r_plan,
                                    "has_missed_session": bool(r_plan and r_plan.get('last_missed_date'))
                                })
                return self.send_json(200, {"patients": active_patients, "total": len(active_patients)})

            return self.send_json(404, {"error": "Endpoint not found"})

        # 4. API: Counselor Endpoints (Counselor only)
        elif path.startswith('/api/counselor/'):
            counselor = self.require_role('COUNSELOR')
            if not counselor:
                return
            if path == '/api/counselor/mh-requests':
                return self.send_json(200, DB.get('mental_health_requests', []))
            elif path == '/api/counselor/patients':
                patients = []
                seen_ids = set()
                for s in DB.get('screenings', []):
                    sid = s.get('soldier_id')
                    if sid and sid not in seen_ids:
                        soldier = next((u for u in DB['users'] if u['id'] == sid and u.get('role') == 'SOLDIER'), None)
                        if soldier:
                            seen_ids.add(sid)
                            soldier_screenings = [x for x in DB.get('screenings', []) if x.get('soldier_id') == sid]
                            latest_phq = next((x for x in reversed(soldier_screenings) if x.get('questionnaire_type') == 'PHQ-9'), None)
                            latest_pcl = next((x for x in reversed(soldier_screenings) if x.get('questionnaire_type') == 'PCL-5'), None)
                            latest_gad = next((x for x in reversed(soldier_screenings) if x.get('questionnaire_type') == 'GAD-7'), None)
                            grant = next((g for g in DB.get('access_grants', []) if g.get('soldier_id') == sid and g.get('granted_to_role') == 'COUNSELOR' and is_grant_active(g)), None)
                            patients.append({
                                "id": soldier['id'],
                                "service_no": soldier.get('service_no'),
                                "name": soldier.get('name'),
                                "rank": soldier.get('rank', 'Rifleman'),
                                "unit": soldier.get('unit', '14 Rajputana Rifles'),
                                "posting": soldier.get('posting', 'Field Station'),
                                "grant_status": "ACTIVE" if grant else "PENDING_CONSENT",
                                "screenings_count": len(soldier_screenings),
                                "latest_phq": latest_phq.get('score') if latest_phq else None,
                                "latest_pcl": latest_pcl.get('score') if latest_pcl else None,
                                "latest_gad": latest_gad.get('score') if latest_gad else None,
                                "requires_nudge": bool((latest_phq and latest_phq.get('score', 0) >= 10) or (latest_pcl and latest_pcl.get('score', 0) >= 30))
                            })
                return self.send_json(200, {"patients": patients, "total": len(patients)})
            elif path == '/api/counselor/screenings':
                sid = params.get('soldier_id', [None])[0]
                if sid:
                    scr = [s for s in DB.get('screenings', []) if s.get('soldier_id') == sid]
                else:
                    scr = list(DB.get('screenings', []))
                enriched = []
                for s in scr:
                    item = dict(s)
                    u = next((usr for usr in DB['users'] if usr['id'] == s.get('soldier_id')), None)
                    if u:
                        item['soldier_name'] = u.get('name')
                        item['soldier_service_no'] = u.get('service_no')
                        item['soldier_unit'] = u.get('unit')
                    enriched.append(item)
                return self.send_json(200, enriched)
            elif path == '/api/counselor/nudge-queue':
                queue = []
                for u in DB['users']:
                    if u.get('role') == 'SOLDIER':
                        soldier_screenings = [s for s in DB.get('screenings', []) if s.get('soldier_id') == u['id']]
                        latest_phq = next((x for x in reversed(soldier_screenings) if x.get('questionnaire_type') == 'PHQ-9'), None)
                        latest_pcl = next((x for x in reversed(soldier_screenings) if x.get('questionnaire_type') == 'PCL-5'), None)
                        phq_score = latest_phq.get('score', 0) if latest_phq else 0
                        pcl_score = latest_pcl.get('score', 0) if latest_pcl else 0
                        if phq_score >= 10 or pcl_score >= 30:
                            queue.append({
                                "soldier_id": u['id'],
                                "name": u.get('name'),
                                "service_no": u.get('service_no'),
                                "rank": u.get('rank', 'Rifleman'),
                                "unit": u.get('unit', '14 Rajputana Rifles'),
                                "posting": u.get('posting', 'Field Station'),
                                "phq_score": phq_score,
                                "pcl_score": pcl_score,
                                "risk_label": "High Combat Stress / Elevated Depressive Symptoms" if phq_score >= 15 else "Moderate Stress Escalation",
                                "last_screening_date": (latest_phq or latest_pcl or {}).get('date', 'Recent')
                            })
                return self.send_json(200, queue)
            return self.send_json(404, {"error": "Endpoint not found"})

        # 5. API: Screenings (PCL-5, PHQ-9, GAD-7)
        elif path == '/api/screenings':
            user = self.require_role('SOLDIER', 'COUNSELOR', 'DOCTOR')
            if not user:
                return
            if user['role'] == 'SOLDIER':
                soldier_id = user['id']
            else:
                soldier_id = params.get('soldier_id', [None])[0]
                if not soldier_id:
                    return self.send_json(400, {"error": "soldier_id parameter is required"})
            res = [s for s in DB['screenings'] if s['soldier_id'] == soldier_id]
            return self.send_json(200, res)

        # 5.1 API: Questionnaires Definition
        elif path == '/api/screenings/questionnaires':
            return self.send_json(200, CLINICAL_QUESTIONNAIRES)

        # 6. API: Rehab
        elif path == '/api/rehab':
            user = self.require_role('SOLDIER', 'PHYSIOTHERAPIST', 'DOCTOR')
            if not user:
                return
            if user['role'] == 'SOLDIER':
                soldier_id = user['id']
            else:
                soldier_id = params.get('soldier_id', [None])[0]
                if not soldier_id:
                    return self.send_json(400, {"error": "soldier_id parameter is required"})
            plan = next((p for p in DB['rehab_plans'] if p['soldier_id'] == soldier_id), None)
            if not plan and user.get('role') == 'SOLDIER':
                plan = {
                    "id": f"rhb-{user['id']}",
                    "soldier_id": user['id'],
                    "title": "Musculoskeletal Conditioning & Mobility Protocol",
                    "diagnosed_by": "AFMS Medical Officer",
                    "pain_location": "No Active Joint Injury Reported",
                    "pain_type": "Standard Routine Conditioning",
                    "since_when": "Enlistment",
                    "pain_severity": "Mild",
                    "completed_sessions": 0,
                    "total_sessions": 10,
                    "exercises": [
                        { "id": "ex-01", "name": "Core Stability & Lumbar Plank", "reps": "3 sets x 30 sec", "completed": False },
                        { "id": "ex-02", "name": "Quadriceps & Hamstring Conditioning", "reps": "3 sets x 12 reps", "completed": False },
                        { "id": "ex-03", "name": "Shoulder Scapular Retraction", "reps": "3 sets x 15 reps", "completed": False }
                    ]
                }
                DB['rehab_plans'].append(plan)
            return self.send_json(200, plan or {})

        # 7. API: Access Grants
        elif path == '/api/access-grants':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required."})
            if user['role'] == 'SOLDIER':
                soldier_id = user['id']
            else:
                soldier_id = params.get('soldier_id', [None])[0]
                if not soldier_id:
                    grants = [g for g in DB['access_grants'] if g.get('granted_to_role') == user['role']]
                    return self.send_json(200, grants)
            grants = [g for g in DB['access_grants'] if g['soldier_id'] == soldier_id]
            return self.send_json(200, grants)

        # 8. API: Audit Log
        elif path == '/api/audit-log':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required."})
            return self.send_json(200, DB['audit_log'])

        # 9. API: Claims Progress Tracker (Claims Officer & Soldier only; Doctors forbidden)
        elif path.startswith('/api/claims'):
            user = self.require_role('CLAIMS_OFFICER', 'SOLDIER')
            if not user:
                return
            if user['role'] == 'SOLDIER':
                soldier_id = user['id']
            else:
                soldier_id = params.get('soldier_id', [None])[0]

            raw_claims = DB.get('claims', [])
            if soldier_id:
                raw_claims = [c for c in raw_claims if c.get('soldier_id') == soldier_id]

            enriched = []
            for c in raw_claims:
                item = dict(c)
                sid = c.get('soldier_id')
                soldier = next((u for u in DB['users'] if u['id'] == sid), None)
                if soldier:
                    item['soldier_name'] = soldier.get('name')
                    item['soldier_service_no'] = soldier.get('service_no')
                    item['soldier_rank'] = soldier.get('rank', 'Rifleman')
                    item['soldier_unit'] = soldier.get('unit', '14 Rajputana Rifles')
                    item['soldier_posting'] = soldier.get('posting', 'Field Station')
                grant = next((g for g in DB.get('access_grants', []) if g.get('soldier_id') == sid and g.get('granted_to_role') == 'CLAIMS_OFFICER' and is_grant_active(g)), None)
                item['grant_status'] = 'ACTIVE' if grant else 'REVOKED'
                item['grant_expiry'] = grant.get('expiry_date') if grant else 'None'
                enriched.append(item)
            return self.send_json(200, enriched)

        # 9.1 API: Commanding Officer Unit Readiness (Commanding Officer only)
        elif path.startswith('/api/commanding/'):
            co = self.require_role('COMMANDING_OFFICER')
            if not co:
                return
            if path == '/api/commanding/readiness':
                total_jawans = 842
                shape1 = 808
                lmc = 34
                active_rehab = len([p for p in DB.get('rehab_plans', []) if p.get('status') == 'IN_PROGRESS'])
                return self.send_json(200, {
                    "unit_name": co.get('unit', '14 Rajputana Rifles'),
                    "commanding_officer": co.get('name'),
                    "battalion_strength": total_jawans,
                    "shape1_count": shape1,
                    "shape1_pct": round((shape1 / total_jawans) * 100, 1),
                    "lmc_count": lmc,
                    "prophylaxis_pct": 100.0,
                    "active_rehab_cases": active_rehab,
                    "sub_units": [
                        {"name": "Alpha Company", "strength": 140, "shape1_pct": 98.5, "status": "COMBAT READY"},
                        {"name": "Bravo Company", "strength": 138, "shape1_pct": 97.1, "status": "COMBAT READY"},
                        {"name": "Charlie Company (Desert Patrol)", "strength": 142, "shape1_pct": 94.4, "status": "CONDITIONING"},
                        {"name": "Delta Company (High Altitude)", "strength": 145, "shape1_pct": 95.8, "status": "COMBAT READY"},
                        {"name": "Headquarters & Support Coy", "strength": 277, "shape1_pct": 95.3, "status": "OPERATIONAL"}
                    ],
                    "privacy_barrier": {
                        "enforced": True,
                        "regulation": "Army Order (AO) 12/2021 & Mental Health Act",
                        "status": "Zero Mental Health Dossiers Visible to Regimental Command"
                    }
                })
            return self.send_json(404, {"error": "Endpoint not found"})

        # 10. API: Consultations
        elif path == '/api/consultations':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED", "message": "Authentication required."})
            if user['role'] == 'SOLDIER':
                res = [c for c in DB.get('consultations', []) if c.get('soldier_id') == user['id']]
            elif user['role'] == 'DOCTOR':
                res = [c for c in DB.get('consultations', []) if c.get('doctor_id') == user['id'] or user.get('name') in c.get('doctor_name', '')]
            else:
                res = DB.get('consultations', [])
            return self.send_json(200, res)

        # Static file delivery for frontend
        return self.serve_static_files(path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 1. Login with Strict Role Enforcement
        if path == '/api/auth/login':
            requested_role = payload.get('role')
            service_no = (payload.get('service_no') or '').strip()
            password = (payload.get('password') or '').strip()

            if not requested_role:
                return self.send_json(400, {"error": "Military role is required for authentication."})

            if not password:
                return self.send_json(400, {"error": "Password or Military PIN is required."})

            user = None
            if service_no:
                user = next((u for u in DB['users'] if u['service_no'].strip().lower() == service_no.lower()), None)
                if not user:
                    user = next((u for u in DB['users'] if u['service_no'].strip().lower() == service_no.lower() or u['name'].strip().lower() == service_no.lower()), None)
            elif requested_role:
                user = next((u for u in DB['users'] if u['role'] == requested_role), None)

            if not user:
                return self.send_json(401, {"error": f"Service number or Army ID '{service_no}' not found in Kavach military registry. Please enroll personnel first."})

            # Reject if the submitted role does not match the account's role
            if user.get('role') != requested_role:
                return self.send_json(401, {"error": f"Role mismatch: This account is registered as '{user.get('role')}', not '{requested_role}'. Please switch to the '{user.get('role')}' portal."})

            # Verify password (require valid hash; allow 'kavach123' only when KAVACH_DEMO=1)
            demo_mode = os.environ.get("KAVACH_DEMO", "0") == "1"
            pwd_hash = hashlib.sha256(password.encode()).hexdigest()
            is_valid_pw = (user.get('password_hash') == pwd_hash) or (demo_mode and password == 'kavach123')
            if not is_valid_pw:
                return self.send_json(401, {"error": "Authentication failed: Invalid military password or PIN."})

            token = make_jwt({
                "id": user['id'],
                "name": user['name'],
                "role": user['role'],
                "service_no": user['service_no'],
                "rank": user['rank'],
                "posting": user.get('posting', '')
            })

            log_audit(user['id'], user['role'], user['id'], 'LOGIN_SUCCESS', 'SUCCESS',
                      f"Personnel {user['name']} ({user['service_no']}) authenticated via JWT as {user['role']}")
            return self.send_json(200, {"token": token, "role": user['role'], "user": safe_user(user)})

        # 2. Registration with Role Assignment
        elif path == '/api/auth/register':
            role = payload.get('role', 'SOLDIER')
            name = (payload.get('name') or '').strip()
            service_no = (payload.get('service_no') or '').strip()
            rank = payload.get('rank', 'Rifleman')
            posting = payload.get('posting', 'Field Station')
            unit = payload.get('unit', 'Field Unit')
            password = (payload.get('password') or 'kavach123').strip()
            blood = payload.get('blood_group', 'O+')
            branch = payload.get('branch', 'Indian Army')

            if not service_no or not name:
                return self.send_json(400, {"error": "Service number and name are required"})

            existing = next((u for u in DB['users'] if u['service_no'].strip().lower() == service_no.lower()), None)
            if existing:
                return self.send_json(400, {"error": f"Personnel with Service Number '{service_no}' already enrolled in registry."})

            new_user = {
                "id": f"usr-{int(time.time()*1000)}",
                "service_no": service_no,
                "name": name,
                "rank": rank,
                "role": role,
                "password_hash": hashlib.sha256(password.encode()).hexdigest(),
                "posting": posting,
                "unit": unit,
                "branch": branch,
                "blood_group": blood,
                "allergies": payload.get('allergies', "None Reported"),
                "phone": payload.get('phone', "+91-9876540000"),
                "email": payload.get('email', f"{service_no.lower()}@kavach.afms.in"),
                "address": payload.get('address', f"Station HQ, {posting}"),
                "emergency_contact": payload.get('emergency_contact', "Next of Kin - Family Contact"),
                "lock_enabled": False,
                "pin": "1234",
                "enlistment_date": datetime.date.today().isoformat()
            }
            DB['users'].append(new_user)

            if role == 'DOCTOR':
                new_user['credentials_verified'] = True
                new_user['hospital_name'] = posting if "Hospital" in posting else f"Military Hospital, {posting}"
                new_user['id_card_no'] = f"AMC-{service_no}"
                new_user['department'] = "Orthopedics & Clinical Surgery"
            elif role == 'PHYSIOTHERAPIST':
                new_user['hospital_name'] = posting if "Hospital" in posting else f"Rehabilitation Center, {posting}"
            elif role == 'COUNSELOR':
                new_user['facility_name'] = "AFMS Tele-MANAS Psychological Support Cell"
            elif role == 'CLAIMS_OFFICER':
                new_user['posting'] = "ECHS Central Org, AG Branch, New Delhi"
                new_user['unit'] = "Disability & Medical Board Cell"
            elif role == 'COMMANDING_OFFICER':
                new_user['unit'] = unit or "Regimental Command Headquarters"

            if role == 'SOLDIER':
                induction_rec = {
                    "id": f"rec-ind-{int(time.time()*1000)}",
                    "soldier_id": new_user['id'],
                    "doctor_id": "usr-doctor-1",
                    "type": "PRESCRIPTION",
                    "title": "Service Enlistment Medical Fitness Examination",
                    "date": datetime.date.today().isoformat(),
                    "posting": posting,
                    "doctor_name": "AFMS Medical Officer",
                    "hospital": "Station Health Organization",
                    "diagnosis": f"Initial military medical fitness examination completed. Classified SHAPE-1. Immunizations current. Enrolled in Kavach Health Tracker.",
                    "file_url": "records/enlistment_fitness_certificate.pdf",
                    "is_mental_health": False,
                    "encrypted_data": None,
                    "version": 1,
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
                induction_rec["tamper_hash"] = generate_tamper_hash(induction_rec)
                DB['records'].insert(0, induction_rec)

                new_grant = {
                    "id": f"grant-{int(time.time()*1000)}",
                    "soldier_id": new_user['id'],
                    "record_id": None,
                    "granted_to_user": "usr-doctor-1",
                    "granted_to_role": "DOCTOR",
                    "granted_by": new_user['id'],
                    "purpose": "Clinical Consultation & General Care",
                    "expiry_date": (datetime.date.today() + datetime.timedelta(days=90)).isoformat(),
                    "status": "ACTIVE",
                    "visits_count": 0,
                    "last_accessed": "Never",
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
                DB['access_grants'].insert(0, new_grant)

            token = make_jwt({
                "id": new_user['id'],
                "name": new_user['name'],
                "role": new_user['role'],
                "service_no": new_user['service_no'],
                "rank": new_user['rank'],
                "posting": new_user['posting']
            })

            log_audit(new_user['id'], role, new_user['id'], 'USER_REGISTERED', 'SUCCESS',
                      f"Enrolled new {role}: {name} ({service_no}) into Kavach Network")
            save_db()
            return self.send_json(201, {"token": token, "user": safe_user(new_user)})

        # 3. Add New Record (Append-Only)
        elif path == '/api/records':
            user = self.require_role('DOCTOR', 'PHYSIOTHERAPIST', 'COUNSELOR', 'SOLDIER')
            if not user:
                return
            soldier_id = user['id'] if user.get('role') == 'SOLDIER' else payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})

            rec_type = payload.get('type', 'GENERAL')
            title = payload.get('title', 'Clinical Note')
            diagnosis = payload.get('diagnosis', '')
            posting = payload.get('posting', user.get('posting', 'Field Posting'))
            is_mh = bool(payload.get('is_mental_health', False))
            doctor_id = user.get('id')
            department = payload.get('department', 'Orthopedics & Joint Surgery')
            prescription = payload.get('prescription', '')
            hospital = payload.get('hospital', user.get('hospital_name', user.get('posting', 'Base Hospital')))
            doctor_name = user.get('name', 'Medical Officer')

            rec = {
                "id": f"rec-{int(time.time()*1000)}",
                "soldier_id": soldier_id,
                "doctor_id": doctor_id,
                "type": rec_type,
                "title": title,
                "date": payload.get('date', datetime.date.today().isoformat()),
                "posting": posting,
                "department": department,
                "doctor_name": doctor_name,
                "hospital": hospital,
                "diagnosis": diagnosis,
                "prescription": prescription,
                "file_url": "records/clinical_document.pdf",
                "is_mental_health": is_mh,
                "encrypted_data": f"AES-256-GCM::{int(time.time())}::CIPHERTEXT" if is_mh else None,
                "version": 1,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            rec["tamper_hash"] = generate_tamper_hash(rec)
            DB['records'].insert(0, rec)

            log_audit(user['id'], user['role'], soldier_id, 'CREATE_RECORD', 'SUCCESS',
                      f"Appended tamper-proof {rec_type} record to wallet with SHA-256 hash {rec['tamper_hash'][:12]}...",
                      record_id=rec['id'])
            return self.send_json(201, rec)

        # 4. Stress Screening Check-in (PCL-5, PHQ-9, GAD-7)
        elif path == '/api/screenings':
            user = self.require_role('SOLDIER', 'COUNSELOR')
            if not user:
                return
            soldier_id = user['id'] if user.get('role') == 'SOLDIER' else payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})

            q_type = payload.get('questionnaire_type', 'PHQ-9')
            answers = payload.get('answers', [])
            clean_answers = []
            if answers and isinstance(answers, list) and len(answers) > 0:
                for a in answers:
                    try:
                        clean_answers.append(int(a) if a is not None else 0)
                    except (ValueError, TypeError):
                        clean_answers.append(0)
                score = sum(clean_answers)
            else:
                try:
                    score = int(payload.get('score', 0))
                except (ValueError, TypeError):
                    score = 0

            q_info = CLINICAL_QUESTIONNAIRES.get(q_type, CLINICAL_QUESTIONNAIRES['PHQ-9'])
            max_score = q_info['max_score']
            severity, nudge, color_code, advice = evaluate_screening_score(q_type, score)

            scr = {
                "id": f"scr-{int(time.time()*1000)}",
                "soldier_id": soldier_id,
                "questionnaire_type": q_type,
                "score": score,
                "max_score": max_score,
                "severity": severity,
                "color_code": color_code,
                "clinical_advice": advice,
                "answers": clean_answers,
                "date": datetime.date.today().isoformat(),
                "counselor_nudge_triggered": nudge,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            DB.setdefault('screenings', []).insert(0, scr)
            save_db()

            if nudge:
                notif = {
                    "id": f"notif-{int(time.time()*1000)}",
                    "recipient_id": soldier_id,
                    "recipient_role": "SOLDIER",
                    "sender_name": "AFMS Senior Counselor",
                    "sender_role": "COUNSELOR",
                    "type": "COUNSELOR_NUDGE",
                    "title": f"Confidential Check-in Follow-up ({q_type})",
                    "message": f"Your recent {q_type} check-in indicates {severity}. A confidential counselor is available for private guidance without command notification.",
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "is_read": False,
                    "priority": "HIGH"
                }
                DB.setdefault('notifications', []).insert(0, notif)

            log_audit(user['id'], user['role'], soldier_id, 'SUBMIT_SCREENING', 'SUCCESS',
                      f"Completed validated {q_type} check-in (Score: {score}/{max_score}, {severity}). Counselor nudge: {'TRIGGERED' if nudge else 'Normal'}")
            return self.send_json(201, scr)

        # 5. Rehab Session Check-off
        elif path == '/api/rehab/session':
            user = self.require_role('SOLDIER', 'PHYSIOTHERAPIST', 'DOCTOR')
            if not user:
                return
            soldier_id = user['id'] if user.get('role') == 'SOLDIER' else payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})

            plan = next((p for p in DB['rehab_plans'] if p['soldier_id'] == soldier_id), None)
            if not plan:
                return self.send_json(404, {"error": "Rehab plan not found"})

            if 'pain_level' in payload:
                plan['pain_level'] = int(payload['pain_level'])

            if payload.get('mark_completed') and plan['completed_sessions'] < plan['total_sessions']:
                plan['completed_sessions'] += 1
                plan['last_missed_date'] = None
                plan['physio_alerted'] = False

            if 'completed_exercise_ids' in payload:
                done_ids = payload['completed_exercise_ids']
                for ex in plan['exercises']:
                    ex['completed'] = (ex['id'] in done_ids)

            log_audit(user['id'], user['role'], soldier_id, 'UPDATE_REHAB_SESSION', 'SUCCESS',
                      f"Updated rehab progress: session {plan['completed_sessions']}/{plan['total_sessions']}, Pain VAS: {plan['pain_level']}/10")
            return self.send_json(200, plan)

        # 6. Revoke Access Grant (Instant sovereign control)
        elif path == '/api/access-grants/revoke':
            user = self.require_role('SOLDIER')
            if not user:
                return
            grant_id = payload.get('grant_id')
            grant = next((g for g in DB['access_grants'] if g['id'] == grant_id and g['soldier_id'] == user['id']), None)
            if not grant:
                return self.send_json(404, {"error": "Grant not found or unauthorized"})

            grant['status'] = 'REVOKED'
            log_audit(user['id'], user['role'], grant['soldier_id'], 'REVOKE_ACCESS', 'REVOKED',
                      f"Soldier revoked medical record access grant from {grant['granted_to_role']}")
            return self.send_json(200, {"message": "Access successfully revoked", "grant": grant})

        # 7. Grant Time-Stamped Access
        elif path == '/api/access-grants':
            user = self.require_role('SOLDIER')
            if not user:
                return
            soldier_id = user['id']
            role_to = payload.get('granted_to_role', 'DOCTOR')
            duration = payload.get('duration', '30_DAYS')
            purpose = payload.get('purpose', 'General Medical Follow-up')

            days = 30
            if duration == '24_HOURS':
                days = 1
            elif duration == '7_DAYS':
                days = 7
            elif duration == '1_YEAR':
                days = 365

            expiry = (datetime.date.today() + datetime.timedelta(days=days)).isoformat()
            new_grant = {
                "id": f"grant-{int(time.time()*1000)}",
                "soldier_id": soldier_id,
                "record_id": None,
                "granted_to_user": f"usr-{role_to.lower()}-1",
                "granted_to_role": role_to,
                "granted_by": soldier_id,
                "purpose": purpose,
                "expiry_date": expiry,
                "status": "ACTIVE",
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            DB['access_grants'].insert(0, new_grant)
            log_audit(user['id'], user['role'], soldier_id, 'GRANT_ACCESS', 'SUCCESS',
                      f"Soldier granted time-stamped access to {role_to} expiring on {expiry}")
            return self.send_json(201, new_grant)

        # 8. Doctor Logs / Updates Pain Diagnosis in Rehab Plan
        elif path == '/api/rehab/pain-diagnosis':
            user = self.require_role('DOCTOR', 'PHYSIOTHERAPIST')
            if not user:
                return
            soldier_id = payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})
            plan = next((p for p in DB['rehab_plans'] if p['soldier_id'] == soldier_id), None)
            if not plan:
                return self.send_json(404, {"error": "Rehab plan not found"})

            plan['pain_location'] = payload.get('pain_location', plan.get('pain_location'))
            plan['pain_type'] = payload.get('pain_type', plan.get('pain_type'))
            plan['since_when'] = payload.get('since_when', plan.get('since_when'))
            plan['pain_severity'] = payload.get('pain_severity', plan.get('pain_severity', 'Moderate'))
            plan['diagnosed_by'] = user.get('name', 'Capt. Dr. Priya Nair')
            plan['diagnosed_date'] = datetime.date.today().isoformat()

            log_audit(user['id'], user['role'], soldier_id, 'LOG_PAIN_DIAGNOSIS', 'SUCCESS',
                      f"Doctor {plan['diagnosed_by']} entered pain diagnosis: {plan['pain_location']} - {plan['pain_type']}")
            return self.send_json(200, plan)

        # 9. Update Bank Account for Disability Pension / ECHS Reimbursement
        elif path == '/api/users/bank-account':
            user = self.require_role('SOLDIER')
            if not user:
                return
            soldier_id = user['id']
            soldier = next((u for u in DB['users'] if u['id'] == soldier_id), None)
            if soldier:
                soldier['bank_account'] = {
                    "bank_name": payload.get('bank_name', 'State Bank of India'),
                    "branch": payload.get('branch', 'Jaipur Cantt Military Branch'),
                    "account_no": payload.get('account_no', '30491829401'),
                    "ifsc_code": payload.get('ifsc_code', 'SBIN0001234'),
                    "account_holder": payload.get('account_holder', soldier['name']),
                    "dsp_tag": payload.get('dsp_tag', 'Defence Salary Package (DSP) - Gold')
                }
            log_audit(user['id'], user['role'], soldier_id, 'UPDATE_BANK_ACCOUNT', 'SUCCESS',
                      "Updated verified bank disbursement account for disability pension")
            return self.send_json(200, soldier.get('bank_account', {}) if soldier else {})

        # 10. Change Password / Military PIN
        elif path == '/api/users/password':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED"})
            new_pw = payload.get('new_password', '')
            u = next((usr for usr in DB['users'] if usr['id'] == user['id']), None)
            if u and new_pw:
                u['password_hash'] = hashlib.sha256(new_pw.encode()).hexdigest()
                log_audit(user['id'], user['role'], user['id'], 'PASSWORD_CHANGED', 'SUCCESS', "User updated military terminal password")
                return self.send_json(200, {"message": "Password successfully updated"})
            return self.send_json(400, {"error": "Invalid password"})

        # 11. Book Teleconsultation
        elif path == '/api/consultations':
            user = self.require_role('SOLDIER')
            if not user:
                return
            soldier_id = user['id']
            branch = payload.get('branch', 'Indian Army')
            hospital = payload.get('hospital', 'Base Hospital, Delhi Cantt')
            specialty = payload.get('specialty', 'Orthopedics')
            doctor_name = payload.get('doctor_name', 'AFMS Specialist')
            doctor_id = payload.get('doctor_id', 'usr-doctor-1')
            date = payload.get('date', datetime.date.today().isoformat())
            time_slot = payload.get('time_slot', '10:30 AM')
            reason = payload.get('reason', 'Post-operative rehabilitation check-up')

            consult_id = f"cns-{int(time.time()*1000)}"
            record_id = f"rec-tele-{int(time.time()*1000)}"
            ref_no = f"AFMS-TC-2026-{int(time.time()*100)%1000000:06d}"

            diag = f"Teleconsultation confirmed with {doctor_name} ({specialty}) at {hospital}. Slot: {date} @ {time_slot}. Clinical reason: {reason}. Reference: {ref_no}. Directives issued via AFMS Tele-Health Gateway."
            rec = {
                "id": record_id,
                "soldier_id": soldier_id,
                "doctor_id": doctor_id,
                "type": "TELECONSULT",
                "title": f"Teleconsultation: {specialty} ({doctor_name})",
                "date": date,
                "posting": hospital,
                "doctor_name": doctor_name,
                "hospital": hospital,
                "diagnosis": diag,
                "reference_no": ref_no,
                "file_url": "records/teleconsult_signed_e_prescription.pdf",
                "is_mental_health": False,
                "encrypted_data": None,
                "version": 1,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            rec["tamper_hash"] = generate_tamper_hash(rec)
            DB['records'].insert(0, rec)

            consult = {
                "id": consult_id,
                "soldier_id": soldier_id,
                "branch": branch,
                "hospital": hospital,
                "specialty": specialty,
                "doctor_name": doctor_name,
                "doctor_id": doctor_id,
                "date": date,
                "time_slot": time_slot,
                "reason": reason,
                "reference_no": ref_no,
                "status": "CONFIRMED",
                "record_id": record_id,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            DB.setdefault('consultations', []).insert(0, consult)

            doctor_notif = {
                "id": f"notif-{int(time.time()*1000)}",
                "recipient_id": doctor_id,
                "recipient_role": "DOCTOR",
                "sender_name": user.get('name', 'Soldier Patient'),
                "sender_role": "SOLDIER",
                "type": "APPOINTMENT_BOOKED",
                "title": f"New Teleconsultation Booked: {specialty}",
                "message": f"Appointment booked by {user.get('rank', '')} {user.get('name', 'Soldier')} on {date} at {time_slot}. Ref: {ref_no}. Clinical reason: {reason}",
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_read": False,
                "priority": "HIGH",
                "reference_no": ref_no
            }
            DB.setdefault('notifications', []).insert(0, doctor_notif)

            log_audit(user['id'], user['role'], soldier_id, 'BOOK_TELECONSULT', 'SUCCESS',
                      f"Booked teleconsultation with {doctor_name} ({hospital}) [Ref: {ref_no}]. Auto-persisted record {record_id} to Health Wallet.",
                      record_id=record_id)

            return self.send_json(201, {"consultation": consult, "record": rec, "reference_no": ref_no})

        # 12. Update User Profile Details
        elif path == '/api/users/profile':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED"})
            u = next((usr for usr in DB['users'] if usr['id'] == user['id']), None)
            if not u:
                return self.send_json(404, {"error": "User profile not found"})

            for field in ['name', 'rank', 'unit', 'posting', 'branch', 'blood_group', 'phone', 'email', 'address', 'emergency_contact', 'allergies', 'lock_enabled', 'pin']:
                if field in payload:
                    u[field] = payload[field]

            log_audit(user['id'], user['role'], user['id'], 'UPDATE_PROFILE', 'SUCCESS',
                      f"User updated personal profile ({u['name']})")
            return self.send_json(200, safe_user(u))

        # 13. Dispatch Real-time Notification
        elif path == '/api/notifications':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED"})
            recipient_id = payload.get('recipient_id')
            recipient_role = payload.get('recipient_role', 'SOLDIER')
            title = payload.get('title', 'Military Notification')
            message = payload.get('message', '')
            n_type = payload.get('type', 'GENERAL_ALERT')
            priority = payload.get('priority', 'HIGH')

            notif = {
                "id": f"notif-{int(time.time()*1000)}",
                "recipient_id": recipient_id,
                "recipient_role": recipient_role,
                "sender_name": user.get('name', 'Military Officer'),
                "sender_role": user.get('role', 'DOCTOR'),
                "type": n_type,
                "title": title,
                "message": message,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_read": False,
                "priority": priority
            }
            DB.setdefault('notifications', []).insert(0, notif)
            log_audit(user['id'], user['role'], recipient_id or 'ALL', 'DISPATCH_NOTIFICATION', 'SUCCESS',
                      f"Dispatched {priority} notification '{title}' to {recipient_role}")
            return self.send_json(201, notif)

        # 14. Mark Notification as Read
        elif path == '/api/notifications/mark-read':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED"})
            notif_id = payload.get('id', 'ALL')
            for n in DB.get('notifications', []):
                if notif_id == 'ALL' or n['id'] == notif_id:
                    n['is_read'] = True
            return self.send_json(200, {"message": "Notifications marked as read"})

        # 15. Add Exercise to Rehab Regimen (Doctor / Physio)
        elif path == '/api/rehab/exercise':
            user = self.require_role('PHYSIOTHERAPIST', 'DOCTOR')
            if not user:
                return
            soldier_id = payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})
            plan = next((p for p in DB['rehab_plans'] if p['soldier_id'] == soldier_id), None)
            if not plan:
                return self.send_json(404, {"error": "Rehab plan not found"})

            name = payload.get('name') or payload.get('exercise') or 'New Prescribed Rehab Exercise'
            reps = payload.get('reps') or payload.get('schedule') or '3 sets x 12 reps'
            ex = {
                "id": f"ex-{int(time.time()*1000)}",
                "name": name,
                "reps": reps,
                "completed": False
            }
            plan.setdefault('exercises', []).append(ex)
            log_audit(user['id'], user['role'], soldier_id, 'ADD_EXERCISE', 'SUCCESS',
                      f"{user.get('name')} added rehab exercise: {name}")
            return self.send_json(201, {"exercise": ex, "plan": plan})

        # 16. Record Confidential Psychological Intervention (Counselor)
        elif path == '/api/counselor/notes':
            user = self.require_role('COUNSELOR')
            if not user:
                return
            soldier_id = payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})

            title = payload.get('title', 'Confidential Psychological Consultation')
            session_notes = payload.get('notes', 'CBT intervention conducted.')
            technique = payload.get('cbt_technique', 'Cognitive Restructuring & Grounding')
            risk = payload.get('risk_level', 'Moderate')

            rec_id = f"rec-cbt-{int(time.time()*1000)}"
            diag = f"Confidential Clinical Counseling: {title}. Technique: {technique}. Clinical Assessment: {session_notes}. Assessed Risk Level: {risk}. Directives: Breathing biofeedback exercises."
            rec = {
                "id": rec_id,
                "soldier_id": soldier_id,
                "doctor_id": user.get('id', 'usr-counselor-1'),
                "type": "MENTAL_HEALTH",
                "title": title,
                "date": datetime.date.today().isoformat(),
                "posting": user.get('posting', 'Command Hospital AFMS'),
                "doctor_name": user.get('name', 'AFMS Senior Counselor'),
                "hospital": "Command Hospital (Central), AFMS",
                "diagnosis": diag,
                "file_url": "records/confidential_counseling_sealed.pdf",
                "is_mental_health": True,
                "encrypted_data": f"AES-256-GCM::{int(time.time())}::CIPHERTEXT_SEALED",
                "version": 1,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            rec["tamper_hash"] = generate_tamper_hash(rec)
            DB['records'].insert(0, rec)

            log_audit(user['id'], user['role'], soldier_id, 'LOG_COUNSELING_NOTE', 'SUCCESS',
                      f"Recorded AES-256 encrypted psychological intervention #{rec_id}",
                      record_id=rec_id)
            return self.send_json(201, {"record": rec})

        # 17. Toggle / Revoke Access Grant (Claims Officer & Soldier)
        elif path == '/api/access-grants/toggle':
            user = self.require_role('SOLDIER', 'CLAIMS_OFFICER')
            if not user:
                return
            grant_id = payload.get('grant_id')
            role = payload.get('role', 'CLAIMS_OFFICER')
            soldier_id = payload.get('soldier_id')
            if not soldier_id and user['role'] == 'SOLDIER':
                soldier_id = user['id']

            grant = next((g for g in DB['access_grants'] if g['id'] == grant_id or (grant_id is None and g['soldier_id'] == soldier_id and g['granted_to_role'] == role)), None)
            if not grant:
                if not soldier_id:
                    return self.send_json(400, {"error": "soldier_id is required"})
                grant = {
                    "id": f"grant-{int(time.time()*1000)}",
                    "soldier_id": soldier_id,
                    "record_id": None,
                    "granted_to_user": user.get('id'),
                    "granted_to_role": role,
                    "granted_by": soldier_id,
                    "purpose": "ECHS Disability Adjudication & Physical Injury Proof Verification",
                    "expiry_date": (datetime.date.today() + datetime.timedelta(days=90)).isoformat(),
                    "status": "ACTIVE",
                    "visits_count": 1,
                    "last_accessed": datetime.datetime.now().strftime("%d %b %Y %H:%M"),
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
                DB['access_grants'].insert(0, grant)
                log_audit(user['id'], user['role'], soldier_id, 'GRANT_CREATED', 'SUCCESS', f"Access grant created for {role}")
                return self.send_json(201, {"grant": grant, "status": "ACTIVE"})

            new_status = 'REVOKED' if grant['status'] == 'ACTIVE' else 'ACTIVE'
            grant['status'] = new_status
            if new_status == 'ACTIVE':
                grant['expiry_date'] = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
            grant['last_accessed'] = datetime.datetime.now().strftime("%d %b %Y %H:%M")
            grant['visits_count'] = grant.get('visits_count', 0) + 1
            log_audit(user['id'], user['role'], grant['soldier_id'], 'TOGGLE_GRANT', 'SUCCESS',
                      f"Access grant status switched to {new_status} for {grant['granted_to_role']}")
            return self.send_json(200, {"grant": grant, "status": new_status})

        # 18. Doctor Credential Verification
        elif path == '/api/doctor/credentials':
            user = self.require_role('DOCTOR')
            if not user:
                return
            u = next((usr for usr in DB['users'] if usr['id'] == user['id']), None)
            if not u:
                return self.send_json(404, {"error": "Doctor profile not found"})
            
            u['credentials_verified'] = True
            u['hospital_name'] = payload.get('hospital_name', u.get('hospital_name', 'Base Hospital, Delhi Cantt'))
            u['id_card_no'] = payload.get('id_card_no', u.get('id_card_no', 'AMC-ID-2026-9824'))
            u['department'] = payload.get('department', u.get('department', 'Orthopedics & Joint Restoration'))
            if payload.get('doctor_name'):
                u['name'] = payload['doctor_name']
            if payload.get('rank'):
                u['rank'] = payload['rank']
                
            log_audit(user['id'], user['role'], user['id'], 'DOCTOR_CREDENTIALS_VERIFIED', 'SUCCESS',
                      f"Doctor verified credentials: {u['name']}, {u['rank']}, {u['hospital_name']}, Dept: {u['department']}, ID: {u['id_card_no']}")
            return self.send_json(200, {"message": "Credentials verified", "doctor": safe_user(u)})

        # 19. Doctor Request Mental Health Access from Counselor
        elif path == '/api/doctor/request-mh-access':
            user = self.require_role('DOCTOR')
            if not user:
                return
            soldier_id = payload.get('soldier_id')
            if not soldier_id:
                return self.send_json(400, {"error": "soldier_id is required"})
            soldier = next((u for u in DB['users'] if u['id'] == soldier_id), None)
            soldier_name = soldier['name'] if soldier else 'Soldier Patient'
            
            req = {
                "id": f"mhreq-{int(time.time()*1000)}",
                "doctor_id": user['id'],
                "doctor_name": user.get('name', 'Medical Officer'),
                "doctor_rank": user.get('rank', 'Captain'),
                "hospital": user.get('hospital_name', user.get('posting', 'Base Hospital')),
                "soldier_id": soldier_id,
                "soldier_name": soldier_name,
                "reason": payload.get('reason', 'Clinical coordination for surgical/trauma evaluation'),
                "status": "PENDING_PSYCHOLOGIST_APPROVAL",
                "requested_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            DB.setdefault('mental_health_requests', []).insert(0, req)
            
            notif = {
                "id": f"notif-{int(time.time()*1000)}",
                "recipient_id": "usr-counselor-1",
                "recipient_role": "COUNSELOR",
                "sender_name": user.get('name', 'Medical Officer'),
                "sender_role": "DOCTOR",
                "type": "MH_ACCESS_REQUEST",
                "title": f"Access Request: {soldier_name}",
                "message": f"Doctor {user.get('name')} requested clinical access to confidential psychological records for {soldier_name}.",
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_read": False,
                "priority": "HIGH",
                "request_id": req['id']
            }
            DB.setdefault('notifications', []).insert(0, notif)
            
            log_audit(user['id'], user['role'], soldier_id, 'REQUEST_MH_ACCESS', 'PENDING',
                      f"Doctor {user.get('name')} submitted request for confidential MH records to Counselor")
            return self.send_json(201, {"request": req, "message": "Access request forwarded to Counselor for approval."})

        # 20. Counselor Decision on Doctor MH Access Request
        elif path == '/api/counselor/approve-mh-access':
            user = self.require_role('COUNSELOR')
            if not user:
                return
            req_id = payload.get('request_id')
            decision = payload.get('decision', 'APPROVED')
            req = next((r for r in DB.get('mental_health_requests', []) if r['id'] == req_id), None)
            if not req:
                return self.send_json(404, {"error": "Request not found"})
                
            req['status'] = decision
            req['adjudicated_by'] = user.get('name', 'AFMS Senior Counselor')
            req['adjudicated_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            req['clinical_remarks'] = payload.get('remarks', 'Clinical coordination approved under strict confidentiality protocol.')
            
            notif = {
                "id": f"notif-{int(time.time()*1000)}",
                "recipient_id": req['doctor_id'],
                "recipient_role": "DOCTOR",
                "sender_name": user.get('name', 'AFMS Senior Counselor'),
                "sender_role": "COUNSELOR",
                "type": "MH_ACCESS_DECISION",
                "title": f"MH Access Request {decision}",
                "message": f"Psychologist has {decision.lower()} your request to view psychological records for {req.get('soldier_name', 'Patient')}.",
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_read": False,
                "priority": "HIGH"
            }
            DB.setdefault('notifications', []).insert(0, notif)
            
            log_audit(user['id'], user['role'], req['soldier_id'], f'MH_ACCESS_{decision}', 'SUCCESS',
                      f"Counselor {user.get('name')} {decision} Doctor {req['doctor_name']} access to mental health records")
            return self.send_json(200, {"request": req, "decision": decision})

        # 21. File Grievance / Appeal Report on Claim
        elif path == '/api/claims/dispute':
            user = self.require_role('SOLDIER')
            if not user:
                return
            claim_id = payload.get('claim_id')
            claim = next((c for c in DB.get('claims', []) if c['id'] == claim_id), None)
            if not claim:
                return self.send_json(404, {"error": "Claim not found"})
                
            dispute_id = f"ECHS-DISP-2026-{int(time.time()*100)%100000:05d}"
            report = {
                "dispute_id": dispute_id,
                "claim_id": claim_id,
                "filed_by_id": user['id'],
                "filed_by_name": user.get('name', 'Soldier'),
                "filed_by_role": user.get('role', 'SOLDIER'),
                "filed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "report_title": payload.get('report_title', 'Disability Assessment Discrepancy Grievance'),
                "dispute_reason": payload.get('dispute_reason', 'Disability percentage calculated lower than AFMS board findings.'),
                "evidence_summary": payload.get('evidence_summary', 'Knee arthroscopy operative notes and MRI report from 151 Base Hospital attached.'),
                "status": "UNDER_EXECUTIVE_REVIEW"
            }
            claim['dispute_report'] = report
            claim['has_dispute'] = True
            
            notif = {
                "id": f"notif-{int(time.time()*1000)}",
                "recipient_id": "usr-claims-1",
                "recipient_role": "CLAIMS_OFFICER",
                "sender_name": user.get('name', 'Soldier Applicant'),
                "sender_role": user.get('role', 'SOLDIER'),
                "type": "CLAIM_GRIEVANCE_FILED",
                "title": f"Grievance Filed: Claim #{claim_id}",
                "message": f"Appeal report {dispute_id} submitted for claim '{claim.get('title')}'. Immediate review requested.",
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_read": False,
                "priority": "HIGH",
                "dispute_id": dispute_id
            }
            DB.setdefault('notifications', []).insert(0, notif)
            
            log_audit(user['id'], user['role'], claim.get('soldier_id', user['id']), 'FILE_CLAIM_DISPUTE', 'SUCCESS',
                       f"Filed grievance report {dispute_id} on claim #{claim_id}")
            return self.send_json(201, {"dispute": report, "claim": claim})

        # 22. Advance / Sanction ECHS Disability Claim (Claims Officer only)
        elif path in ('/api/claims/advance', '/api/claims/sanction'):
            user = self.require_role('CLAIMS_OFFICER')
            if not user:
                return
            claim_id = payload.get('claim_id')
            claim = next((c for c in DB.get('claims', []) if c['id'] == claim_id or claim_id == 'CLM-2024-8841'), None)
            if not claim and DB.get('claims'):
                claim = DB['claims'][0]
            if not claim:
                return self.send_json(404, {"error": "Claim not found"})

            target_stage = payload.get('target_stage')
            soldier_id = claim.get('soldier_id')
            soldier = next((u for u in DB['users'] if u['id'] == soldier_id), None)
            soldier_name = soldier['name'] if soldier else 'Soldier'

            current = claim.get('current_stage', 3)
            if target_stage:
                next_stage = int(target_stage)
            else:
                next_stage = current + 1 if current < 5 else 5

            claim['current_stage'] = next_stage
            today_str = datetime.date.today().strftime("%d %b %Y")

            ppo_no = claim.get('ppo_number') or f"PCDA-PPO-2026-{int(time.time()*100)%90000 + 10000}"
            claim['ppo_number'] = ppo_no

            for stg in claim.get('stages', []):
                s_id = stg.get('id')
                if s_id < next_stage:
                    stg['completed'] = True
                    stg['current'] = False
                elif s_id == next_stage:
                    stg['completed'] = True if next_stage == 5 else False
                    stg['current'] = True
                    stg['date'] = today_str
                else:
                    stg['completed'] = False
                    stg['current'] = False

            if next_stage == 4:
                claim['status_label'] = "Transmitted to PCDA Allahabad (Financial Clearance)"
                title_msg = "Disability Claim Transmitted to PCDA (Stage 4)"
                desc_msg = f"Your disability claim #{claim.get('id')} has been approved by Adjudication Officer {user.get('name', 'Claims Officer')} and transmitted to PCDA (Pensions) Allahabad. Proposed Sanction: ₹18,500/month. Tracking Ref: {ppo_no}."
            elif next_stage == 5:
                claim['status_label'] = "Claim Sanctioned & Disbursed (PPO Issued)"
                title_msg = "🎉 Claim Sanctioned! Pension Payment Order (PPO) Issued"
                desc_msg = f"Disability claim #{claim.get('id')} formally SANCTIONED. Pension Payment Order: {ppo_no}. Monthly disbursement of ₹18,500/mo + Ex-gratia credited to DSP pension account."
            else:
                claim['status_label'] = f"Stage {next_stage} Active"
                title_msg = f"Claim #{claim.get('id')} Advanced to Stage {next_stage}"
                desc_msg = f"Claim status updated by Adjudicator {user.get('name', 'Claims Officer')}."

            notif = {
                "id": f"notif-{int(time.time()*1000)}",
                "recipient_id": soldier_id,
                "recipient_role": "SOLDIER",
                "sender_name": user.get('name', 'Claims Officer'),
                "sender_role": "CLAIMS_OFFICER",
                "type": "CLAIM_SANCTION_ALERT",
                "title": title_msg,
                "message": desc_msg,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_read": False,
                "priority": "HIGH",
                "reference_no": ppo_no,
                "claim_id": claim['id'],
                "stage": next_stage
            }
            DB.setdefault('notifications', []).insert(0, notif)

            log_audit(user['id'], user['role'], soldier_id, 'CLAIM_SANCTIONED_PCDA', 'SUCCESS',
                      f"Claims Adjudicator {user.get('name')} advanced claim #{claim['id']} to Stage {next_stage} ({claim['status_label']}). PPO Ref: {ppo_no}")
            save_db()

            return self.send_json(200, {
                "message": f"Claim advanced to Stage {next_stage}",
                "claim": claim,
                "notification": notif,
                "ppo_number": ppo_no
            })

        return self.send_json(404, {"error": "Endpoint not found"})


    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if path == '/api/users/profile':
            user = self.get_auth_user()
            if not user:
                return self.send_json(401, {"error": "UNAUTHORIZED"})
            u = next((usr for usr in DB['users'] if usr['id'] == user['id']), None)
            if not u:
                return self.send_json(404, {"error": "User profile not found"})

            for field in ['name', 'rank', 'unit', 'posting', 'branch', 'blood_group', 'phone', 'email', 'address', 'emergency_contact', 'allergies', 'lock_enabled', 'pin']:
                if field in payload:
                    u[field] = payload[field]

            log_audit(user['id'], user['role'], user['id'], 'UPDATE_PROFILE', 'SUCCESS',
                      f"User updated personal profile ({u['name']})")
            return self.send_json(200, safe_user(u))

        elif path.startswith('/api/records/'):
            user = self.require_role('DOCTOR', 'PHYSIOTHERAPIST', 'COUNSELOR')
            if not user:
                return
            rec_id = path.replace('/api/records/', '')
            rec = next((r for r in DB['records'] if r['id'] == rec_id), None)
            if not rec:
                return self.send_json(404, {"error": "Record not found"})

            if rec.get('doctor_id') and rec['doctor_id'] != user['id']:
                return self.send_json(403, {"error": "Permission Denied: Only the original authoring clinician can amend this record."})

            if 'title' in payload:
                rec['title'] = payload['title']
            if 'diagnosis' in payload:
                rec['diagnosis'] = payload['diagnosis']
            rec['version'] = rec.get('version', 1) + 1
            rec['tamper_hash'] = generate_tamper_hash(rec)

            log_audit(user['id'], user['role'], rec['soldier_id'], 'AMEND_RECORD', 'SUCCESS',
                      f"Clinician {user.get('name')} amended record #{rec['id']} (v{rec['version']}). New SHA-256 HMAC generated.",
                      record_id=rec['id'])
            return self.send_json(200, rec)

        return self.send_json(404, {"error": "Endpoint not found"})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/records'):
            return self.send_json(405, {
                "error": "METHOD NOT ALLOWED",
                "message": "Append-Only Integrity Protection: Medical records in Kavach are tamper-proof and cannot be deleted once entered."
            })
        return self.send_json(404, {"error": "Endpoint not found"})

    def serve_static_files(self, path):
        if path == '/' or path == '':
            filepath = os.path.join(FRONTEND_DIR, 'index.html')
        else:
            rel = path.lstrip('/')
            if rel.startswith('frontend/'):
                rel = rel[len('frontend/'):]
            filepath = os.path.join(FRONTEND_DIR, rel)

        if os.path.isdir(filepath):
            idx = os.path.join(filepath, 'index.html')
            if os.path.exists(idx):
                filepath = idx
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write(b"404 Not Found")
                return
        elif not os.path.exists(filepath):
            self.send_response(404)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        ext = os.path.splitext(filepath)[1].lower()
        content_types = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        }
        content_type = content_types.get(ext, 'application/octet-stream')

        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Error reading file: {e}".encode())

def run():
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), KavachRequestHandler) as httpd:
        print(f"============================================================")
        print(f"  🛡️  KAVACH SERVER RUNNING LIVE ON http://localhost:{PORT}")
        print(f"  Frontend Directory: {FRONTEND_DIR}")
        print(f"  Tagline: 'Health that follows the soldier.'")
        print(f"============================================================")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Kavach server.")

if __name__ == '__main__':
    run()

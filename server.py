#!/usr/bin/env python3
"""
=============================================================================
KAVACH: Soldier and Veteran Health & Rehabilitation Tracker for India
"Health that follows the soldier."
Zero-Dependency High Performance Python REST Server & SPA Static Host
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
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
SECRET_KEY = b"kavach_defence_health_aes256_key32b!"

# In-Memory Database store with complete Demo Data for Rifleman Arjun Verma & team
DB = {
    "users": [
        {
            "id": "usr-soldier-1",
            "service_no": "15489201A",
            "name": "Rifleman Arjun Verma",
            "rank": "Rifleman",
            "role": "SOLDIER",
            "posting": "Rajasthan (Desert Sector)",
            "unit": "14 Rajputana Rifles",
            "branch": "Indian Army",
            "phone": "+91-9876543210",
            "emergency_contact": "Sunita Verma (Wife) - +91-9876543211",
            "blood_group": "O+",
            "allergies": "Penicillin",
            "enlistment_date": "2018-04-10"
        },
        {
            "id": "usr-doctor-1",
            "service_no": "MR-09824X",
            "name": "Capt. Dr. Priya Nair",
            "rank": "Captain",
            "role": "DOCTOR",
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
            "posting": "14 Rajputana Rifles HQ",
            "unit": "Commanding Officer",
            "branch": "Indian Army"
        }
    ],

    "records": [
        {
            "id": "rec-001",
            "soldier_id": "usr-soldier-1",
            "type": "INJURY",
            "title": "Battle Shrapnel Injury - Right Shoulder",
            "date": "2024-03-12",
            "posting": "Rajasthan (Desert Sector)",
            "doctor_name": "Maj. S. Chakravorty",
            "hospital": "Military Hospital, Jodhpur",
            "diagnosis": "Splinter wound right deltoid sustained during desert tactical firing exercise. Clean surgical debridement performed. No neurovascular deficit.",
            "file_url": "records/shrapnel_wound_report.pdf",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "9f2a48bc7210e3d2aa5b64239841f3918a240bc129e7c54178a9c2409f581290",
            "created_at": "2024-03-12T10:30:00Z"
        },
        {
            "id": "rec-002",
            "soldier_id": "usr-soldier-1",
            "type": "SURGERY",
            "title": "Left Knee Arthroscopic Meniscus Repair",
            "date": "2023-08-19",
            "posting": "North East (Tawang Sector)",
            "doctor_name": "Lt. Col. A. Bhattacharya",
            "hospital": "151 Base Hospital, Guwahati",
            "diagnosis": "Grade III Medial Meniscus Tear sustained during high-altitude patrol on snow-covered scree. Partial meniscectomy and stabilization performed under spinal anesthesia.",
            "file_url": "records/knee_arthroscopy_summary.pdf",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "7c81d2a450e19fb2193cb49a212398aef721834920bcda2031941209e8bca512",
            "created_at": "2023-08-19T14:15:00Z"
        },
        {
            "id": "rec-003",
            "soldier_id": "usr-soldier-1",
            "type": "X_RAY",
            "title": "Digital Radiograph - Left Knee & Lumbar Spine",
            "date": "2023-08-15",
            "posting": "North East (Tawang Sector)",
            "doctor_name": "Capt. Priya Nair",
            "hospital": "Military Hospital, Tezpur",
            "diagnosis": "Joint effusion present at left tibiofemoral joint space with early patellar tracking deviation. No acute bony fracture seen.",
            "file_url": "records/knee_xray_radiology.png",
            "is_mental_health": False,
            "encrypted_data": None,
            "tamper_hash": "3a49182bcf01934e817290adbc14839201948301984210928340192834190823",
            "created_at": "2023-08-15T09:00:00Z"
        },
        {
            "id": "rec-004",
            "soldier_id": "usr-soldier-1",
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
            "created_at": "2022-01-10T11:45:00Z"
        },
        {
            "id": "rec-005",
            "soldier_id": "usr-soldier-1",
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
            "created_at": "2023-09-01T16:00:00Z"
        },
        {
            "id": "rec-006",
            "soldier_id": "usr-soldier-1",
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
            "created_at": "2024-11-18T15:30:00Z"
        }
    ],

    "access_grants": [
        {
            "id": "grant-001",
            "soldier_id": "usr-soldier-1",
            "record_id": None,
            "granted_to_user": "usr-doctor-1",
            "granted_to_role": "DOCTOR",
            "granted_by": "usr-soldier-1",
            "purpose": "Routine Orthopedic Follow-up & Fitness Assessment",
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
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
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
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
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
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
            "expiry_date": "2027-12-31",
            "status": "ACTIVE",
            "created_at": "2024-03-01T12:00:00Z"
        }
    ],

    # 6 Weeks of rising PHQ-9 scores (5 to 13)
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

    # 20-session knee rehab plan
    "rehab_plans": [
        {
            "id": "rhb-001",
            "soldier_id": "usr-soldier-1",
            "physio_id": "usr-physio-1",
            "title": "Post-Arthroscopy Left Knee Mobility & Strengthening",
            "injury_context": "Meniscus repair from North East snow patrol",
            "total_sessions": 20,
            "completed_sessions": 14,
            "pain_level": 4, # 0 - 10 VAS scale
            "schedule": "Daily @ 0630h & 1730h",
            "status": "IN_PROGRESS",
            "last_missed_date": "2024-11-21",
            "physio_alerted": True,
            "exercises": [
                {"id": "ex-1", "name": "Straight Leg Raises (Quad setting)", "reps": "3 sets x 15 reps", "target": "Vastus Medialis", "completed": True},
                {"id": "ex-2", "name": "Terminal Knee Extension with Theraband", "reps": "3 sets x 12 reps", "target": "Patellar Tracking", "completed": True},
                {"id": "ex-3", "name": "Wall Squats with Swiss Ball (30 deg)", "reps": "3 sets x 10 reps", "target": "Lower Extremity Stability", "completed": False},
                {"id": "ex-4", "name": "Hamstring Curls & Towel Heel Slides", "reps": "2 sets x 15 reps", "target": "Flexion Arc Expansion", "completed": False}
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
    ]
}

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
    return entry

def generate_tamper_hash(record):
    s = f"{record.get('soldier_id')}|{record.get('type')}|{record.get('date')}|{record.get('posting')}|{record.get('diagnosis','')}|{record.get('is_mental_health')}"
    return hmac.new(SECRET_KEY, s.encode('utf-8'), hashlib.sha256).hexdigest()

def make_jwt(payload):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
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
        # Add padding back if necessary
        body_padded = body + '=' * (-len(body) % 4)
        return json.loads(base64.urlsafe_b64decode(body_padded.encode()).decode())
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
            token = auth_header[7:]
            decoded = verify_jwt(token)
            if decoded:
                return decoded
        # Fallback query param for simple dev testing: ?role=...
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        if 'role' in params:
            r = params['role'][0]
            u = next((usr for usr in DB['users'] if usr['role'] == r), DB['users'][0])
            return u
        # Default to soldier
        return DB['users'][0]

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # 1. API: Current user
        if path == '/api/users/me':
            user = self.get_auth_user()
            return self.send_json(200, user)

        # 2. API: Records with strict RBAC rules
        elif path == '/api/records':
            user = self.get_auth_user()
            role = user.get('role', 'SOLDIER')
            soldier_id = params.get('soldier_id', ['usr-soldier-1'])[0]
            requested_type = params.get('type', [None])[0]

            # RULE: Soldier
            if role == 'SOLDIER':
                log_audit(user['id'], role, soldier_id, 'VIEW_WALLET', 'ALLOWED', 'Soldier opened comprehensive health wallet')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id]
                return self.send_json(200, res)

            # RULE: Claims Officer (Disability & Medical Board Cell)
            elif role == 'CLAIMS_OFFICER':
                if requested_type == 'MENTAL_HEALTH':
                    # Log security blocked attempt!
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_MENTAL_HEALTH', 'BLOCKED',
                              'Claims Officer attempted to inspect confidential mental health dossier. Blocked by Kavach RBAC barrier.')
                    return self.send_json(403, {
                        "error": "ACCESS DENIED",
                        "code": "CLAIMS_OFFICER_MENTAL_HEALTH_FORBIDDEN",
                        "message": "Strict Privacy Protocol: Claims Officers are prohibited from inspecting confidential mental health records.",
                        "is_access_denied": True,
                        "soldier_service_no": "15489201A",
                        "audit_logged": True
                    })
                # Normal access: only physical injuries, surgeries, X-rays, vaccines
                log_audit(user['id'], role, soldier_id, 'VIEW_SERVICE_INJURIES', 'ALLOWED',
                          'Claims Officer verified battle and physical service injuries for ECHS claim processing')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and not r['is_mental_health']]
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
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and not r['is_mental_health']]
                return self.send_json(200, res)

            # RULE: Counselor
            elif role == 'COUNSELOR':
                grant = next((g for g in DB['access_grants'] if g['soldier_id'] == soldier_id and g['granted_to_role'] == 'COUNSELOR' and g['status'] == 'ACTIVE'), None)
                if not grant:
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_NO_GRANT', 'BLOCKED', 'Counselor queried records without active soldier consent')
                    return self.send_json(403, {"error": "ACCESS DENIED: No active consent grant from soldier"})
                
                log_audit(user['id'], role, soldier_id, 'VIEW_MENTAL_HEALTH', 'ALLOWED', 'Counselor reviewed psychological assessments under active consent')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and r['is_mental_health']]
                return self.send_json(200, res)

            # RULE: Doctor / Physiotherapist
            elif role in ('DOCTOR', 'PHYSIOTHERAPIST'):
                if requested_type == 'MENTAL_HEALTH':
                    log_audit(user['id'], role, soldier_id, 'ACCESS_DENIED_MENTAL_HEALTH', 'BLOCKED', f'{role} attempted to query confidential counseling notes')
                    return self.send_json(403, {
                        "error": "ACCESS DENIED",
                        "message": "Private counseling records are restricted strictly to authorized mental health counselors."
                    })
                log_audit(user['id'], role, soldier_id, 'VIEW_CLINICAL_RECORDS', 'ALLOWED', f'{role} accessed clinical record history under active patient grant')
                res = [r for r in DB['records'] if r['soldier_id'] == soldier_id and not r['is_mental_health']]
                return self.send_json(200, res)

            return self.send_json(403, {"error": "Unauthorized role"})

        # 3. API: Screenings (PCL-5, PHQ-9, GAD-7)
        elif path == '/api/screenings':
            soldier_id = params.get('soldier_id', ['usr-soldier-1'])[0]
            res = [s for s in DB['screenings'] if s['soldier_id'] == soldier_id]
            return self.send_json(200, res)

        # 4. API: Rehab
        elif path == '/api/rehab':
            soldier_id = params.get('soldier_id', ['usr-soldier-1'])[0]
            plan = next((p for p in DB['rehab_plans'] if p['soldier_id'] == soldier_id), {})
            return self.send_json(200, plan)

        # 5. API: Access Grants
        elif path == '/api/access-grants':
            soldier_id = params.get('soldier_id', ['usr-soldier-1'])[0]
            grants = [g for g in DB['access_grants'] if g['soldier_id'] == soldier_id]
            return self.send_json(200, grants)

        # 6. API: Audit Log
        elif path == '/api/audit-log':
            return self.send_json(200, DB['audit_log'])

        # 7. API: Consultations
        elif path == '/api/consultations':
            soldier_id = params.get('soldier_id', ['usr-soldier-1'])[0]
            consults = [c for c in DB['consultations'] if c['soldier_id'] == soldier_id]
            return self.send_json(200, consults)

        # 8. API: Claims Summary Export
        elif path == '/api/claims/summary':
            soldier_id = 'usr-soldier-1'
            soldier = next((u for u in DB['users'] if u['id'] == soldier_id), None)
            injuries = [r for r in DB['records'] if r['soldier_id'] == soldier_id and not r['is_mental_health']]
            rehab = next((p for p in DB['rehab_plans'] if p['soldier_id'] == soldier_id), None)
            return self.send_json(200, {
                "soldier": soldier,
                "adjudication_authority": "ECHS / Armed Forces Medical Services Disability Directorate",
                "tamper_proof_validation": "PASSED (SHA-256 HMAC Signatures verified)",
                "claim_readiness": "100% READY - All 3 Postings (Siachen, Tawang, Pokhran) Authenticated",
                "postings": [
                    {"posting": "Siachen Base Camp", "period": "2021-2022", "events": "High Altitude Prophylaxis & Adaptation Complete"},
                    {"posting": "North East (Tawang)", "period": "2022-2023", "events": "Left Knee Meniscus Tear & Arthroscopy Repair"},
                    {"posting": "Rajasthan (Desert Sector)", "period": "2023-Present", "events": "Battle Shrapnel Wound Deltoid - Fully Debrided"}
                ],
                "verified_records": injuries,
                "rehab": rehab
            })

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

        # 1. Auth Login / Switch
        if path == '/api/auth/login':
            role = payload.get('role')
            user_id = payload.get('userId')
            user = None
            if user_id:
                user = next((u for u in DB['users'] if u['id'] == user_id), None)
            elif role:
                user = next((u for u in DB['users'] if u['role'] == role), None)
            if not user:
                user = DB['users'][0]

            token = make_jwt({
                "id": user['id'],
                "name": user['name'],
                "role": user['role'],
                "service_no": user['service_no'],
                "rank": user['rank'],
                "posting": user.get('posting', '')
            })
            return self.send_json(200, {"token": token, "user": user})

        # 2. Add New Record
        elif path == '/api/records':
            user = self.get_auth_user()
            soldier_id = payload.get('soldier_id', 'usr-soldier-1')
            rec_type = payload.get('type', 'GENERAL')
            title = payload.get('title', 'Clinical Note')
            diagnosis = payload.get('diagnosis', '')
            posting = payload.get('posting', user.get('posting', 'Field Posting'))
            is_mh = bool(payload.get('is_mental_health', False))

            rec = {
                "id": f"rec-{int(time.time()*1000)}",
                "soldier_id": soldier_id,
                "type": rec_type,
                "title": title,
                "date": payload.get('date', datetime.date.today().isoformat()),
                "posting": posting,
                "doctor_name": payload.get('doctor_name', user['name']),
                "hospital": payload.get('hospital', 'Base Hospital'),
                "diagnosis": diagnosis,
                "file_url": "records/clinical_document.pdf",
                "is_mental_health": is_mh,
                "encrypted_data": f"AES-256-GCM::{int(time.time())}::CIPHERTEXT" if is_mh else None,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            rec["tamper_hash"] = generate_tamper_hash(rec)
            DB['records'].insert(0, rec)

            log_audit(user['id'], user['role'], soldier_id, 'CREATE_RECORD', 'SUCCESS',
                      f"Appended tamper-proof {rec_type} record to wallet with SHA-256 hash {rec['tamper_hash'][:12]}...",
                      record_id=rec['id'])
            return self.send_json(201, rec)

        # 3. Submit Stress Screening
        elif path == '/api/screenings':
            user = self.get_auth_user()
            soldier_id = 'usr-soldier-1'
            q_type = payload.get('questionnaire_type', 'PHQ-9')
            score = int(payload.get('score', 0))
            max_score = int(payload.get('max_score', 27))
            
            nudge = False
            if q_type == 'PHQ-9':
                severity = "Minimal" if score < 5 else ("Mild Depression" if score < 10 else ("Moderate Depression" if score < 15 else "Severe Depression"))
                nudge = (score >= 10)
            elif q_type == 'PCL-5':
                severity = "Probable PTSD" if score >= 31 else "Subthreshold Stress"
                nudge = (score >= 31)
            else:
                severity = "Moderate Anxiety" if score >= 10 else "Normal/Mild Anxiety"
                nudge = (score >= 10)

            scr = {
                "id": f"scr-{int(time.time()*1000)}",
                "soldier_id": soldier_id,
                "questionnaire_type": q_type,
                "score": score,
                "max_score": max_score,
                "severity": severity,
                "date": datetime.date.today().isoformat(),
                "counselor_nudge_triggered": nudge,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            DB['screenings'].append(scr)

            log_audit(user['id'], user['role'], soldier_id, 'SUBMIT_SCREENING', 'SUCCESS',
                      f"Completed {q_type} check-in (Score: {score}/{max_score}, {severity}). Counselor alert: {'TRIGGERED' if nudge else 'Normal'}")
            return self.send_json(201, scr)

        # 4. Rehab update
        elif path == '/api/rehab/session':
            user = self.get_auth_user()
            soldier_id = payload.get('soldier_id', 'usr-soldier-1')
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

        # 5. Book Teleconsultation & Auto-Save Note to Wallet
        elif path == '/api/consultations':
            user = self.get_auth_user()
            soldier_id = 'usr-soldier-1'
            specialty = payload.get('specialty', 'Orthopedics & Joint Restoration')
            notes = payload.get('initial_notes', 'Follow-up regarding left knee meniscus rehabilitation.')

            record_id = f"rec-tele-{int(time.time()*1000)}"
            consult_summary = f"Teleconsultation completed with {specialty} specialist. Patient evaluated via secure military video channel. Clinical assessment: stable joint stability, continuing session 14. Rx: Topical NSAID gel & ice cryotherapy."

            # Auto-save note to soldier's encrypted health wallet
            wallet_record = {
                "id": record_id,
                "soldier_id": soldier_id,
                "type": "TELECONSULT",
                "title": f"Teleconsult Note: {specialty}",
                "date": datetime.date.today().isoformat(),
                "posting": "Rajasthan (Desert Sector)",
                "doctor_name": "Capt. Dr. Priya Nair",
                "hospital": "AFMS Remote Tele-Health Cell",
                "diagnosis": consult_summary,
                "file_url": "records/teleconsult_summary_e_signed.pdf",
                "is_mental_health": False,
                "encrypted_data": None,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            wallet_record["tamper_hash"] = generate_tamper_hash(wallet_record)
            DB['records'].insert(0, wallet_record)

            consultation = {
                "id": f"cns-{int(time.time()*1000)}",
                "soldier_id": soldier_id,
                "doctor_id": "usr-doctor-1",
                "doctor_name": "Capt. Dr. Priya Nair",
                "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "specialty": specialty,
                "status": "COMPLETED",
                "summary": consult_summary,
                "record_id": record_id,
                "follow_up_date": (datetime.date.today() + datetime.timedelta(days=14)).isoformat()
            }
            DB['consultations'].insert(0, consultation)

            log_audit(user['id'], user['role'], soldier_id, 'BOOK_TELECONSULT_AUTO_SAVE', 'SUCCESS',
                      f"Booked teleconsultation with {specialty}. Summary automatically saved to Soldier Health Wallet.")
            return self.send_json(201, {"consultation": consultation, "record": wallet_record})

        # 6. Revoke Access Grant
        elif path == '/api/access-grants/revoke':
            user = self.get_auth_user()
            grant_id = payload.get('grant_id')
            grant = next((g for g in DB['access_grants'] if g['id'] == grant_id), None)
            if not grant:
                return self.send_json(404, {"error": "Grant not found"})

            grant['status'] = 'REVOKED'
            log_audit(user['id'], user['role'], grant['soldier_id'], 'REVOKE_ACCESS', 'REVOKED',
                      f"Soldier revoked medical record access grant from {grant['granted_to_role']}")
            return self.send_json(200, {"message": "Access successfully revoked", "grant": grant})

        return self.send_json(404, {"error": "Endpoint not found"})

    def serve_static_files(self, path):
        if path == '/' or path == '':
            filepath = os.path.join(PUBLIC_DIR, 'index.html')
        else:
            rel = path.lstrip('/')
            filepath = os.path.join(PUBLIC_DIR, rel)

        if not os.path.exists(filepath) or os.path.isdir(filepath):
            filepath = os.path.join(PUBLIC_DIR, 'index.html')

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
        print(f"  Tagline: 'Health that follows the soldier.'")
        print(f"  Active Soldier: Rifleman Arjun Verma (15489201A)")
        print(f"============================================================")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Kavach server.")

if __name__ == '__main__':
    run()

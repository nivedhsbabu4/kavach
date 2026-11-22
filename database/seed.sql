-- ============================================================================
-- KAVACH DATABASE SEED DATA
-- Default accounts for Soldier, Doctor, Physio, Counselor, Claims, and CO
-- ============================================================================

-- Passwords default to 'kavach123' (SHA-256 hashed)
-- hash of 'kavach123': 0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a

INSERT INTO USERS (id, service_no, name, rank, role, password_hash, posting, unit, branch, phone, emergency_contact, blood_group, allergies)
VALUES
('usr-soldier-1', '15489201A', 'Rifleman Arjun Verma', 'Rifleman', 'SOLDIER', '0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a', 'Rajasthan (Desert Sector)', '14 Rajputana Rifles', 'Indian Army', '+91-9876543210', 'Sunita Verma (Wife) - +91-9876543211', 'O+', 'Penicillin'),
('usr-doctor-1', 'MR-09824X', 'Capt. Dr. Priya Nair', 'Captain', 'DOCTOR', '0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a', 'Base Hospital, Delhi Cantt', 'Army Medical Corps (AMC)', 'Indian Army', '+91-9876543212', 'AMC Regimental HQ', 'B+', 'None'),
('usr-physio-1', 'MR-11204K', 'Lt. Rajesh Kumar', 'Lieutenant', 'PHYSIOTHERAPIST', '0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a', 'Military Hospital, Jaipur', 'AMC - Rehabilitation Wing', 'Indian Army', '+91-9876543213', 'MH Jaipur Duty Officer', 'A+', 'None'),
('usr-counselor-1', 'CIV-PSY-042', 'Dr. Sunita Rao', 'Senior Counselor', 'COUNSELOR', '0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a', 'Command Hospital (Central), AFMS', 'Defence Psychological Support Cell', 'AFMS / Tri-Services', '+91-9876543214', 'AFMS Medical Directorate', 'AB+', 'None'),
('usr-claims-1', 'IC-48291M', 'Col. V.K. Singh (Retd)', 'Colonel', 'CLAIMS_OFFICER', '0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a', 'ECHS Central Org, AG Branch, New Delhi', 'Disability & Medical Board Cell', 'ECHS / MoD', '+91-9876543215', 'AG Branch Duty Cell', 'O-', 'None'),
('usr-co-1', 'IC-51920P', 'Col. R.S. Rathore', 'Colonel', 'COMMANDING_OFFICER', '0d80e8f237efb51e6027179043e0d867c265ffbf40d3fcf7d7b13ea3295c102a', '14 Rajputana Rifles HQ', 'Commanding Officer', 'Indian Army', '+91-9876543216', '14 Raj Rif Adjutant', 'B+', 'None')
ON CONFLICT (service_no) DO NOTHING;

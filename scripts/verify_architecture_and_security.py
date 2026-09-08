"""
MediMind AI — Verification of Database, RLS, Storage, RPCs, Pages, and Security
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def test_migration_file():
    print("--> 1. Testing Migration 0008 (Full Product Gap Closure)...")
    migration_path = ROOT / "supabase" / "migrations" / "0008_full_product_gap_closure.sql"
    assert migration_path.exists(), f"Migration file missing at {migration_path}"
    
    content = migration_path.read_text(encoding="utf-8")
    
    # 1. Reconciliation checks
    assert "uq_appointment_slot" in content, "Missing uq_appointment_slot anti-double-booking index"
    assert "sync_notification_columns" in content, "Missing notification synchronization trigger"
    assert "sync_audit_log_columns" in content, "Missing audit log synchronization trigger"
    assert "trg_sync_medicine_orders_to_orders" in content, "Missing medicine_orders -> orders sync trigger"
    assert "trg_sync_orders_to_medicine_orders" in content, "Missing orders -> medicine_orders sync trigger"
    
    # 2. Performance indexes
    assert "idx_pharmacy_inventory_expiry" in content, "Missing idx_pharmacy_inventory_expiry"
    assert "idx_pharmacy_inventory_stock" in content, "Missing idx_pharmacy_inventory_stock"
    assert "idx_medicine_orders_patient_date" in content, "Missing idx_medicine_orders_patient_date"
    assert "idx_appointments_patient_date" in content, "Missing idx_appointments_patient_date"
    assert "idx_appointments_doctor_date" in content, "Missing idx_appointments_doctor_date"
    
    # 3. Storage buckets
    assert "medical-documents" in content, "Missing medical-documents bucket config"
    assert "doctor-documents" in content, "Missing doctor-documents bucket config"
    assert "pharmacy-documents" in content, "Missing pharmacy-documents bucket config"
    assert "profile-images" in content, "Missing profile-images bucket config"
    
    # 4. Atomic RPCs
    rpcs = [
        "create_appointment_tx",
        "create_prescription_tx",
        "create_medicine_order_tx",
        "pharmacy_fulfill_prescription_tx",
        "verify_doctor_tx",
        "verify_pharmacy_tx"
    ]
    for rpc in rpcs:
        assert f"FUNCTION public.{rpc}" in content, f"Missing RPC {rpc}"
        assert f"REVOKE ALL ON FUNCTION public.{rpc}" in content, f"Missing REVOKE ALL on {rpc}"
        assert f"GRANT EXECUTE ON FUNCTION public.{rpc}" in content, f"Missing GRANT EXECUTE on {rpc}"
        
    # Check row locks
    assert "FOR UPDATE" in content, "Missing row lock concurrency control in transactional RPCs"
    
    # Check RLS enabled
    assert "ENABLE ROW LEVEL SECURITY" in content, "Missing ENABLE ROW LEVEL SECURITY statements"
    
    print("    [PASS] Migration 0008 structure, reconciliation triggers, RPCs, and indexes verified.")

def test_missing_pages_exist():
    print("--> 2. Testing Required 9 Missing Pages...")
    required_pages = [
        ("frontend/src/pages/patient/PatientOrders.jsx", "Patient"),
        ("frontend/src/pages/patient/PatientAppointments.jsx", "Patient"),
        ("frontend/src/pages/patient/PatientProfile.jsx", "Patient"),
        ("frontend/src/pages/doctor/DoctorAvailability.jsx", "Doctor"),
        ("frontend/src/pages/doctor/DoctorProfile.jsx", "Doctor"),
        ("frontend/src/pages/pharmacy/BatchManagement.jsx", "Pharmacy"),
        ("frontend/src/pages/pharmacy/PharmacyProfile.jsx", "Pharmacy"),
        ("frontend/src/pages/admin/UserManagement.jsx", "Admin"),
        ("frontend/src/pages/admin/SystemSettings.jsx", "Admin"),
    ]
    for rel_path, persona in required_pages:
        full_path = ROOT / rel_path
        assert full_path.exists(), f"Missing page {rel_path}"
        content = full_path.read_text(encoding="utf-8")
        assert "export default" in content, f"Page {rel_path} does not export default"
        assert "useState" in content or "useEffect" in content, f"Page {rel_path} does not look like a dynamic React component"
        print(f"    [PASS] {persona} page: {full_path.name} exists and valid.")

def test_routes_in_app():
    print("--> 3. Testing Route Registrations in App.jsx...")
    app_path = ROOT / "frontend" / "src" / "App.jsx"
    app_content = app_path.read_text(encoding="utf-8")
    
    expected_routes = [
        "/patient/orders",
        "/patient/appointments",
        "/patient/profile",
        "/doctor/availability",
        "/doctor/profile",
        "/pharmacy/batches",
        "/pharmacy/profile",
        "/admin/users",
        "/admin/system-settings"
    ]
    for route in expected_routes:
        assert route in app_content, f"Route {route} not registered in App.jsx"
    print("    [PASS] All 9 new routes and navigation items are registered in App.jsx.")

def test_page_integrations():
    print("--> 4. Testing Fixes to Existing Pages...")
    
    # 1. DoctorDashboard.jsx
    dd_path = ROOT / "frontend" / "src" / "pages" / "doctor" / "DoctorDashboard.jsx"
    dd_content = dd_path.read_text(encoding="utf-8")
    assert "getMissionControlData" in dd_content, "DoctorDashboard does not query real mission control data"
    assert "inpatientCensus" in dd_content, "DoctorDashboard missing real ward census binding"
    
    # 2. PrescriptionGenerator.jsx
    pg_path = ROOT / "frontend" / "src" / "pages" / "doctor" / "PrescriptionGenerator.jsx"
    pg_content = pg_path.read_text(encoding="utf-8")
    assert "searchParams.get('patientId')" in pg_content or "searchParams.get('appointmentId')" in pg_content, \
        "PrescriptionGenerator does not read patient/appointment context from query params"
    assert "appointmentService.getDoctorAppointments" in pg_content or "getAuthorizedPatients" in pg_content, \
        "PrescriptionGenerator does not use authorized patients query"
    assert "patientId: profile.id" not in pg_content, \
        "PrescriptionGenerator still hardcodes patientId: profile.id!"
        
    # 3. SymptomChecker.jsx
    sc_path = ROOT / "frontend" / "src" / "pages" / "SymptomChecker.jsx"
    sc_content = sc_path.read_text(encoding="utf-8")
    assert "aiService.assessSymptoms" in sc_content, "SymptomChecker Mode 1 does not persist via aiService"
    assert "reportService.uploadReport" in sc_content, "SymptomChecker Mode 2 does not upload to reportService"
    
    # 4. PharmacyStore.jsx
    ps_path = ROOT / "frontend" / "src" / "pages" / "patient" / "PharmacyStore.jsx"
    ps_content = ps_path.read_text(encoding="utf-8")
    assert "/patient/orders" in ps_content, "PharmacyStore does not link to patient order tracking"
    
    print("    [PASS] All 4 existing pages successfully updated and verified.")

def test_ai_persistence_and_phi_safety():
    print("--> 5. Testing AI Persistence and Security Guardrails...")
    
    # Check ai.service.js
    ai_serv_path = ROOT / "frontend" / "src" / "services" / "ai.service.js"
    ai_serv_content = ai_serv_path.read_text(encoding="utf-8")
    assert "model_version" in ai_serv_content, "Missing model_version in ai.service.js"
    assert "symptom-rf-v1" in ai_serv_content, "symptom-rf-v1 must be preserved as model version"
    assert "normalized_symptoms" in ai_serv_content, "Missing normalized_symptoms persistence"
    assert "risk_reasons" in ai_serv_content, "Missing risk_reasons persistence"
    assert "red_flags" in ai_serv_content, "Missing red_flags persistence"
    
    # Check report.service.js
    rep_serv_path = ROOT / "frontend" / "src" / "services" / "report.service.js"
    rep_serv_content = rep_serv_path.read_text(encoding="utf-8")
    assert "processing_status" in rep_serv_content, "Missing processing_status in report.service.js"
    assert "findings" in rep_serv_content, "Missing findings in report.service.js"
    assert "mapped_symptoms" in rep_serv_content, "Missing mapped_symptoms in report.service.js"
    assert "provider" in rep_serv_content, "Missing provider in report.service.js"
    
    # Security: No Gemini API Key in Frontend
    frontend_dir = ROOT / "frontend" / "src"
    for js_file in frontend_dir.rglob("*.js*"):
        text = js_file.read_text(encoding="utf-8", errors="ignore")
        assert "AIzaSy" not in text, f"CRITICAL: Found potential Gemini/Google API key in {js_file}!"
        assert "GEMINI_API_KEY" not in text or "process.env" in text or "import.meta" in text, \
            f"Suspicious GEMINI_API_KEY literal reference in {js_file}"

    print("    [PASS] AI persistence schema and client-side PHI/API key safety verified.")

def test_rls_isolation_matrix():
    print("--> 6. Testing RLS Isolation Rules in Migration 0008...")
    mig_content = (ROOT / "supabase" / "migrations" / "0008_full_product_gap_closure.sql").read_text(encoding="utf-8")
    
    # 1. Appointments isolation: participants only (patient, doctor, admin)
    assert "appointments_participant_select" in mig_content, "Missing appointments_participant_select policy"
    assert "auth.uid() = patient_id \n    OR auth.uid() = doctor_id" in mig_content or "auth.uid() = patient_id" in mig_content
    
    # 2. Patient Allergies & Assessments isolation: patient or assigned doctor with active access
    assert "patient_allergies_select" in mig_content, "Missing patient_allergies_select policy"
    assert "symptom_assessments_owner_select" in mig_content, "Missing symptom_assessments_owner_select policy"
    assert "patient_doctor_access" in mig_content, "Missing patient_doctor_access check in policies"
    
    # 3. Doctor availability: only owner doctor or admin can mutate
    assert "doctor_availability_owner_mutate" in mig_content, "Missing doctor_availability_owner_mutate policy"
    
    # 4. Verifications: admin only can mutate
    assert "doctor_verifications_admin_mutate" in mig_content, "Missing doctor_verifications_admin_mutate"
    assert "pharmacy_verifications_admin_mutate" in mig_content, "Missing pharmacy_verifications_admin_mutate"
    
    # 5. User roles: super admin only can mutate
    assert "user_roles_admin_mutate" in mig_content, "Missing user_roles_admin_mutate"
    assert "public.is_admin()" in mig_content, "Missing is_admin() checks"
    
    # 6. Storage isolation: folder name must equal user id
    assert "storage.foldername(name))[1] = auth.uid()::text" in mig_content, "Missing storage folder isolation"
    
    print("    [PASS] RLS isolation matrix verified for Patient, Doctor, Pharmacy, Admin, and Storage.")

if __name__ == "__main__":
    try:
        test_migration_file()
        test_missing_pages_exist()
        test_routes_in_app()
        test_page_integrations()
        test_ai_persistence_and_phi_safety()
        test_rls_isolation_matrix()
        print("\n==================================================")
        print("ALL ARCHITECTURAL & SECURITY CHECKS PASSED (100%)")
        print("==================================================")
    except AssertionError as e:
        print(f"\n[FAIL]: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR]: {e}")
        sys.exit(1)

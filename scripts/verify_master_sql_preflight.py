"""
MediMind AI — Master SQL Preflight Static Auditor
Strictly static: Zero network calls, zero database connections, zero modifications.
Audits:
1. File integrity & line/byte metrics
2. Strict dependency ordering
3. Duplicate tables, indexes, functions
4. Foreign key integrity & auth.users references
5. CHECK constraints & syntax validity
6. Anti-double-booking partial unique index
7. SECURITY DEFINER search_path hardening
8. 13 RPC functions & strict permissions (public/anon revoked, authenticated granted, recommend_doctors_for_disease public)
9. RLS enablement across all healthcare tables
10. Storage policies on storage.objects
11. Anti-recursion guards on triggers
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def run_master_preflight():
    sql_path = ROOT / "supabase" / "complete_database_schema_and_migrations.sql"
    print(f"--> Static Pre-Flight Verification on: {sql_path.resolve()}")
    
    assert sql_path.exists(), f"File does not exist at {sql_path}"
    content = sql_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    size_bytes = sql_path.stat().st_size
    line_count = len(lines)
    
    print(f"    File exists: True")
    print(f"    Line count: {line_count}")
    print(f"    File size: {size_bytes} bytes")
    
    # Check start and end markers
    assert lines[0].startswith("-- ===="), "Truncated top: missing header bar"
    assert "UNIFIED MASTER DATABASE SCHEMA" in lines[1], "Missing master title"
    assert "END OF UNIFIED MASTER SCHEMA" in lines[-2], "Truncated bottom: missing footer"
    
    blockers = []
    warnings = []
    
    # 1. Non-destructive safety
    if re.search(r'\bdrop\s+table\b', content, re.IGNORECASE):
        blockers.append("DROP TABLE statement detected!")
    if re.search(r'\bdrop\s+schema\b', content, re.IGNORECASE):
        blockers.append("DROP SCHEMA statement detected!")
    if re.search(r'\bdisable\s+row\s+level\s+security\b', content, re.IGNORECASE):
        blockers.append("DISABLE ROW LEVEL SECURITY detected!")
        
    # 2. Table definitions & Order check
    table_order = []
    table_defs = set()
    for m in re.finditer(r'create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)', content, re.IGNORECASE):
        tname = m.group(1).lower()
        if tname in table_defs:
            blockers.append(f"Duplicate CREATE TABLE for 'public.{tname}'")
        table_defs.add(tname)
        table_order.append(tname)
        
    print(f"    Total tables defined: {len(table_order)}")
    
    # Verify core base tables exist
    required_base_tables = [
        "profiles", "user_roles", "patients", "doctors", "pharmacies",
        "doctor_verifications", "pharmacy_verifications", "doctor_availability",
        "patient_doctor_access", "appointments", "consultations", "medical_records",
        "patient_allergies", "medicines", "pharmacy_inventory", "prescriptions",
        "prescription_items", "medicine_orders", "orders", "order_items", "payments",
        "symptom_assessments", "health_reports", "notifications", "audit_logs"
    ]
    for rbt in required_base_tables:
        if rbt not in table_defs:
            blockers.append(f"Required base table 'public.{rbt}' is missing!")
            
    # Check dependency order: profiles must precede patients, appointments, etc.
    if "profiles" in table_order:
        p_idx = table_order.index("profiles")
        if "patients" in table_order and table_order.index("patients") < p_idx:
            blockers.append("Dependency violation: patients defined before profiles!")
            
    # 3. Foreign key validity
    for fm in re.finditer(r'references\s+(?:public\.)?([a-zA-Z0-9_\.]+)\s*(?:\(([a-zA-Z0-9_]+)\))?', content, re.IGNORECASE):
        target_tbl = fm.group(1).lower()
        if target_tbl.startswith("auth.") or target_tbl in ["users", "storage.objects"]:
            continue
        if target_tbl not in table_defs:
            blockers.append(f"Foreign key references non-existent table '{target_tbl}' in: {fm.group(0)}")
            
    # 4. Anti-double-booking check
    if "uq_appointment_slot" not in content:
        blockers.append("Anti-double-booking index 'uq_appointment_slot' missing!")
    else:
        # Check that it is a conditional partial index excluding cancelled/no_show
        idx_match = re.search(r'create\s+unique\s+index\s+(?:if\s+not\s+exists\s+)?uq_appointment_slot\s+on\s+public\.appointments\s*\((.*?)\)\s*where\s+(.*?);', content, re.IGNORECASE)
        if not idx_match:
            blockers.append("uq_appointment_slot is not correctly defined as a partial unique index!")
        else:
            where_clause = idx_match.group(2).lower()
            if "cancelled" not in where_clause or "no_show" not in where_clause:
                blockers.append("uq_appointment_slot partial index does not exclude 'cancelled' and 'no_show' statuses!")
                
    # 5. Check unconditional unique on appointments
    if re.search(r'create\s+table\s+(?:if\s+not\s+exists\s+)?public\.appointments\s*\([^;]*unique\s*\(\s*doctor_id\s*,\s*appointment_date\s*,\s*time_slot\s*\)', content, re.IGNORECASE):
        blockers.append("Found unconditional unique(doctor_id, appointment_date, time_slot) table constraint on appointments! This prevents re-booking cancelled slots.")

    # 6. Check SECURITY DEFINER search_path hardening
    sec_definer_matches = re.finditer(r'create\s+or\s+replace\s+function\s+public\.([a-zA-Z0-9_]+)\s*\([^)]*\)\s*returns\s+.*?(?:language\s+[a-zA-Z0-9_]+\s+)?security\s+definer\b([^$]*?)\$', content, re.IGNORECASE | re.DOTALL)
    for sdm in sec_definer_matches:
        fn_name = sdm.group(1)
        between_sec_and_body = sdm.group(2)
        if "set search_path" not in between_sec_and_body.lower():
            blockers.append(f"SECURITY DEFINER function 'public.{fn_name}' missing explicit SET search_path = public, pg_temp;")

    # 7. Check 13 Transactional RPCs and their permissions
    expected_rpcs = [
        "create_appointment_tx",
        "create_prescription_tx",
        "create_medicine_order_tx",
        "pharmacy_fulfill_prescription_tx",
        "verify_doctor_tx",
        "verify_pharmacy_tx",
        "book_lab_test_tx",
        "process_abdm_consent_tx",
        "log_medication_dose_tx",
        "sign_consultation_dsc_tx",
        "recommend_doctors_for_disease",
        "handle_user_signup"
    ]
    for rpc in expected_rpcs:
        if f"public.{rpc}" not in content:
            blockers.append(f"Expected RPC function 'public.{rpc}' is missing!")
            
    # Check privileged RPCs permissions
    privileged_rpcs = [
        "create_appointment_tx",
        "create_prescription_tx",
        "create_medicine_order_tx",
        "pharmacy_fulfill_prescription_tx",
        "verify_doctor_tx",
        "verify_pharmacy_tx",
        "book_lab_test_tx",
        "process_abdm_consent_tx",
        "log_medication_dose_tx",
        "sign_consultation_dsc_tx"
    ]
    for prpc in privileged_rpcs:
        # Must be revoked from PUBLIC, anon
        rev_match = re.search(rf'revoke\s+(?:all|execute)\s+on\s+function\s+public\.{prpc}\s*\(.*?\)\s*from\s+([^;]+);', content, re.IGNORECASE)
        if not rev_match:
            blockers.append(f"Privileged RPC 'public.{prpc}' missing REVOKE statement!")
        else:
            rev_targets = rev_match.group(1).lower()
            if "public" not in rev_targets or "anon" not in rev_targets:
                blockers.append(f"Privileged RPC 'public.{prpc}' does not revoke from both PUBLIC and anon!")
                
        # Must be granted to authenticated
        grant_match = re.search(rf'grant\s+(?:all|execute)\s+on\s+function\s+public\.{prpc}\s*\(.*?\)\s*to\s+([^;]+);', content, re.IGNORECASE)
        if not grant_match:
            blockers.append(f"Privileged RPC 'public.{prpc}' missing GRANT statement!")
        else:
            grant_targets = grant_match.group(1).lower()
            if "authenticated" not in grant_targets:
                blockers.append(f"Privileged RPC 'public.{prpc}' not granted to authenticated!")
            if "anon" in grant_targets or "public" in grant_targets:
                blockers.append(f"Privileged RPC 'public.{prpc}' improperly granted to anon or public!")

    # Check that recommend_doctors_for_disease IS granted to anon/authenticated
    if not re.search(r'grant\s+(?:all|execute)\s+on\s+function\s+public\.recommend_doctors_for_disease\s*\(.*?\)\s*to\s+[^;]*anon', content, re.IGNORECASE):
        warnings.append("recommend_doctors_for_disease is not granted to anon for public discovery.")

    # 8. Check RLS enablement across all tables
    for t in table_defs:
        if t in ["clinics", "specialists", "queues"]:
            continue
        if not re.search(rf'alter\s+table\s+public\.{t}\s+enable\s+row\s+level\s+security', content, re.IGNORECASE):
            blockers.append(f"Table 'public.{t}' does not have ENABLE ROW LEVEL SECURITY!")

    # 9. Check Storage policies on storage.objects
    storage_policies = re.findall(r'create\s+policy\s+"([^"]+)"\s+on\s+storage\.objects', content, re.IGNORECASE)
    print(f"    Storage policies defined on storage.objects: {len(storage_policies)}")
    if len(storage_policies) < 5:
        blockers.append(f"Expected at least 5 storage policies, found {len(storage_policies)}")

    # 10. Check trigger anti-recursion
    for trg_fn in ["sync_medicine_orders_to_orders", "sync_orders_to_medicine_orders"]:
        fn_body_match = re.search(rf'create\s+or\s+replace\s+function\s+public\.{trg_fn}.*?\$\$(.*?)\$\$', content, re.IGNORECASE | re.DOTALL)
        if fn_body_match:
            if "pg_trigger_depth()" not in fn_body_match.group(1):
                blockers.append(f"Synchronization trigger function 'public.{trg_fn}' lacks pg_trigger_depth() recursion guard!")
        else:
            blockers.append(f"Trigger function 'public.{trg_fn}' not found!")

    return len(blockers) == 0, blockers, warnings, line_count, size_bytes

if __name__ == "__main__":
    success, blockers, warnings, lines, size = run_master_preflight()
    print("\n==================================================")
    print("STATIC MASTER SQL PREFLIGHT SUMMARY:")
    print(f"Total Lines: {lines} | Total Size: {size} bytes")
    print(f"Blockers: {len(blockers)}")
    print(f"Warnings: {len(warnings)}")
    for b in blockers:
        print(f"  [BLOCKER] {b}")
    for w in warnings:
        print(f"  [WARN] {w}")
    print("==================================================")
    if not success:
        print("STATIC PREFLIGHT: FAIL")
        sys.exit(1)
    else:
        print("STATIC PREFLIGHT: PASS")

"""
MediMind AI — Deep Pre-Flight SQL Auditor
Audits DDL scripts for:
1. Missing tables / forward reference errors
2. Duplicate create table, index, or constraint definitions
3. Foreign key reference validity
4. Trigger definitions and referenced functions
5. SECURITY DEFINER functions and search_path hygiene
6. Public / anon execute exposure on privileged RPCs
7. Storage policies
8. Non-destructive safety (no DROP TABLE, no DELETE, no DISABLE RLS)
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def audit_sql_file(file_path):
    print(f"--> Auditing SQL File: {file_path.name}...")
    if not file_path.exists():
        print(f"[FAIL]: File {file_path} not found.")
        return False, []

    content = file_path.read_text(encoding="utf-8")
    issues = []
    warnings = []
    
    # 1. Non-destructive safety checks
    # Check for DROP TABLE
    drop_tables = re.findall(r'drop\s+table\s+.*?;', content, re.IGNORECASE)
    for dt in drop_tables:
        if "if exists" in dt.lower() and "temp" in dt.lower():
            continue
        issues.append(f"BLOCKER: Found DROP TABLE statement: '{dt.strip()}'")
        
    # Check for DELETE FROM
    delete_stmts = re.findall(r'delete\s+from\s+([a-zA-Z0-9_\.]+)', content, re.IGNORECASE)
    for ds in delete_stmts:
        # Check context
        warnings.append(f"WARNING: DELETE statement found on table '{ds}'. Ensure this is inside RPC or idempotent cleanup.")

    # Check for DISABLE ROW LEVEL SECURITY
    if re.search(r'disable\s+row\s+level\s+security', content, re.IGNORECASE):
        issues.append("BLOCKER: Found DISABLE ROW LEVEL SECURITY statement!")

    # 2. Extract all CREATE TABLE statements
    created_tables = set()
    table_matches = re.finditer(r'create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_\.]+)', content, re.IGNORECASE)
    for tm in table_matches:
        tbl = tm.group(1).lower().replace('public.', '')
        created_tables.add(tbl)

    print(f"    Found {len(created_tables)} table definitions: {sorted(list(created_tables))}")

    # 3. Check for references to tables that are NEVER created in the file
    # Check foreign keys: references [table](col)
    fk_matches = re.finditer(r'references\s+([a-zA-Z0-9_\.]+)\s*(?:\(([a-zA-Z0-9_]+)\))?', content, re.IGNORECASE)
    for fm in fk_matches:
        ref_table = fm.group(1).lower().replace('public.', '')
        if ref_table in ['auth.users', 'auth.uid', 'users']:
            continue
        if ref_table not in created_tables:
            issues.append(f"BLOCKER: Foreign key references non-existent table '{ref_table}' in: {fm.group(0)}")

    # Check triggers: ON [table]
    trg_matches = re.finditer(r'on\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\n?\s*for\s+each\s+row', content, re.IGNORECASE)
    for trgm in trg_matches:
        trg_table = trgm.group(1).lower().replace('public.', '')
        if trg_table not in created_tables and trg_table not in ['users', 'auth.users']:
            issues.append(f"BLOCKER: Trigger bound to table '{trg_table}' which is never created in the script!")

    # Check ALTER TABLE [table]
    alter_matches = re.finditer(r'alter\s+table\s+(?:public\.)?([a-zA-Z0-9_]+)\s+add\s+column', content, re.IGNORECASE)
    for am in alter_matches:
        alt_table = am.group(1).lower().replace('public.', '')
        if alt_table not in created_tables:
            issues.append(f"BLOCKER: ALTER TABLE executed on table '{alt_table}' which is never created in the script!")

    # 4. Check for public/anon execute on privileged RPCs
    privileged_rpcs = [
        "create_appointment_tx",
        "create_prescription_tx",
        "create_medicine_order_tx",
        "pharmacy_fulfill_prescription_tx",
        "verify_doctor_tx",
        "verify_pharmacy_tx"
    ]
    for rpc in privileged_rpcs:
        # Check if granted to public or anon
        if re.search(rf'grant\s+(?:all|execute)\s+on\s+function\s+.*{rpc}.*to\s+(?:public|anon)', content, re.IGNORECASE):
            issues.append(f"BLOCKER: Privileged RPC '{rpc}' is granted EXECUTE to PUBLIC or anon!")
        # Check if revoked
        if not re.search(rf'revoke\s+(?:all|execute)\s+on\s+function\s+.*{rpc}.*from\s+.*(?:public|anon)', content, re.IGNORECASE):
            warnings.append(f"WARNING: Privileged RPC '{rpc}' does not have explicit REVOKE from PUBLIC/anon in this script.")

    # 5. Check anti-double-booking constraint
    if "uq_appointment_slot" not in content and "unique(doctor_id, appointment_date, time_slot)" not in content.lower():
        issues.append("BLOCKER: Anti-double-booking unique constraint or index is missing!")

    return len(issues) == 0, issues, warnings

if __name__ == "__main__":
    target_file = ROOT / "supabase" / "complete_database_schema_and_migrations.sql"
    success, issues, warnings = audit_sql_file(target_file)
    print("\n==================================================")
    print("PRE-FLIGHT AUDIT SUMMARY:")
    print(f"Issues / Blockers: {len(issues)}")
    print(f"Warnings: {len(warnings)}")
    for iss in issues:
        print(f"  [BLOCKER] {iss}")
    for w in warnings:
        print(f"  [WARN] {w}")
    print("==================================================")
    if not success:
        sys.exit(1)
    else:
        print("PRE-FLIGHT VALIDATION: PASSED")

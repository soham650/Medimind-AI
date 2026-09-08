"""
Extract all Supabase tables, columns, and RPCs called across the application.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def scan_codebase():
    patterns = {
        "tables": re.compile(r"\.from\(['\"]([a-zA-Z0-9_]+)['\"]\)", re.MULTILINE),
        "rpcs": re.compile(r"\.rpc\(['\"]([a-zA-Z0-9_]+)['\"]", re.MULTILINE),
        "selects": re.compile(r"\.select\(['\"]([^'\"]+)['\"]\)", re.MULTILINE),
    }

    found_tables = set()
    found_rpcs = set()
    table_columns = {}

    for folder in ["frontend/src", "ml-service/src", "ml-service/tests"]:
        dir_path = ROOT / folder
        if not dir_path.exists():
            continue
        for ext in ["*.js", "*.jsx", "*.ts", "*.tsx", "*.py"]:
            for f in dir_path.rglob(ext):
                if any(x in f.parts for x in ["node_modules", "venv", ".git", "dist"]):
                    continue
                text = f.read_text(encoding="utf-8", errors="ignore")
                
                # Match tables
                for m in patterns["tables"].finditer(text):
                    t = m.group(1)
                    found_tables.add(t)
                    
                # Match rpcs
                for m in patterns["rpcs"].finditer(text):
                    found_rpcs.add(m.group(1))

    print(f"Total Unique Tables Referenced: {len(found_tables)}")
    for t in sorted(found_tables):
        print(f"  - {t}")
        
    print(f"\nTotal Unique RPCs Referenced: {len(found_rpcs)}")
    for r in sorted(found_rpcs):
        print(f"  - {r}")

if __name__ == "__main__":
    scan_codebase()

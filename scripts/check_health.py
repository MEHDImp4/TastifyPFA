import os
import sys
import subprocess
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def print_result(name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {name.ljust(30)} {message}")
    return success

def check_env_sync():
    env_file = os.path.join(ROOT_DIR, ".env")
    example_file = os.path.join(ROOT_DIR, ".env.example")
    
    if not os.path.exists(env_file) or not os.path.exists(example_file):
        return print_result("Env Sync", True, "(.env or .env.example missing, skipping check)")
        
    with open(env_file, 'r') as f:
        env_keys = set(re.findall(r'^([A-Z0-9_]+)=', f.read(), re.MULTILINE))
    with open(example_file, 'r') as f:
        example_keys = set(re.findall(r'^([A-Z0-9_]+)=', f.read(), re.MULTILINE))
        
    missing = env_keys - example_keys
    if missing:
        return print_result("Env Sync", False, f"Missing in .env.example: {', '.join(missing)}")
    return print_result("Env Sync", True)

def check_migrations():
    try:
        # Check if docker is running
        check_docker = subprocess.run('docker ps --filter name=tastifypfa-backend-1 --format "{{.Names}}"', shell=True, capture_output=True, text=True)
        if "tastifypfa-backend-1" not in check_docker.stdout:
            return print_result("Migrations", False, "Backend container offline")
            
        cmd = 'docker exec tastifypfa-backend-1 python manage.py makemigrations --check --dry-run'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            return print_result("Migrations", False, "Missing or invalid migrations detected")
        return print_result("Migrations", True)
    except Exception as e:
        return print_result("Migrations", False, f"Error: {e}")

def check_line_endings():
    sh_files = []
    for root, _, files in os.walk(ROOT_DIR):
        if ".git" in root or "node_modules" in root: continue
        for file in files:
            if file.endswith(".sh"):
                sh_files.append(os.path.join(root, file))
                
    bad_files = []
    for sh_file in sh_files:
        with open(sh_file, 'rb') as f:
            content = f.read()
            if b'\r\n' in content:
                bad_files.append(os.path.relpath(sh_file, ROOT_DIR))
                
    if bad_files:
        return print_result("Line Endings (SH)", False, f"CRLF detected in: {', '.join(bad_files)}")
    return print_result("Line Endings (SH)", True)

def check_dashboard():
    dashboard_file = os.path.join(ROOT_DIR, "dashboard.html")
    if not os.path.exists(dashboard_file):
        return print_result("Dashboard", False, "dashboard.html missing")
        
    mtime = os.path.getmtime(dashboard_file)
    # If older than 1 hour, warn (this is subjective but helps)
    from datetime import datetime, timedelta
    if datetime.fromtimestamp(mtime) < datetime.now() - timedelta(hours=1):
        return print_result("Dashboard", False, "dashboard.html is older than 1 hour")
    return print_result("Dashboard", True)

def run_all():
    print("--- TastifyPFA Health Check ---")
    results = [
        check_env_sync(),
        check_migrations(),
        check_line_endings(),
        check_dashboard()
    ]
    print("-------------------------------")
    
    if all(results):
        print("🚀 All systems integrated! You are ready to work.")
    else:
        print("⚠️  Integrity issues found. Please fix them before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    run_all()

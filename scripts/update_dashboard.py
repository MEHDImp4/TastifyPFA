import os
import re
import subprocess
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DASHBOARD_FILE = os.path.join(ROOT_DIR, "dashboard.html")
ROADMAP_FILE = os.path.join(ROOT_DIR, ".planning", "ROADMAP.md")
CHANGELOG_FILE = os.path.join(ROOT_DIR, "docs", "brain", "02_Journal", "CHANGELOG.md")
AUDIT_REPORT_FILE = os.path.join(ROOT_DIR, ".planning", "audit_uat_report.md")

def read_roadmap():
    phases = []
    if not os.path.exists(ROADMAP_FILE):
        return phases
        
    with open(ROADMAP_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extraction de la liste des phases via regex
    phase_pattern = re.compile(r'- \[(x| |/)\] \*\*Phase (\d+(?:\.\d+)?): ([^*]+)\*\*(?: (\[[A-Z]+\]))? - (.*)')
    for match in phase_pattern.finditer(content):
        status_char = match.group(1)
        phase_num = match.group(2)
        title = match.group(3).strip()
        tag = match.group(4)
        desc = match.group(5).strip()
        
        status = "todo"
        if status_char == "x":
            status = "done"
        elif status_char == "/":
            status = "in_progress"
        elif tag == "[PLAN]":
            status = "planned"
        elif tag == "[CONTEXT]":
            status = "discussed"
            
        phases.append({
            "num": phase_num,
            "title": title,
            "desc": desc,
            "status": status
        })
    return phases

def read_changelog():
    activities = []
    if not os.path.exists(CHANGELOG_FILE):
        return activities
        
    with open(CHANGELOG_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extraction des blocs de date
    blocks = re.split(r'## \[(\d{4}-\d{2}-\d{2})\] - (\d{2}:\d{2})', content)
    # blocks[0] est le header, puis triplés (date, time, content)
    
    for i in range(1, len(blocks), 3):
        date = blocks[i]
        time = blocks[i+1]
        raw_content = blocks[i+2].strip()
        
        # Extraction des entrées dans le bloc
        lines = raw_content.split('\n')
        current_type = ""
        for line in lines:
            line = line.strip()
            if line.startswith('### '):
                current_type = line.replace('### ', '')
            elif line.startswith('- '):
                desc = line.replace('- ', '')
                # On détermine une couleur basée sur le type
                color = "green"
                if "Fixed" in current_type: color = "red"
                elif "Changed" in current_type: color = "teal"
                elif "Removed" in current_type: color = "orange"
                elif "Added" in current_type: color = "blue"
                
                activities.append({
                    "date": date,
                    "time": time,
                    "type": current_type,
                    "desc": desc,
                    "color": color
                })
                if len(activities) >= 15: break
        if len(activities) >= 15: break
            
    return activities

def get_backend_stats():
    stats = {
        "users": 0, 
        "categories": 0, 
        "orders": 0, 
        "total_sales": 0,
        "active_tables": 0,
        "status": "Offline"
    }
    try:
        # Check if docker is running first
        check_docker = subprocess.run('docker ps --filter name=tastifypfa-backend-1 --format "{{.Names}}"', shell=True, capture_output=True, text=True)
        if "tastifypfa-backend-1" not in check_docker.stdout:
            stats["status"] = "Container Offline"
            return stats

        # On tente de récupérer les stats via docker exec
        py_cmd = (
            "from apps.menu.models import Categorie; "
            "from apps.users.models import Utilisateur; "
            "from apps.commandes.models import Commande; "
            "from apps.tables.models import Table; "
            "from django.db.models import Sum; "
            "total_sales = Commande.objects.filter(statut='PAYEE').aggregate(Sum('montant_total'))['montant_total__sum'] or 0; "
            "print(f'STATS|{Utilisateur.objects.count()}|{Categorie.objects.count()}|{Commande.objects.count()}|{total_sales}|{Table.objects.filter(statut=Table.Statut.OCCUPEE).count()}')"
        )
        cmd = f'docker exec tastifypfa-backend-1 python manage.py shell -c "{py_cmd}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line.startswith('STATS|'):
                    parts = line.split('|')
                    if len(parts) == 6:
                        _, users, cats, orders, sales, active_tables = parts
                        stats["users"] = int(users)
                        stats["categories"] = int(cats)
                        stats["orders"] = int(orders)
                        stats["total_sales"] = float(sales)
                        stats["active_tables"] = int(active_tables)
                        stats["status"] = "Online"
                        break
        else:
            stats["status"] = "Error"
            print(f"Backend Stats Error: {result.stderr}")
    except Exception as e:
        print(f"Warning: Could not fetch backend stats: {e}")
        stats["status"] = "Timeout/Exception"
    return stats

def get_uat_status():
    uat_list = []
    uat_map = {}
    phases_dir = os.path.join(ROOT_DIR, ".planning", "phases")
    if os.path.exists(phases_dir):
        for p in sorted(os.listdir(phases_dir)):
            p_path = os.path.join(phases_dir, p)
            if os.path.isdir(p_path):
                m = re.match(r'^0*(\d+)-', p)
                if not m: continue
                phase_num = m.group(1)
                
                for f in os.listdir(p_path):
                    if "UAT" in f and f.endswith(".md"):
                        with open(os.path.join(p_path, f), 'r', encoding='utf-8') as uat_f:
                            content = uat_f.read()
                            sm = re.search(r'## Status:\s*([A-Z_]+)', content)
                            if sm:
                                status = sm.group(1)
                                uat_map[phase_num] = status
                                uat_list.append({
                                    "phase": phase_num,
                                    "file": f,
                                    "status": status,
                                    "name": p.split('-', 1)[1].replace('-', ' ').title()
                                })
                        break
    return uat_map, uat_list

def read_human_test_plan():
    tests = []
    if not os.path.exists(AUDIT_REPORT_FILE):
        return tests
        
    with open(AUDIT_REPORT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extraction des lignes de tableau
    # Format: | H-04-01 | 04/06 | **Image Upload & Cleanup** | ... | **PASSED** | ... |
    test_pattern = re.compile(r'\| (H-\d+-\d+) \| ([^|]+) \| \*\*([^*]+)\*\* \| ([^|]+) \| ([^|]+) \|')
    for match in test_pattern.finditer(content):
        test_id = match.group(1).strip()
        phase = match.group(2).strip()
        title = match.group(3).strip()
        expected = match.group(4).strip()
        status = match.group(5).strip().replace("**", "")
        
        # Déterminer la priorité basée sur les headers précédents
        priority = "Medium"
        p1_pos = content.rfind("Priority 1", 0, match.start())
        p2_pos = content.rfind("Priority 2", 0, match.start())
        p3_pos = content.rfind("Priority 3", 0, match.start())
        
        max_pos = max(p1_pos, p2_pos, p3_pos)
        if max_pos != -1:
            if max_pos == p1_pos: priority = "High"
            elif max_pos == p2_pos: priority = "Medium"
            elif max_pos == p3_pos: priority = "Low"

        tests.append({
            "id": test_id,
            "phase": phase,
            "title": title,
            "expected": expected,
            "priority": priority,
            "status": status
        })
    return tests

def get_git_status():
    status = {"branch": "unknown", "dirty": False}
    try:
        branch = subprocess.run('git rev-parse --abbrev-ref HEAD', shell=True, capture_output=True, text=True).stdout.strip()
        status["branch"] = branch
        
        dirty = subprocess.run('git status --porcelain', shell=True, capture_output=True, text=True).stdout.strip()
        status["dirty"] = len(dirty) > 0
    except:
        pass
    return status

def update_dashboard():
    phases = read_roadmap()
    activities = read_changelog()
    backend_stats = get_backend_stats()
    git_status = get_git_status()
    uat_map, uat_list = get_uat_status()
    human_tests = read_human_test_plan()
    
    total_phases = len(phases)
    completed_phases = sum(1 for p in phases if p["status"] == "done")
    in_progress_phases = sum(1 for p in phases if p["status"] == "in_progress")
    todo_phases = total_phases - completed_phases - in_progress_phases
    
    # Calcul précis de l'avancement via les fichiers de planification dans .planning/phases/
    tasks_done = 0
    tasks_total = 0
    phases_dir = os.path.join(ROOT_DIR, ".planning", "phases")
    if os.path.exists(phases_dir):
        for p in os.listdir(phases_dir):
            p_path = os.path.join(phases_dir, p)
            if os.path.isdir(p_path):
                for f in os.listdir(p_path):
                    if f.endswith("-PLAN.md"):
                        tasks_total += 1
                    if f.endswith("-SUMMARY.md"):
                        tasks_done += 1
                        
    if tasks_total == 0:
        tasks_total = total_phases
        tasks_done = completed_phases
        
    progress_percent = int((completed_phases / total_phases) * 100) if total_phases > 0 else 0
    
    # Génération du HTML pour l'aperçu du Roadmap
    phases_html = []
    detailed_html = []
    for p in phases:
        status_styles = {
            "done": ("bg-green-500", "", "text-white", "text-gray-400", "Terminé", "bg-green-500/20 text-green-400 border-green-500/20"),
            "in_progress": ("bg-blue-500 animate-pulse", "", "text-white", "text-gray-400", "En cours", "bg-blue-500/20 text-blue-400 border-blue-500/20"),
            "planned": ("bg-yellow-500", "", "text-white", "text-gray-400", "Planifié", "bg-yellow-500/20 text-yellow-400 border-yellow-500/20"),
            "discussed": ("bg-blue-500", "", "text-white", "text-gray-400", "Contexte Capturé", "bg-blue-500/20 text-blue-400 border-blue-500/20"),
            "todo": ("bg-gray-500", "opacity-50", "text-gray-300", "text-gray-500", "Non planifiée", "bg-gray-500/20 text-gray-400 border-gray-500/20")
        }
        dot, opacity, text, desc_c, badge_text, badge_style = status_styles.get(p["status"], status_styles["todo"])
            
        phases_html.append(f'''                        <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 {opacity}">
                            <div class="mt-1"><span class="w-2 h-2 rounded-full {dot} block"></span></div>
                            <div>
                                <h4 class="font-semibold {text}">Phase {p["num"]}: {p["title"]}</h4>
                                <p class="text-sm {desc_c} mt-1">{p["desc"]}</p>
                            </div>
                        </div>''')
                        
        phase_num_str = p["num"].lstrip("0")
        uat_badge = ""
        if phase_num_str in uat_map:
            u_stat = uat_map[phase_num_str]
            if u_stat == "PASSED": u_class = "bg-green-500/20 text-green-400 border-green-500/20"
            elif u_stat == "IN_PROGRESS": u_class = "bg-yellow-500/20 text-yellow-400 border-yellow-500/20"
            elif u_stat == "FAILED": u_class = "bg-red-500/20 text-red-400 border-red-500/20"
            else: u_class = "bg-gray-500/20 text-gray-400 border-gray-500/20"
            uat_badge = f'<span class="px-2 py-1 rounded text-xs font-medium {u_class} whitespace-nowrap ml-2">UAT: {u_stat}</span>'
            
        detailed_html.append(f'''                        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div><h4 class="font-semibold text-white">Phase {p["num"]}: {p["title"]}</h4><p class="text-xs text-gray-400 mt-1">{p["desc"]}</p></div>
                            <div class="flex items-center">
                                <span class="px-2 py-1 rounded text-xs font-medium {badge_style} whitespace-nowrap">{badge_text}</span>
                                {uat_badge}
                            </div>
                        </div>''')

    # Génération du HTML pour la liste des UATs
    uat_html = []
    for u in uat_list:
        u_stat = u["status"]
        if u_stat == "PASSED": u_class, dot_class = "bg-green-500/10 text-green-400 border-green-500/20", "bg-green-500"
        elif u_stat == "IN_PROGRESS": u_class, dot_class = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", "bg-yellow-500 animate-pulse"
        elif u_stat == "FAILED": u_class, dot_class = "bg-red-500/10 text-red-400 border-red-500/20", "bg-red-500"
        else: u_class, dot_class = "bg-gray-500/10 text-gray-400 border-gray-500/20", "bg-gray-500"
        
        uat_html.append(f'''                        <div class="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                            <div class="flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full {dot_class} block"></span>
                                <span class="text-sm font-medium text-white">Ph {u["phase"]}</span>
                                <span class="text-xs text-gray-400 truncate max-w-[120px]">{u["name"]}</span>
                            </div>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase {u_class}">{u_stat}</span>
                        </div>''')

    # Génération du HTML pour le Human Test Plan
    human_html = []
    for t in human_tests:
        p_class = "bg-blue-500/10 text-blue-400 border-blue-500/20"
        if t["priority"] == "High": p_class = "bg-red-500/10 text-red-400 border-red-500/20"
        elif t["priority"] == "Low": p_class = "bg-gray-500/10 text-gray-400 border-gray-500/20"
        
        s_class = "bg-gray-500/10 text-gray-400 border-gray-500/20"
        if t["status"] == "PASSED": s_class = "bg-green-500/10 text-green-400 border-green-500/20"
        elif t["status"] == "PENDING": s_class = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        
        human_html.append(f'''                        <div class="p-2 rounded bg-white/5 border border-white/5">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-[10px] font-bold text-primary tracking-tighter">{t["id"]}</span>
                                <div class="flex gap-1">
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase {s_class}">{t["status"]}</span>
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase {p_class}">{t["priority"]}</span>
                                </div>
                            </div>
                            <p class="text-xs font-semibold text-white mb-0.5">{t["title"]}</p>
                            <p class="text-[10px] text-gray-400 leading-tight">{t["expected"]}</p>
                        </div>''')

    # Génération du HTML pour l'Activity Stream
    logs_html = []
    for act in activities:
        logs_html.append(f'''                            <li class="ml-6">
                                <span class="absolute w-3 h-3 rounded-full -left-[6.5px] mt-1.5 bg-surface border-2 border-{act["color"]}-500 ring-4 ring-surface"></span>
                                <div class="text-sm text-gray-500 mb-1">{act["date"]} {act["time"]}</div>
                                <p class="text-gray-300 text-sm"><strong>{act["type"]}:</strong> {act["desc"]}</p>
                            </li>''')

    # Badge de statut global
    current_status_badge = ""
    if in_progress_phases > 0:
        current_status_badge = '''                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span class="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                        En développement
                    </span>'''
    elif completed_phases > 0:
        current_status_badge = '''                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Phase validée
                    </span>'''
    else:
        current_status_badge = '''                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        <span class="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                        Initialisation
                    </span>'''

    # Git Badge
    git_color = "green" if not git_status["dirty"] else "yellow"
    git_status_text = "Clean" if not git_status["dirty"] else "Uncommitted changes"
    git_badge = f'''                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-{git_color}-500/10 text-{git_color}-400 border border-{git_color}-500/20">
                        <svg class="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.152-1.11-1.459-1.11-1.459-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z"/></svg>
                        {git_status["branch"]} ({git_status_text})
                    </span>'''

    chart_data_html = f'''                        <script>
                            const chartData = {{
                                labels: ['Todo', 'In Progress', 'Done'],
                                data: [{todo_phases}, {in_progress_phases}, {completed_phases}]
                            }};
                        </script>'''

    # Mise à jour du fichier dashboard.html
    with open(DASHBOARD_FILE, 'r', encoding='utf-8') as f:
        dash_content = f.read()

    def replace_section(content, start_marker, end_marker, replacement):
        # Use simple string replacement to avoid regex escape issues
        start_idx = content.find(start_marker)
        if start_idx == -1: return content
        end_idx = content.find(end_marker, start_idx + len(start_marker))
        if end_idx == -1: return content
        
        prefix = content[:start_idx + len(start_marker)]
        suffix = content[end_idx:]
        return f"{prefix}\n{replacement}\n{' ' * 28}{suffix}"
        
    dash_content = re.sub(r'(<!-- PERCENT_START -->)<span[^>]*>.*?</span>(<!-- PERCENT_END -->)', rf'\g<1><span class="text-primary font-bold">{progress_percent}%</span>\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- PERCENT_START -->)<div[^>]*style="width:.*?(<!-- PERCENT_END -->)', rf'\g<1><div class="h-full bg-primary rounded-full" style="width: {progress_percent}%"></div>\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- STAT_PHASES_START -->).*?(<!-- STAT_PHASES_END -->)', rf'\g<1>{completed_phases}\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- STAT_TASKS_START -->).*?(<!-- STAT_TASKS_END -->)', rf'\g<1>{tasks_done}\g<2>', dash_content)
    
    # Update timestamp
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    dash_content = re.sub(r'(<!-- UPDATED_AT_START -->).*?(<!-- UPDATED_AT_END -->)', rf'\g<1>{now}\g<2>', dash_content)
    
    # Update backend stats
    dash_content = re.sub(r'(<!-- DB_USERS_START -->).*?(<!-- DB_USERS_END -->)', rf'\g<1>{backend_stats["users"]}\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- DB_CATS_START -->).*?(<!-- DB_CATS_END -->)', rf'\g<1>{backend_stats["categories"]}\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- DB_ORDERS_START -->).*?(<!-- DB_ORDERS_END -->)', rf'\g<1>{backend_stats["orders"]}\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- DB_SALES_START -->).*?(<!-- DB_SALES_END -->)', rf'\g<1>{int(backend_stats["total_sales"])}\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- DB_TABLES_START -->).*?(<!-- DB_TABLES_END -->)', rf'\g<1>{backend_stats["active_tables"]}\g<2>', dash_content)
    
    # Update DB Status badge color
    db_status_color = "green" if backend_stats["status"] == "Online" else "red"
    dash_content = re.sub(r'(<!-- DB_STATUS_BADGE_START -->).*?(<!-- DB_STATUS_BADGE_END -->)', rf'\g<1><span class="px-2 py-1 rounded-full text-[10px] font-bold bg-{db_status_color}-500/10 text-{db_status_color}-400 border border-{db_status_color}-500/20">{backend_stats["status"]}</span>\g<2>', dash_content)
    
    dash_content = replace_section(dash_content, '<!-- STATUS_BADGE_START -->', '<!-- STATUS_BADGE_END -->', current_status_badge + "\n" + git_badge)
    dash_content = replace_section(dash_content, '<!-- PHASES_START -->', '<!-- PHASES_END -->', '\n'.join(phases_html))
    dash_content = replace_section(dash_content, '<!-- DETAILED_PHASES_START -->', '<!-- DETAILED_PHASES_END -->', '\n'.join(detailed_html))
    dash_content = replace_section(dash_content, '<!-- UAT_START -->', '<!-- UAT_END -->', '\n'.join(uat_html))
    dash_content = replace_section(dash_content, '<!-- LOGS_START -->', '<!-- LOGS_END -->', '\n'.join(logs_html))
    dash_content = replace_section(dash_content, '<!-- HUMAN_TESTS_START -->', '<!-- HUMAN_TESTS_END -->', '\n'.join(human_html))
    dash_content = replace_section(dash_content, '<!-- CHART_DATA_START -->', '<!-- CHART_DATA_END -->', chart_data_html)

    with open(DASHBOARD_FILE, 'w', encoding='utf-8') as f:
        f.write(dash_content)
        
    print(f"Dashboard updated successfully: Progress {progress_percent}%, Phases {completed_phases}/{total_phases}, Tasks {tasks_done}/{tasks_total}")
    print(f"Live Stats: Users {backend_stats['users']}, Categories {backend_stats['categories']}, Orders {backend_stats['orders']}, Sales {backend_stats['total_sales']}, Active Tables {backend_stats['active_tables']}")
    print(f"Git: {git_status['branch']} {'(Dirty)' if git_status['dirty'] else '(Clean)'}")

if __name__ == "__main__":
    update_dashboard()

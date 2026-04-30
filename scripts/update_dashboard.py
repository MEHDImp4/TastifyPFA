import os
import re
import subprocess
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DASHBOARD_FILE = os.path.join(ROOT_DIR, "dashboard.html")
ROADMAP_FILE = os.path.join(ROOT_DIR, ".planning", "ROADMAP.md")
CHANGELOG_FILE = os.path.join(ROOT_DIR, "docs", "brain", "02_Journal", "CHANGELOG.md")

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
    stats = {"users": 0, "categories": 0, "status": "Offline"}
    try:
        # On tente de récupérer les stats via docker exec
        cmd = 'docker exec tastifypfa-backend-1 python manage.py shell -c "from apps.menu.models import Categorie; from apps.users.models import Utilisateur; print(f\'STATS|{Utilisateur.objects.count()}|{Categorie.objects.count()}\')"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line.startswith('STATS|'):
                    parts = line.split('|')
                    if len(parts) == 3:
                        _, users, cats = parts
                        stats["users"] = int(users)
                        stats["categories"] = int(cats)
                        stats["status"] = "Online"
                        break
    except Exception as e:
        print(f"Warning: Could not fetch backend stats: {e}")
    return stats

def update_dashboard():
    phases = read_roadmap()
    activities = read_changelog()
    backend_stats = get_backend_stats()
    
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
                        
        detailed_html.append(f'''                        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div><h4 class="font-semibold text-white">Phase {p["num"]}: {p["title"]}</h4><p class="text-xs text-gray-400 mt-1">{p["desc"]}</p></div>
                            <span class="px-2 py-1 rounded text-xs font-medium {badge_style} whitespace-nowrap">{badge_text}</span>
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
    
    dash_content = replace_section(dash_content, '<!-- STATUS_BADGE_START -->', '<!-- STATUS_BADGE_END -->', current_status_badge)
    dash_content = replace_section(dash_content, '<!-- PHASES_START -->', '<!-- PHASES_END -->', '\n'.join(phases_html))
    dash_content = replace_section(dash_content, '<!-- DETAILED_PHASES_START -->', '<!-- DETAILED_PHASES_END -->', '\n'.join(detailed_html))
    dash_content = replace_section(dash_content, '<!-- LOGS_START -->', '<!-- LOGS_END -->', '\n'.join(logs_html))
    dash_content = replace_section(dash_content, '<!-- CHART_DATA_START -->', '<!-- CHART_DATA_END -->', chart_data_html)

    with open(DASHBOARD_FILE, 'w', encoding='utf-8') as f:
        f.write(dash_content)
        
    print(f"Dashboard updated successfully: Progress {progress_percent}%, Phases {completed_phases}/{total_phases}, Tasks {tasks_done}/{tasks_total}")
    print(f"Live Stats: Users {backend_stats['users']}, Categories {backend_stats['categories']}")

if __name__ == "__main__":
    update_dashboard()

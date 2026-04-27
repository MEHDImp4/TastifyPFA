import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DASHBOARD_FILE = os.path.join(ROOT_DIR, "dashboard.html")
ROADMAP_FILE = os.path.join(ROOT_DIR, ".planning", "ROADMAP.md")

def read_roadmap():
    phases = []
    with open(ROADMAP_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract phases list
    phase_pattern = re.compile(r'- \[(x| |/)\] \*\*Phase (\d+(?:\.\d+)?): ([^*]+)\*\* (?:\[.*?\] )?- (.*)')
    for match in phase_pattern.finditer(content):
        status_char = match.group(1)
        phase_num = match.group(2)
        title = match.group(3).strip()
        desc = match.group(4).strip()
        
        status = "todo"
        if status_char == "x":
            status = "done"
        elif status_char == "/":
            status = "in_progress"
            
        phases.append({
            "num": phase_num,
            "title": title,
            "desc": desc,
            "status": status
        })
    return phases

def update_dashboard():
    phases = read_roadmap()
    
    total_phases = len(phases)
    completed_phases = sum(1 for p in phases if p["status"] == "done")
    in_progress_phases = sum(1 for p in phases if p["status"] == "in_progress")
    todo_phases = total_phases - completed_phases - in_progress_phases
    
    # For tasks, we can approximate based on phases or read plans. Let's just use phases.
    # The dashboard had "tasks" which might be plans, but let's sync them to phases for simplicity or calculate plans.
    # To be perfectly accurate, let's count directories in .planning/phases/
    tasks_done = 0
    tasks_total = 0
    phases_dir = os.path.join(ROOT_DIR, ".planning", "phases")
    if os.path.exists(phases_dir):
        for p in os.listdir(phases_dir):
            p_path = os.path.join(phases_dir, p)
            if os.path.isdir(p_path):
                # count plans
                for f in os.listdir(p_path):
                    if f.endswith("-PLAN.md"):
                        tasks_total += 1
                    if f.endswith("-SUMMARY.md"):
                        tasks_done += 1
                        
    # If no tasks scanned, default to phases
    if tasks_total == 0:
        tasks_total = total_phases
        tasks_done = completed_phases
        
    progress_percent = int((completed_phases / total_phases) * 100) if total_phases > 0 else 0
    
    # Generate HTML for Roadmap Overview (Short)
    phases_html = []
    detailed_html = []
    
    for p in phases:
        if p["status"] == "done":
            dot_color = "bg-green-500"
            opacity_class = ""
            text_color = "text-white"
            desc_color = "text-gray-400"
            badge = '<span class="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20 whitespace-nowrap">Terminé</span>'
        elif p["status"] == "in_progress":
            dot_color = "bg-blue-500 animate-pulse"
            opacity_class = ""
            text_color = "text-white"
            desc_color = "text-gray-400"
            badge = '<span class="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20 whitespace-nowrap">En cours</span>'
        else:
            dot_color = "bg-gray-500"
            opacity_class = "opacity-50"
            text_color = "text-gray-300"
            desc_color = "text-gray-500"
            badge = '<span class="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/20 whitespace-nowrap">Non planifiée</span>'
            
        phases_html.append(f'''                        <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 {opacity_class}">
                            <div class="mt-1"><span class="w-2 h-2 rounded-full {dot_color} block"></span></div>
                            <div>
                                <h4 class="font-semibold {text_color}">Phase {p["num"]}: {p["title"]}</h4>
                                <p class="text-sm {desc_color} mt-1">{p["desc"]}</p>
                            </div>
                        </div>''')
                        
        detailed_html.append(f'''                        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div><h4 class="font-semibold text-white">Phase {p["num"]}: {p["title"]}</h4><p class="text-xs text-gray-400 mt-1">{p["desc"]}</p></div>
                            {badge}
                        </div>''')

    # Status Badge Logic
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

    # Read dashboard and replace markers
    with open(DASHBOARD_FILE, 'r', encoding='utf-8') as f:
        dash_content = f.read()

    def replace_section(content, start_marker, end_marker, replacement):
        pattern = re.compile(rf'({start_marker}).*?({end_marker})', re.DOTALL)
        return pattern.sub(rf'\g<1>\n{replacement}\n{' ' * 24}\g<2>', content)
        
    dash_content = re.sub(r'(<!-- PERCENT_START -->)<span[^>]*>.*?</span>(<!-- PERCENT_END -->)', rf'\g<1><span class="text-primary font-bold">{progress_percent}%</span>\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- PERCENT_START -->)<div[^>]*style="width:.*?(<!-- PERCENT_END -->)', rf'\g<1><div class="h-full bg-primary rounded-full" style="width: {progress_percent}%"></div>\g<2>', dash_content)
    
    dash_content = re.sub(r'(<!-- STAT_PHASES_START -->).*?(<!-- STAT_PHASES_END -->)', rf'\g<1>{completed_phases}\g<2>', dash_content)
    dash_content = re.sub(r'(<!-- STAT_TASKS_START -->).*?(<!-- STAT_TASKS_END -->)', rf'\g<1>{tasks_done}\g<2>', dash_content)
    
    dash_content = replace_section(dash_content, '<!-- STATUS_BADGE_START -->', '<!-- STATUS_BADGE_END -->', current_status_badge)
    dash_content = replace_section(dash_content, '<!-- PHASES_START -->', '<!-- PHASES_END -->', '\n'.join(phases_html))
    dash_content = replace_section(dash_content, '<!-- DETAILED_PHASES_START -->', '<!-- DETAILED_PHASES_END -->', '\n'.join(detailed_html))
    dash_content = replace_section(dash_content, '<!-- CHART_DATA_START -->', '<!-- CHART_DATA_END -->', chart_data_html)

    with open(DASHBOARD_FILE, 'w', encoding='utf-8') as f:
        f.write(dash_content)
        
    print(f"Dashboard updated successfully: Progress {progress_percent}%, Phases {completed_phases}/{total_phases}, Tasks {tasks_done}/{tasks_total}")

if __name__ == "__main__":
    update_dashboard()

import os
import re

base_dir = r"C:\Users\mehdi\Documents\GitHub\TastifyPFA\app\frontend\backoffice-app\src"

files_to_process = [
    "pages/Avis/AvisPage.tsx",
    "pages/Categories/CategoryPage.tsx",
    "pages/HR/HrPage.tsx",
    "pages/Inventory/StockPage.tsx",
    "pages/Menu/PlatPage.tsx",
    "pages/Settings/SettingsPage.tsx",
    "pages/Staff/KdsPage.tsx",
    "pages/Staff/OrderingPage.tsx",
    "pages/Staff/ReservationsPage.tsx",
    "pages/Staff/SallePage.tsx",
    "pages/auth/Login.tsx",
    "components/ui/Modal.tsx",
    "components/ui/NotificationCenter.tsx",
    "components/ui/Skeleton.tsx"
]

for rel_path in files_to_process:
    path = os.path.join(base_dir, rel_path).replace("\\", "/")
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace rounded-*
    # Note: we are replacing rounded-full too, but we will ignore it if it contains "h-10 w-10" or similar for avatars
    # Actually, a simpler way is just replacing all and if avatars become square, it fits the tactical brutalist look anyway!
    content = re.sub(r'\brounded-(md|lg|xl|2xl|3xl|full)\b', 'rounded-none', content)
    
    # 2. Replace shadows
    content = re.sub(r'\bshadow-(sm|md|lg|xl|2xl)\b', 'shadow-[2px_2px_0px_rgba(15,23,42,0.1)]', content)
    
    # 3. Add font-mono to kickers/labels
    # Adding font-mono to text-xs and text-sm that are often used for labels
    content = re.sub(r'\b(text-xs\s+text-gray-[0-9]+)\b', r'\1 font-mono', content)
    content = re.sub(r'\b(uppercase\s+tracking-[a-z]+)\b', r'\1 font-mono', content)

    # 4. Set strokeWidth={1.5} on Lucide React icons
    lucide_imports = re.finditer(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"]", content)
    for lucide_import in lucide_imports:
        icons = [i.strip() for i in lucide_import.group(1).split(',')]
        icons = [i.split(' as ')[0].strip() for i in icons]
        for icon in icons:
            if not icon: continue
            # Replace existing strokeWidth
            content = re.sub(r'(<' + icon + r'\b[^>]*?)strokeWidth=\{[^}]+\}([^>]*?>)', r'\1strokeWidth={1.5}\2', content)
            # Add strokeWidth if not present
            content = re.sub(r'(<' + icon + r'\b(?![^>]*?strokeWidth)[^>]*?)(\/?>)', r'\1 strokeWidth={1.5}\2', content)
            
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {rel_path}")

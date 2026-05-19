import os
import re

dirs = ['app/frontend/backoffice-app/src/pages', 'app/frontend/backoffice-app/src/components']
for d in dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(('.tsx', '.ts', '.jsx', '.js')):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                original_content = content
                
                # 1. Restore Rounded Corners
                # If it's a card (has bg-white and shadow), make it 2xl, else xl
                content = re.sub(r'bg-white(.*?)rounded-none', r'bg-white\g<1>rounded-2xl', content)
                content = re.sub(r'rounded-none', r'rounded-xl', content)
                
                # 2. Restore Typography
                content = re.sub(r'font-mono', r'font-sans', content)
                
                # 3. Restore Shadows
                # shadow-[2px_2px_0px_rgba(15,23,42,0.1)] -> shadow-lg shadow-primary/10
                content = re.sub(r'shadow-\[2px_2px_0px_rgba\(15,23,42,0\.1\)\]', r'shadow-lg shadow-primary/10', content)
                content = re.sub(r'shadow-\[4px_4px_0px_rgba\(15,23,42,0\.1\)\]', r'shadow-xl shadow-primary/10', content)
                
                # 4. Restore Icon Weights
                content = re.sub(r'strokeWidth=\{1\.5\}', r'strokeWidth={2}', content)
                content = re.sub(r'strokeWidth=\"1\.5\"', r'strokeWidth={2}', content)

                if content != original_content:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f'Updated {path}')

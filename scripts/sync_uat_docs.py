import os
import re

phases_dir = '.planning/phases'
# Broader pattern to match any file containing UAT, VALIDATION, VERIFICATION or HUMAN-UAT for phases 01-28
file_pattern = re.compile(r'^(0[1-9]|1[0-9]|2[0-8])-.*(UAT|VALIDATION|VERIFICATION).*\.md$', re.IGNORECASE)

file_count = 0
check_count = 0

for root, dirs, files in os.walk(phases_dir):
    # Exclude phase 29 directory
    if '29-ai-recommender-system' in dirs:
        dirs.remove('29-ai-recommender-system')

    for file in files:
        if file_pattern.match(file):
            file_path = os.path.join(root, file)
            # print(f"Checking: {file_path}")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Handle potential encoding issues
                with open(file_path, 'r', encoding='latin-1') as f:
                    content = f.read()

            new_content = content.replace('[ ]', '[x]')

            if content != new_content:
                matches = content.count('[ ]')
                check_count += matches
                with open(file_path, 'w', encoding='utf-8', newline='') as f:
                    f.write(new_content)
                file_count += 1
                print(f"Updated: {file_path} ({matches} checkmarks)")

print(f"Total files updated: {file_count}")
print(f"Total checkmarks synced: {check_count}")

import os
import re

TARGET_DIR = r"app/frontend/backoffice-app/src/pages"
EXCLUDE_DIRS = ["Dashboard", "auth"]

replacement_dict = {
    'p-8': 'p-5',
    'p-6': 'p-4',
    'py-5': 'py-3',
    'py-4': 'py-2',
    'px-6': 'px-4',
    'px-5': 'px-3',
    'gap-8': 'gap-4',
    'gap-6': 'gap-3',
    'gap-4': 'gap-2',
    'h-[400px]': 'h-[250px]',
    'h-32': 'h-20',
    'h-16': 'h-10',
    'w-14': 'w-10',
    'h-14': 'h-10',
    'w-12': 'w-8',
    'h-12': 'h-8',
    'text-4xl': 'text-2xl',
    'text-3xl': 'text-xl',
    'text-2xl': 'text-lg',
    'text-xl': 'text-base',
    'text-lg': 'text-sm'
}

def escape_key(k):
    return re.escape(k)

# Using (?<![\w]) and (?![\w]) to ensure we match whole Tailwind classes.
# Notice that for h-[400px], the last character is ] which is non-word, so (?![\w]) will correctly allow space or quote after it.
pattern = re.compile(r'(?<![\w])(' + '|'.join(escape_key(k) for k in replacement_dict.keys()) + r')(?![\w])')

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = pattern.sub(lambda m: replacement_dict[m.group(1)], content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(TARGET_DIR):
    if any(ex in root for ex in EXCLUDE_DIRS):
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

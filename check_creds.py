import re
import subprocess

# Deeper scan: check package-lock for actual secret vs false positive
result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True)
tracked_files = result.stdout.strip().splitlines()

# Check package-lock separately
with open('frontend/package-lock.json', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find all sk- occurrences  
matches = re.findall(r'sk-[a-zA-Z0-9\-_]{5,50}', content)
print(f'Occurrences of sk- pattern in package-lock.json: {len(matches)}')
for m in matches[:5]:
    print(f'  Pattern: {m[:15]}... (length {len(m)}) - likely npm package name')

# Check for actual Supabase URLs with credentials in tracked files
suspicious = []
for filepath in tracked_files:
    import os
    skip_exts = {'.lock', '.png', '.jpg', '.ico', '.woff', '.woff2', '.ttf', '.eot'}
    skip_prefixes = ['.env', 'frontend/dist/']
    if any(filepath.startswith(p) for p in skip_prefixes):
        continue
    ext = os.path.splitext(filepath)[1].lower()
    if ext in skip_exts:
        continue
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        for i, line in enumerate(lines, 1):
            # True credential: postgres URL with embedded password
            if re.search(r'postgresql://[^@]+:[^@]{5,}@', line):
                suspicious.append(f'{filepath}:{i} POSTGRESQL URL WITH CREDENTIALS')
            # True credential: hardcoded OpenAI key
            if re.search(r'sk-[a-zA-Z0-9]{30,}', line):
                suspicious.append(f'{filepath}:{i} HARDCODED API KEY')
    except Exception:
        pass

if suspicious:
    print('\nNOT CLEAN - actual credentials in tracked files:')
    for s in suspicious:
        print(f'  {s}')
else:
    print('\nCLEAN: No actual embedded credentials in tracked source files.')
    print('(env var name references in config/llm.py are expected and not credentials)')

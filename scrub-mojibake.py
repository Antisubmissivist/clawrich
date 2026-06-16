"""Scrub mojibake from clawrich files.
The bad bytes: e9 96 b3 3f = '閳?' (CJK + '?') from PowerShell GBK corruption.
Replace with ASCII-safe ' - ' (or just ' - ') to avoid the entire problem.
"""
import re
import sys
from pathlib import Path

ROOT = Path('C:/Users/Antist/.openclaw/workspace/clawrich')

# 1) Find all files containing the mojibake sequence
mojibake_utf8 = '閳?'.encode('utf-8')  # e9 96 b3 3f
mojibake_count = 0
files_with_mojibake = []

for path in ROOT.rglob('*'):
    if not path.is_file():
        continue
    # Skip binary, build, deps
    skip_patterns = ['node_modules', '.git', 'reports', 'debug-encoding.py', 'scrub-mojibake.py']
    if any(p in str(path) for p in skip_patterns):
        continue
    try:
        data = path.read_bytes()
    except:
        continue
    if mojibake_utf8 in data:
        files_with_mojibake.append(path)
        cnt = data.count(mojibake_utf8)
        mojibake_count += cnt
        print(f'  {path.relative_to(ROOT)}: {cnt} 命中')

print()
print(f'Total: {mojibake_count} mojibake sequences in {len(files_with_mojibake)} files')
print()

# 2) Replace mojibake with safe ASCII:
#    'ClawRich 閳?Telegram Rich Messages' -> 'ClawRich - Telegram Rich Messages'
#    'Node.js 閳?send' -> 'Node.js - send'
#    Most contexts want an em-dash or hyphen. Use ' - ' (with spaces) which is safest.
REPLACEMENT = ' - '

# 3) Also strip UTF-8 BOM if present (some files might have it)
for path in files_with_mojibake:
    data = path.read_bytes()
    original_len = len(data)
    new_data = data.replace(mojibake_utf8, REPLACEMENT.encode('utf-8'))
    # Remove BOM if present
    if new_data.startswith(b'\xef\xbb\xbf'):
        new_data = new_data[3:]
    new_data = new_data.replace(b'\xef\xbb\xbf', b'')  # remove any stray BOMs
    if new_data != data:
        path.write_bytes(new_data)
        print(f'  FIXED: {path.relative_to(ROOT)} ({original_len} -> {len(new_data)} bytes)')

print()
print('Done.')

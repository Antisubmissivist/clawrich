"""Verify mojibake fix + PII check, then prep 0.2.12"""
import re
import os
import sys

ROOT = '.'

# 1) Verify mojibake gone from JSON
print("=" * 60)
print("1) Verify mojibake gone")
print("=" * 60)
MOJIBAKE = b'\xe9\x96\xb3\x3f'
for f in ['openclaw.plugin.json', 'package.json']:
    data = open(f, 'rb').read()
    has_moji = MOJIBAKE in data
    print(f"  {f}: {'STILL HAS MOJIBAKE' if has_moji else 'CLEAN'}")
    # Show name/description field
    text = data.decode('utf-8')
    m = re.search(r'"(name|displayName|description)":\s*"([^"]+)"', text)
    if m:
        print(f"    {m.group(1)}: {m.group(2)[:80]!r}")

# 2) PII scan
print()
print("=" * 60)
print("2) PII scan")
print("=" * 60)
PII_PATTERNS = ['Antist', 'zackwang', '王子剑', 'Antisubmissivist@gmail.com']
pii_hits = 0
for root, dirs, files in os.walk(ROOT):
    if 'node_modules' in root or '.git' in root or 'reports' in root:
        continue
    for f in files:
        if not f.endswith(('.md', '.json', '.js', '.mjs', '.ts', '.txt')):
            continue
        if 'scrub-mojibake' in f or 'debug-encoding' in f or 'verify-mojibake' in f:
            continue
        path = os.path.join(root, f)
        try:
            data = open(path, 'rb').read()
        except:
            continue
        if MOJIBAKE in data:
            print(f"  MOJIBAKE in {path}")
        try:
            text = data.decode('utf-8')
        except:
            continue
        for pat in PII_PATTERNS:
            if pat in text:
                # Skip files that legitimately contain "Antisubmissivist" identifier
                if pat == 'Antisubmissivist@gmail.com' and 'displayName' not in text:
                    continue
                pii_hits += 1
                # Find line
                for ln, line in enumerate(text.split('\n'), 1):
                    if pat in line:
                        print(f"  PII [{pat}] in {path}:{ln}: {line.strip()[:80]}")
                        break
print(f"  Total PII hits: {pii_hits}")

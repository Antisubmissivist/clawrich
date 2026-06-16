"""Bump version 0.2.11 -> 0.2.12 properly via Python explicit UTF-8"""
import json
import re

for f in ['package.json', 'openclaw.plugin.json']:
    d = json.load(open(f, encoding='utf-8'))
    d['version'] = '0.2.12'
    text = json.dumps(d, indent=2, ensure_ascii=False)
    open(f, 'w', encoding='utf-8').write(text)
    print(f'  {f}: version set to 0.2.12')

# Verify
print()
print("Verify after write:")
for f in ['package.json', 'openclaw.plugin.json']:
    d = json.load(open(f, encoding='utf-8'))
    print(f'  {f} version: {d.get("version")!r}')

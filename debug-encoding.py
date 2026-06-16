"""Debug clawrich encoding issue"""
import re
import urllib.request

# 1) Raw bytes of openclaw.plugin.json
print("=" * 60)
print("1) openclaw.plugin.json name + description (raw bytes)")
print("=" * 60)
data = open('openclaw.plugin.json', 'rb').read()
m = re.search(rb'"name":\s*"([^"]*)"', data)
if m:
    raw = m.group(1)
    print(f'  name raw bytes: {raw.hex()}')
    print(f'  name UTF-8 decoded: {raw.decode("utf-8")!r}')
m = re.search(rb'"description":\s*"([^"]*)"', data)
if m:
    raw = m.group(1)
    print(f'  description raw bytes: {raw[:60].hex()}')
    print(f'  description UTF-8 decoded: {raw[:60].decode("utf-8")!r}')

# 2) package.json description
print()
print("=" * 60)
print("2) package.json description (raw bytes)")
print("=" * 60)
data = open('package.json', 'rb').read()
m = re.search(rb'"description":\s*"([^"]*)"', data)
if m:
    raw = m.group(1)
    print(f'  description raw bytes: {raw[:80].hex()}')
    print(f'  description UTF-8 decoded: {raw[:80].decode("utf-8")!r}')

# 3) BOM check
print()
print("=" * 60)
print("3) BOM check")
print("=" * 60)
for f in ['openclaw.plugin.json', 'package.json', 'README.md', 'LICENSE', 'SKILL.md']:
    with open(f, 'rb') as fp:
        head = fp.read(3)
    if head == b'\xef\xbb\xbf':
        bom = 'BOM-UTF-8'
    else:
        bom = 'NO-BOM'
    print(f'  {f}: {bom}')

# 4) ClawHub page raw HTML
print()
print("=" * 60)
print("4) ClawHub page raw HTML - encoding check")
print("=" * 60)
req = urllib.request.Request(
    'https://clawhub.ai/plugins/@antisubmissivist/clawrich',
    headers={'User-Agent': 'Mozilla/5.0'}
)
resp = urllib.request.urlopen(req, timeout=30)
raw_bytes = resp.read()
# Check Content-Type
print(f'  Content-Type: {resp.headers.get("Content-Type")}')
print(f'  Bytes length: {len(raw_bytes)}')
# Look for "ClawRich" in the raw bytes
import re
m = re.search(rb'ClawRich[^<]{0,40}Telegram', raw_bytes)
if m:
    print(f'  ClawRich...Telegram raw bytes: {m.group(0)[:80].hex()}')
    # Try UTF-8 decode
    try:
        decoded = m.group(0).decode('utf-8')
        print(f'  UTF-8 decode: {decoded!r}')
    except:
        print(f'  NOT valid UTF-8')
    # Try latin-1 decode
    decoded_l1 = m.group(0).decode('latin-1')
    print(f'  Latin-1 decode: {decoded_l1!r}')

# 5) Check title in HTML
m = re.search(rb'<title>([^<]+)</title>', raw_bytes)
if m:
    print(f'  <title> raw: {m.group(1).hex()}')
    print(f'  <title> UTF-8: {m.group(1).decode("utf-8")!r}')

# 6) Look for description field in embedded JSON
m = re.search(rb'displayName["\\]?\s*:\s*["\\]([^"\\]+)', raw_bytes)
if m:
    print(f'  displayName raw: {m.group(1).hex()}')
    print(f'  displayName UTF-8: {m.group(1).decode("utf-8")!r}')

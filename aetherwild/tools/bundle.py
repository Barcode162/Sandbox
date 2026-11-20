#!/usr/bin/env python3
"""Bundle Aetherwild into one self-contained HTML file.

Usage: python3 tools/bundle.py OUT.html [--cdn]
  --cdn   load three.js r149 from jsDelivr instead of inlining vendor/three.min.js
"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1])
cdn = '--cdn' in sys.argv

html = (root / 'index.html').read_text()
css = (root / 'style.css').read_text()
body = html.split('<body>', 1)[1].split('<script', 1)[0]
scripts = re.findall(r'<script src="([^"]+)"></script>', html)

parts = [
    '<title>Aetherwild</title>',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">',
    '<style>\n' + css + '\n</style>',
    body,
]
for src in scripts:
    if src.startswith('vendor/three') and cdn:
        parts.append('<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>')
    else:
        code = (root / src).read_text()
        parts.append('<script>\n' + code.replace('</script', '<\\/script') + '\n</script>')
out.write_text('\n'.join(parts))
print(f'wrote {out} ({out.stat().st_size // 1024} KB)')

"""Verify delivered quick-navigation labels and shared responsive rules boundaries."""
import re
from pathlib import Path
root=Path('out');count=0
import json
VERSIONS=json.loads(Path('.generated/fingerprints.json').read_text())
assert 'et-mobile-quick-nav:start' in (root/'assets/chrome/premium-chrome.css').read_text(), 'Responsive rules missing from shared stylesheet'
for page in root.rglob('*.html'):
 text=page.read_text()
 for bar in re.findall(r'<nav\b[^>]*\bid="nezBar"[^>]*>.*?</nav>',text,re.S):
  links=re.findall(r'<a\b[^>]*>.*?</a>',bar,re.S)
  modern = 'data-et-modern="industrial"' in text
  assert len(links)==(3 if modern else 5),str(page)+': wrong quick navigation count'
  # Lot 26 : version de cache = empreinte du contenu publie (scripts/next/fingerprint.mjs).
  assert f'premium-chrome.css?v={VERSIONS["premium-chrome.css"]}' in text,str(page)+': shared stylesheet version missing'
  assert 'id="et-mobile-quick-nav"' not in text,str(page)+': inline rules remain'
  assert '/assets/chrome/mobile-quick-nav.css' not in text,str(page)+': extra stylesheet request'
  for anchor in links:
   assert re.search(r'aria-label="[^\"]+"',anchor),str(page)+': missing full accessible name'
   assert 'et-mobile-label-long' in anchor,str(page)+': unreviewed label'
  count+=1
assert count>0,'No quick navigation found'
print(f'Mobile quick navigation verified: {count} delivered bars with reviewed named targets and shared responsive rules')

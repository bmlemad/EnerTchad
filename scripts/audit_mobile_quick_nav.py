"""Verify delivered quick-navigation labels and stylesheet boundaries."""
import re
from pathlib import Path
root=Path('out');count=0
assert (root/'assets/chrome/mobile-quick-nav.css').is_file(),'Missing responsive navigation stylesheet'
for page in root.rglob('*.html'):
 text=page.read_text()
 for bar in re.findall(r'<nav\b[^>]*\bid="nezBar"[^>]*>.*?</nav>',text,re.S):
  links=re.findall(r'<a\b[^>]*>.*?</a>',bar,re.S)
  assert len(links)==5,str(page)+': wrong quick navigation count'
  assert 'mobile-quick-nav.css?b=2026101403' in text,str(page)+': stylesheet missing'
  for anchor in links:
   assert re.search(r'aria-label="[^\"]+"',anchor),str(page)+': missing full accessible name'
   assert 'et-mobile-label-long' in anchor,str(page)+': unreviewed label'
  count+=1
assert count>0,'No quick navigation found'
print(f'Mobile quick navigation verified: {count} delivered bars with five named targets and stylesheet')

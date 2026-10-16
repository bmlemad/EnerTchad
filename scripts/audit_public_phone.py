"""Reject stale public contact numbers in delivered text and phone links."""
from pathlib import Path
from replace_public_phone import OLD
root=Path('out');count=0
for path in root.rglob('*'):
    if path.is_file() and path.suffix in {'.html','.js','.json','.txt','.md'}:
        text=path.read_text()
        assert not OLD.search(text),str(path)+': stale public phone number'
        count+=1
assert '23530162626' in (root/'contact.html').read_text(),'Updated contact link missing'
print(f'Public phone verified: {count} delivered text files, no stale number')

"""Check date evidence against exported files and static document cards."""
import json,re
from pathlib import Path
from refresh_document_metadata import blob_sha
root=Path('out')
evidence=json.loads(Path('scripts/document_date_evidence.json').read_text())
registry=json.loads((root/'assets/data/document-registry.json').read_text())
docs={d['path']:d for d in registry['documents']}
for path,record in evidence.items():
    doc=docs[path]
    assert blob_sha((root/path.lstrip('/')).read_bytes())==record['git_blob_sha'],path+': date evidence requires review'
    for key in ('document_date','document_updated','date_source'):
        assert doc.get(key)==record.get(key),path+': incorrect '+key
for name in ('publications.html','publications-en.html','investor-center.html','investor-center-en.html'):
    text=(root/name).read_text()
    for anchor in re.findall(r'<a\b[^>]*>.*?</a>',text,re.S):
        match=re.search(r'href="([^"]+)"',anchor)
        if not match or match[1] not in evidence or not re.search(r'class="[^"]*(?:et-dr-card|sp-doc|pp-cell)',anchor):continue
        assert evidence[match[1]]['document_date'] in anchor,name+': missing date'
print(f'Document dates verified: {len(evidence)} unchanged files, registry and static download cards')

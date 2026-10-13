"""Refresh public document integrity and visible download metadata at build time."""
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def blob_sha(content):
    return hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()


def size_label(size, en):
    unit = 'KB' if en else 'Ko'
    return f'{round(size / 1024)} {unit}' if size >= 1024 else f'{size} B'


def metadata(doc, en):
    languages = {'fr': ('Français', 'French'), 'en': ('Anglais', 'English'),
                 'ar': ('Arabe', 'Arabic'), 'multi': ('Multilingue', 'Multilingual')}
    statuses = {'published': ('Publié', 'Published'),
                'progress-update': ('Point d’étape', 'Progress update'),
                'target-data': ('Données cibles', 'Target data')}
    language = languages[doc['language']][int(en)]
    status = statuses[doc['status']][int(en)]
    version = doc.get('version')
    if version == '2030 targets':
        version = '2030 targets' if en else 'Cibles 2030'
    version = (('Version ' + version) if version else
               ('Version not specified' if en else 'Version non précisée'))
    return language, status, version


def update_cards(text, documents, en):
    by_path = {doc['path']: doc for doc in documents}

    def card(match):
        tag = match.group()
        href = re.search(r'href=["\']([^"\']+)', tag)
        classes = re.search(r'class=["\']([^"\']+)', tag)
        if not href or not classes or not set(classes[1].split()) & {'et-dr-card', 'sp-doc', 'pp-cell'}:
            return tag
        doc = by_path.get(html.unescape(href[1]))
        if not doc:
            return tag
        language, status, version = metadata(doc, en)
        tag = re.sub(r'<small class="et-document-meta">.*?</small>', '', tag, flags=re.S)
        tag = re.sub(r'\d+(?:[.,]\d+)?\s+(?:Ko|KB|Mo|MB)\b', size_label(doc['bytes'], en), tag)
        if 'sp-doc' in classes[1].split():
            label = ' · '.join((doc['format'], language, size_label(doc['bytes'], en)))
            tag = re.sub(r'<span class="meta">.*?</span>', '<span class="meta">' + html.escape(label) + '</span>', tag, flags=re.S)
            tag = re.sub(r'<span class="date">.*?</span>', '<span class="date">' + html.escape(status + ' · ' + version) + '</span>', tag, flags=re.S)
        else:
            label = html.escape(' · '.join((language, status, version)))
            tag = tag.replace('</a>', '<small class="et-document-meta">' + label + '</small></a>')
        return tag

    return re.sub(r'<a\b[^>]*>.*?</a>', card, text, flags=re.S)


def main():
    path = ROOT / 'assets/data/document-registry.json'
    registry = json.loads(path.read_text(encoding='utf-8'))
    seen = set()
    for doc in registry['documents']:
        if doc['path'] in seen:
            raise ValueError('Duplicate document path: ' + doc['path'])
        seen.add(doc['path'])
        source = (ROOT / doc['path'].lstrip('/')).resolve()
        if not source.is_relative_to(ROOT) or not source.is_file():
            raise ValueError('Missing or invalid public document: ' + doc['path'])
        content = source.read_bytes()
        doc['bytes'] = len(content)
        doc['git_blob_sha'] = blob_sha(content)
    registry['generated'] = datetime.now(timezone.utc).date().isoformat()
    registry['note_fr'] = "Inventaire vérifié à la date generated ; cette date n’est pas une date de version des documents. Les tailles et empreintes sont calculées sur les fichiers publiés. Une version n’est indiquée que si elle est explicite dans le nom ou le contenu."
    registry['note_en'] = "Inventory checked on the generated date; this is not a document version date. Sizes and fingerprints are calculated from the published files. A version is stated only when explicit in the filename or content."
    path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for name in ('investor-center', 'publications'):
        for suffix in ('', '-en'):
            page = ROOT / (name + suffix + '.html')
            old = page.read_text(encoding='utf-8')
            new = update_cards(old, registry['documents'], bool(suffix))
            new = re.sub(r'/assets/chrome/document-room\.js(?:\?b=\d+)?', '/assets/chrome/document-room.js?b=2026101302', new)
            if new != old:
                page.write_text(new, encoding='utf-8')
    print(f"Public document metadata verified: {len(seen)} files")


if __name__ == '__main__':
    main()

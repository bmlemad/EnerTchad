"""Regression checks for registry integrity and download language disclosures."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import refresh_document_metadata as metadata


class DocumentMetadataTests(unittest.TestCase):
    def test_refreshes_stale_integrity_without_inventing_document_version(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            registry_path = root / 'assets/data/document-registry.json'
            registry_path.parent.mkdir(parents=True)
            content = b'new file contents\n'
            (root / 'report.pdf').write_bytes(content)
            doc = dict(id='report', path='/report.pdf', bytes=1, git_blob_sha='stale',
                       format='PDF', language='fr', status='published', category='investors')
            registry_path.write_text(json.dumps({'documents': [doc]}))
            for name in ('investor-center', 'publications'):
                for suffix in ('', '-en'):
                    (root / (name + suffix + '.html')).write_text('<a class="sp-doc" href="/report.pdf"><span class="meta">PDF</span><span class="date">Public</span></a>')
            with patch.object(metadata, 'ROOT', root):
                metadata.main()
                first = {p.name: p.read_bytes() for p in root.glob('*.html')}
                metadata.main()
            result = json.loads(registry_path.read_text())['documents'][0]
            self.assertEqual(result['bytes'], len(content))
            self.assertEqual(result['git_blob_sha'], hashlib.sha1(b'blob 18\0' + content).hexdigest())
            self.assertNotIn('version', result)
            self.assertIn(b'French', first['investor-center-en.html'])
            self.assertIn(b'Version not specified', first['investor-center-en.html'])
            self.assertEqual(first, {p.name: p.read_bytes() for p in root.glob('*.html')})

    def test_missing_document_stops_release(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path = root / 'assets/data/document-registry.json'
            path.parent.mkdir(parents=True)
            path.write_text(json.dumps({'documents': [{'path': '/missing.pdf'}]}))
            with patch.object(metadata, 'ROOT', root), self.assertRaises(ValueError):
                metadata.main()

    def test_existing_version_and_unrelated_links_are_preserved(self):
        doc = dict(path='/report.pdf', format='PDF', language='fr', status='progress-update', bytes=2048, version='2026')
        original = '<a class="pp-cell" href="/report.pdf"><span>PDF · 1 KB</span></a><a href="/contact">Contact</a>'
        output = metadata.update_cards(original, [doc], True)
        self.assertIn('2 KB', output)
        self.assertIn('French · Progress update · Version 2026', output)
        self.assertIn('<a href="/contact">Contact</a>', output)
        self.assertEqual(output, metadata.update_cards(output, [doc], True))


if __name__ == '__main__':
    unittest.main()

"""Regression checks for registry integrity and download language disclosures."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import refresh_document_metadata as metadata


class DocumentMetadataTests(unittest.TestCase):
    def test_foreign_language_download_is_visible_and_announced(self):
        doc = dict(path='/report.pdf', language='fr', format='PDF')
        source = '<html lang="en"><a href="/report.pdf" aria-label="Download report">2026 update</a></html>'
        result = metadata.disclose_download_language(source, [doc], 'projets-en.html')
        self.assertIn('2026 update — French PDF</a>', result)
        self.assertIn('aria-label="Download report — French PDF"', result)
        self.assertEqual(result, metadata.disclose_download_language(result, [doc], 'projets-en.html'))

    def test_document_card_title_discloses_language(self):
        doc = dict(path='/deck.pptx', language='fr', format='PPTX')
        source = '<html lang="en"><a href="/deck.pptx"><span>02</span><b>Investor presentation</b><span>PPTX · deck</span></a></html>'
        result = metadata.disclose_download_language(source, [doc], 'investisseurs-en.html')
        self.assertIn('<b>Investor presentation — French PPTX</b>', result)

    def test_english_brochure_uses_existing_english_pdf_but_library_retains_both(self):
        docs = [dict(path='/Brochure_EnerTchad.pdf', language='fr', format='PDF'), dict(path='/Brochure_EnerTchad_EN.pdf', language='en', format='PDF')]
        source = '<html lang="en"><a href="/Brochure_EnerTchad.pdf">Download brochure</a></html>'
        self.assertIn('href="/Brochure_EnerTchad_EN.pdf"', metadata.disclose_download_language(source, docs, 'brochure-en.html'))
        self.assertIn('href="/Brochure_EnerTchad.pdf"', metadata.disclose_download_language(source, docs, 'publications-en.html'))

    def test_disclosed_and_french_page_links_stay_unchanged(self):
        docs = [dict(path='/report.pdf', language='fr', format='PDF')]
        for source in ['<html lang="en"><a href="/report.pdf">Report — French PDF</a></html>', '<html lang="fr"><a href="/report.pdf">Rapport</a></html>']:
            self.assertEqual(source, metadata.disclose_download_language(source, docs, 'page.html'))

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

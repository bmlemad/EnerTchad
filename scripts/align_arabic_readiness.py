"""Bring Arabic disclosures and contact access into the reviewed release."""
import html
import re
from pathlib import Path
from align_company_descriptions import transform as descriptions
ROOT = Path(__file__).resolve().parents[1]
FRENCH_DOCUMENTS = {'/Fiche_Investisseur_EnerTchad.pdf', '/Point_Etape_EnerTchad_2026.pdf'}


def transform(text, name):
    if not re.search(r'<html\b[^>]*\blang=["\']ar(?:-[^"\']*)?["\']', text):
        return text
    text = descriptions(text, name)
    def document(match):
        anchor = match[0]
        href = re.search(r'href="([^"]+)"', anchor)
        if href and href[1] in FRENCH_DOCUMENTS and 'بالفرنسية' not in anchor:
            anchor = anchor.replace('</a>', '<span class="et-document-language" lang="ar"> · بالفرنسية</span></a>')
        return anchor
    text = re.sub(r'<a\b[^>]*>.*?</a>', document, text, flags=re.S)
    if name == 'ar-investisseurs.html':
        text = re.sub(r'(<a\b[^>]*href=")/ar-contact("[^>]*>\s*تواصل معنا\s*</a>)', r'\1/ar-contact?profil=invest#ctForm\2', text)
    if name == 'ar-contact.html':
        def form(match):
            tag = match[0]
            if 'aria-labelledby=' not in tag:
                tag = tag[:-1] + ' aria-labelledby="contact-form-title">'
            if 'tabindex=' not in tag:
                tag = tag[:-1] + ' tabindex="-1">'
            return tag
        text = re.sub(r'<form\b[^>]*\bid="ctForm"[^>]*>', form, text, count=1)
        style = '<style id="et-enquiry-access">#ctForm{scroll-margin-top:18rem}#ctForm:focus{outline:2px solid var(--gold,#dbc17b);outline-offset:8px}@media(max-width:760px){#ctForm{scroll-margin-top:14rem}}</style>'
        if 'id="et-enquiry-access"' not in text:
            text = text.replace('</head>', style + '</head>', 1)
        if '/assets/chrome/contact_profiles.js' not in text:
            text = text.replace('</body>', '<script defer src="/assets/chrome/contact_profiles.js?b=2026101310"></script></body>', 1)
    return text


def main():
    count = 0
    for page in ROOT.glob('ar*.html'):
        old = page.read_text(encoding='utf-8')
        new = transform(old, page.name)
        if old != new:
            page.write_text(new, encoding='utf-8')
            count += 1
    print(f'Arabic readiness aligned: {count} pages')

if __name__ == '__main__':
    main()

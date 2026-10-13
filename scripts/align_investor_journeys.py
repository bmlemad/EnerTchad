"""Route investor calls to action to the available enquiry journey."""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'.git', '.next', 'out', 'node_modules', 'public', 'reports', 'qa'}


def transform(text):
    lang = re.search(r'<html\b[^>]*\blang=["\']([^"\']+)', text)
    if not lang or lang[1].split('-')[0] not in ('fr', 'en'):
        return text
    en = lang[1].startswith('en')

    def action(match):
        anchor = match.group()
        href = re.search(r'href=["\']([^"\']+)', anchor)
        if not href or (href[1] != '#souscrire' and not re.search(r'/investisseurs(?:-en)?#souscrire$', href[1])):
            return anchor
        label = html.unescape(re.sub(r'<[^>]+>', ' ', anchor)).strip()
        if not re.search(r'\b(?:Investir|Invest|Subscribe|Souscrire)\b', label):
            return anchor
        destination = re.sub(r'(?:/investisseurs(?:-en)?)?#souscrire$',
                             '/contact-en?profil=invest' if en else '/contact?profil=invest', href[1])
        anchor = anchor.replace(href[1], destination, 1)
        phrases = {
            'Investir': 'Contact investisseurs',
            'Invest': 'Investor contact',
            'Subscribe to the capital': 'Contact investor relations',
            'Subscribe': 'Investor contact',
            'Souscrire au capital': 'Contacter l’équipe investisseurs',
            'Souscrire': 'Contact investisseurs',
            'Passer à l’acte': 'Échanger avec l’équipe',
            'Take action': 'Speak with the team',
            'De 100 M à 10 Md FCFA, par paliers': 'Statut, conditions et prochaines étapes',
            'From FCFA 100 M to 10 bn, in tiers': 'Status, conditions and next steps',
        }
        for old, new in phrases.items():
            anchor = anchor.replace('>' + old + '<', '>' + new + '<')
        return anchor

    return re.sub(r'<a\b[^>]*>.*?</a>', action, text, flags=re.S)


def main():
    count = 0
    for path in ROOT.rglob('*.html'):
        if any(part in EXCLUDED for part in path.relative_to(ROOT).parts):
            continue
        old = path.read_text(encoding='utf-8')
        new = transform(old)
        if new != old:
            path.write_text(new, encoding='utf-8')
            count += 1
    # Native React and generated subsite headers replace their source HTML header.
    # Apply the same available journey to those templates before export.
    for name in ('lib/strategic.jsx', 'scripts/next/subsites.mjs'):
        path = ROOT / name
        old = path.read_text(encoding='utf-8')
        new = old.replace('/investisseurs${suffix}#souscrire', '/contact${suffix}?profil=invest')
        new = new.replace("/investisseurs${en ? '-en' : ''}#souscrire", "/contact${en ? '-en' : ''}?profil=invest")
        new = new.replace("en ? 'Invest' : 'Investir'", "en ? 'Investor contact' : 'Contact investisseurs'")
        if new != old:
            path.write_text(new, encoding='utf-8')
    print(f'Investor enquiry journeys aligned: {count} source pages and both header templates')


if __name__ == '__main__':
    main()

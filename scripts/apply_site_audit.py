"""Apply the confirmed bilingual navigation and catalogue audit corrections."""
import re
from html import unescape
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
FRENCH_TOOLS = {'/configurateur-service-integre', '/amont/calculateur-baril-additionnel'}


def english_links(source):
    def anchor(match):
        opening, body = match.groups()
        href = re.search(r'\bhref=([\"\'])(.*?)\1', opening)
        if not href:
            return match[0]
        target = urlsplit(unescape(href[2]))
        if target.netloc:
            return match[0]
        if target.path.rstrip('/') == '/atlas':
            destination = urlunsplit(target._replace(path='/atlas-en'))
            opening = opening[:href.start(2)] + destination + opening[href.end(2):]
        elif target.path.rstrip('/') in FRENCH_TOOLS:
            text = unescape(re.sub(r'<[^>]*>', ' ', body))
            if not re.search(r'\bin French\b|\(FR\)', text, re.I):
                # Append visible language information without disturbing nested cards or presets.
                body += ' <span class="tool-language">(in French)</span>'
            if not re.search(r'\bhreflang=', opening):
                opening = opening[:-1] + ' hreflang="fr">'
            label = re.search(r'\baria-label=([\"\'])(.*?)\1', opening)
            if label and not re.search(r'\bin French\b|\(FR\)', label[2], re.I):
                opening = opening[:label.end(2)] + ' (in French)' + opening[label.end(2):]
        return opening + body + '</a>'
    parts = re.split(r'(<(?:script|style)\b[^>]*>.*?</(?:script|style)>)', source, flags=re.S | re.I)
    return ''.join(part if re.match(r'<(?:script|style)\b', part, re.I) else
                   re.sub(r'(<a\b[^>]*>)(.*?)</a>', anchor, part, flags=re.S | re.I) for part in parts)


def catalogue(source, en):
    pairs = [
        ('ARSAT price · transparent', 'Pricing confirmed by product'),
        ('at the <b>ARSAT price</b>, delivered within served areas confirmed in the quote.', 'availability, applicable pricing and delivery terms to be confirmed in the quote.'),
        ('at the ARSAT price, delivered within served areas.', 'with availability, applicable pricing and delivery terms to confirm.'),
        ('online quote requests at the ARSAT price.', 'online requests with pricing and terms to confirm by product.'),
        ('with a quote at the ARSAT price.', 'to confirm availability, applicable pricing and terms.'),
    ] if en else [
        ('Prix ARSAT · transparent', 'Prix confirmé selon le produit'),
        ('avec un devis au prix ARSAT.', 'pour confirmer disponibilité, prix applicable et conditions.'),
        ('au <b>prix ARSAT</b>, livrés selon les zones desservies, confirmées dans le devis.', 'disponibilité, prix applicables et conditions de livraison à confirmer dans le devis.'),
        ('au prix ARSAT.', 'avec prix et conditions à confirmer selon le produit.'),
    ]
    for before, after in pairs:
        source = source.replace(before, after)
    return source


def transform(source, path):
    en = path.endswith('-en.html')
    if en:
        source = english_links(source)
    if path in ('aval/boutique.html', 'aval/boutique-en.html'):
        source = catalogue(source, en)
    if path == 'journal-gouvernance-avant-actifs-en.html':
        source = source.replace('/glossaire-petrolier-en#t-itie', '/glossaire-petrolier-en#t-eiti')
    return source


def main():
    changed = 0
    for page in ROOT.rglob('*.html'):
        path = page.relative_to(ROOT)
        if any(part in {'.git', '.next', 'node_modules', 'out', 'public', '.generated', 'reports', 'qa', 'docs-sources'} for part in path.parts):
            continue
        before = page.read_text(encoding='utf-8')
        after = transform(before, path.as_posix())
        if before != after:
            page.write_text(after, encoding='utf-8')
            changed += 1
    print(f'Site audit corrections applied to {changed} pages.')


if __name__ == '__main__':
    main()

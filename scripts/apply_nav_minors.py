"""Close the navigation QA minors of 22 October 2026 (run after apply_nav_majors.py).

Idempotent, run at build time by scripts/apply_readiness_20261013.py:
  1. mobile tap targets >= 44 px: footer links, FR·EN pill and Arabic footer/header
     links (premium-chrome.css block), service header and footer links
     (service-20261013.css block); desktop rules untouched (max-width:760px only);
  2. /investisseurs(-en): aria-current="page" moves from the « Overview » link
     (/investor-center) to the first menu link of the current page;
  3. tchaditude/index and communiques-en: menu and footer copy aligned on the
     standard wording of their language;
  5. nos-activites(-en): the mobile quick bar of their siblings (copied from
     societe(-en), already modernised in the same run).
Item 4 (« EnerConseils : ») lives in scripts/align_engineering_offer.py and item 6
(root-relative footer links in Atlas / Customer space) in scripts/next/subsites.mjs.
Each transform checks the structure it expects and fails loudly when it is missing.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MOBILE = '(max-width:760px)'
N = ''.join(f':not(#n{i})' for i in range(1, 7))
RTL = 'html[dir="rtl"]' + ''.join(f':not(#q{i})' for i in range(27))
TAP = '{min-height:44px!important;min-width:44px!important;display:flex!important;align-items:center!important}'
CHROME_CSS = (f'@media {MOBILE}{{'
              f'html body footer .foot-col a{N},html body footer .pft-contact a{N},html body footer .pft-top{N}{TAP}'
              f'#mLang{N}{{min-height:44px!important}}'
              f'{RTL} footer.pft .pft-contact a,{RTL} footer.pft .foot-legal a{{min-height:44px!important}}'
              f'{RTL} nav.arh-nav a{{min-width:44px!important;justify-content:center!important}}}}')
SERVICE_CSS = (f'@media {MOBILE}{{.svc-top>a,.svc-top nav a,.svc-foot a{{min-height:44px;display:inline-flex;align-items:center}}'
               '.svc-top nav a{min-width:44px;justify-content:center}.svc-foot{row-gap:0}}')
START, END = '/* nav-minors:start */', '/* nav-minors:end */'


def edit(path, transform):
    p = ROOT / path
    old = p.read_text(encoding='utf-8')
    new = transform(old)
    if new != old:
        p.write_text(new, encoding='utf-8')


def css_block(path, rules):
    p = ROOT / path
    css = p.read_text(encoding='utf-8')
    clean = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '', css, flags=re.S)
    new = clean.rstrip('\n') + '\n' + START + rules + END + '\n'
    if new != css:
        p.write_text(new, encoding='utf-8')


def nav_scope(s, transform, label):
    nav = re.search(r'<nav\b[^>]*\bid="nav"[^>]*>.*?</nav>', s, re.S)
    if not nav:
        raise ValueError(label + ': main navigation missing')
    return s[:nav.start()] + transform(nav[0]) + s[nav.end():]


def investors(s, en):
    route = '/investisseurs-en' if en else '/investisseurs'
    overview = '/investor-center-en' if en else '/investor-center'
    def fix(nav):
        nav = re.sub(r'(<a class="pn-all" href="' + re.escape(overview) + r'") aria-current="page"', r'\1', nav)
        if re.search(r'<a\b[^>]*aria-current="page"', nav):
            return nav
        target = re.compile(r'<a href="' + re.escape(route) + r'(#[^"]*)?">')
        if not target.search(nav):
            raise ValueError(route + ': no menu link to the current page')
        return target.sub(lambda m: m[0][:-1] + ' aria-current="page">', nav, count=1)
    return nav_scope(s, fix, route)


def replace_scoped(s, pattern, old, new, label):
    m = re.search(pattern, s, re.S)
    if not m:
        raise ValueError(label + ': scope missing')
    block = m[0]
    if new in block and old not in block:
        return s
    if block.count(old) != 1:
        raise ValueError(f'{label}: expected one « {old} », found {block.count(old)}')
    return s[:m.start()] + block.replace(old, new, 1) + s[m.end():]


def tchaditude(s):
    return replace_scoped(s, r'<nav\b[^>]*\bid="nav"[^>]*>.*?</nav>',
                          '<strong>Académie Tchaditude</strong><em>Former avant d’extraire</em>',
                          '<strong>Académie Tchaditude</strong><em>Transfert de compétences, relève</em>', 'tchaditude/index')


def communiques_en(s):
    s = replace_scoped(s, r'<nav\b[^>]*\bid="nav"[^>]*>.*?</nav>',
                       'with Chadian capital, being incorporated in N’Djamena.',
                       'with Chadian capital, in formation, based in N’Djamena.', 'communiques-en menu')
    s = replace_scoped(s, r'<footer\b.*?</footer>', '<p class="pft-motto">From source rock to pump.</p>',
                       '<p class="pft-motto">From source rock to the pump.</p>', 'communiques-en motto')
    return replace_scoped(s, r'<footer\b.*?</footer>', 'with Chadian capital, from source rock to pump.</p>',
                          'with Chadian capital, from source rock to the pump.</p>', 'communiques-en footer')


def quick_bar(page, reference):
    bar = re.search(r'<nav\b[^>]*\bid="nezBar"[^>]*>.*?</nav>', (ROOT / reference).read_text(encoding='utf-8'), re.S)
    if not bar or len(re.findall(r'<a\b', bar[0])) != 3:
        raise ValueError(reference + ': modern quick bar missing')
    def add(s):
        if 'id="nezBar"' in s:
            return s
        if s.count('</body>') != 1:
            raise ValueError(page + ': body end not found exactly once')
        return s.replace('</body>', bar[0] + '\n</body>', 1)
    edit(page, add)


def main():
    css_block('assets/chrome/premium-chrome.css', CHROME_CSS)
    css_block('assets/chrome/service-20261013.css', SERVICE_CSS)
    edit('investisseurs.html', lambda s: investors(s, False))
    edit('investisseurs-en.html', lambda s: investors(s, True))
    edit('tchaditude/index.html', tchaditude)
    edit('communiques-en.html', communiques_en)
    quick_bar('nos-activites.html', 'societe.html')
    quick_bar('nos-activites-en.html', 'societe-en.html')
    print('Navigation QA minors aligned: tap targets, investor current page, standard labels, activities quick bar')


if __name__ == '__main__':
    main()

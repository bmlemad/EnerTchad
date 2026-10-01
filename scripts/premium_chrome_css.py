# -*- coding: utf-8 -*-
"""Genere assets/chrome/premium-chrome.css : style premium de l en-tete et du pied de page.

Les feuilles historiques ciblent la navigation avec des selecteurs tres specifiques
(jusqu a neuf identifiants, souvent !important). Plutot que de les retoucher une a une,
chaque regle premium est prefixee d une chaine de :not(#id) qui lui donne la priorite,
et les proprietes disputees portent !important. Le prefixe est ajoute ici pour garder
la source lisible.

Usage : python3 scripts/premium_chrome_css.py
"""
NOTS = ''.join(f':not(#p{i})' for i in range(24))
P = f'html{NOTS} #nav.pn'          # navigation
F = f'html{NOTS} footer.pft'       # pied de page
D = f'html:not(.et-plight){NOTS}'  # theme sombre

SRC = r'''
/* En-tete et pied de page premium : marine, blanc, or en filet. Polices du site. */
@font-face{font-family:"Instrument Serif";src:url("/assets/fonts/InstrumentSerif-latin.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"National Park";src:url("/assets/fonts/NationalPark-Bold-latin.woff2") format("woff2");font-weight:700;font-display:swap}

@P{--pn-bg:#FFFFFF;--pn-ink:#0A1A2F;--pn-ink2:#4B5870;--pn-line:#E3E6EB;--pn-gold:#B8913A;--pn-gold-ink:#7A5A12;--pn-mist:#F4F5F7;
  --pn-serif:"Instrument Serif","Iowan Old Style",Georgia,serif;--pn-sans:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif}
@D #nav.pn{--pn-bg:#0A1422;--pn-ink:#F1F3F6;--pn-ink2:#A9B4C4;--pn-line:#22314A;--pn-gold:#D9B567;--pn-gold-ink:#D9B567;--pn-mist:#0F1B2C}

@P{background:var(--pn-bg)!important;border:0!important;border-bottom:1px solid var(--pn-line)!important;box-shadow:none!important;
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important;color:var(--pn-ink)!important;font-family:var(--pn-sans)!important}
@P::before,@P::after{display:none!important}
@P .nx-util{background:var(--pn-bg)!important;border-bottom:1px solid var(--pn-line)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
@P .nx-util-in{gap:22px!important;height:36px!important;font-size:.8rem!important}
@P .nx-util-in>a{color:var(--pn-ink2)!important;font-weight:500!important;letter-spacing:.01em!important;border:0!important;background:none!important;padding:0!important;min-height:0!important}
@P .nx-util-in>a:hover{color:var(--pn-ink)!important}
@P .nx-util-in .nx-lang b{color:var(--pn-ink)!important}
@P .nx-util-in .nx-invest{background:var(--pn-ink)!important;color:var(--pn-bg)!important;border-radius:0!important;padding:7px 16px!important;font-weight:600!important;letter-spacing:.04em!important}
@P .nx-util-in .nx-invest:hover{background:var(--pn-gold-ink)!important;color:#fff!important}
@P .nav-in.nx-bar{background:transparent!important;border:0!important;box-shadow:none!important;min-height:76px!important}
@P .brand-tx{color:var(--pn-ink)!important;font-family:"National Park",var(--pn-sans)!important;letter-spacing:.01em!important}
@P .brand-tx .s{color:var(--pn-ink)!important}
@P .brand-tx small{color:var(--pn-ink2)!important;letter-spacing:.14em!important}
@P .nav-cta button{color:var(--pn-ink)!important;background:transparent!important;border-color:var(--pn-line)!important}
@P .nav-tog .bz{background:var(--pn-ink)!important}
@P #mLang{background:transparent!important;color:var(--pn-ink)!important;-webkit-text-fill-color:var(--pn-ink)!important;border:1px solid var(--pn-line)!important}
@P #mLang b{color:var(--pn-ink)!important;-webkit-text-fill-color:var(--pn-ink)!important}

@media (min-width:1241px){
  @P .nav-in.nx-bar,@P #navLinks,@P .pn-item{position:static!important}
  @P #navLinks{gap:2px!important;margin-left:auto!important}
  @P .pn-item>.nav-trigger{font:500 15px/1 var(--pn-sans)!important;color:var(--pn-ink)!important;background:none!important;border:0!important;
    border-radius:0!important;padding:0 14px!important;min-height:76px!important;height:76px!important;box-shadow:none!important;letter-spacing:.005em!important;opacity:1!important;white-space:nowrap!important}
  @P .pn-item>.nav-trigger svg{opacity:.55!important;width:10px!important;height:10px!important;margin-left:6px!important}
  @P .pn-item>.nav-trigger:hover,@P .pn-item>.nav-trigger[aria-expanded="true"],@P .pn-item.open>.nav-trigger,@P .pn-item>.nav-trigger.is-active{box-shadow:inset 0 -2px 0 var(--pn-gold)!important;background:none!important;color:var(--pn-ink)!important}

  @P .pn-mega{position:absolute!important;top:100%!important;left:0!important;right:0!important;width:auto!important;min-width:0!important;max-width:none!important;max-height:none!important;
    overflow:visible!important;translate:none!important;transform:none!important;border-radius:0!important;margin:0!important;
    background:var(--pn-bg)!important;border:0!important;border-top:1px solid var(--pn-line)!important;border-bottom:1px solid var(--pn-line)!important;
    box-shadow:0 40px 60px -40px rgba(10,26,47,.35)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;
    display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.7fr) minmax(0,1fr)!important;gap:56px!important;
    padding:44px max(32px,calc((100vw - 1200px)/2)) 52px!important}
  @P .pn-mega::before,@P .pn-mega::after{display:none!important}
  @P .pn-mega,@P .pn-mega *{transition:none!important;animation:none!important}
  @P .pn-mega .nx-col{grid-column:auto!important;grid-row:auto!important;padding:0!important;margin:0!important;border:0!important;background:none!important;min-width:0!important}
  @P .pn-intro .nxh{font:400 2.4rem/1.02 var(--pn-serif)!important;color:var(--pn-ink)!important;text-transform:none!important;letter-spacing:-.01em!important;margin:0 0 16px!important;min-height:0!important;display:block!important;border:0!important;padding:0!important}
  @P .pn-intro .pn-d{color:var(--pn-ink2)!important;font-size:.98rem!important;line-height:1.6!important;margin:0 0 22px!important}
  @P .pn-intro .pn-all{min-height:0!important;align-items:center!important;display:inline-flex!important;padding:0 0 6px!important;border-bottom:1px solid var(--pn-gold)!important;border-radius:0!important;background:none!important;transform:none!important}
  @P .pn-intro .pn-all strong{font:500 .95rem/1 var(--pn-sans)!important;color:var(--pn-ink)!important}
  @P .pn-intro .pn-all strong::after{content:" →"}
  @P .pn-intro .pn-all em{display:none!important}
  @P .pn-links{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:36px!important;align-content:start!important}
  @P .pn-links a{display:block!important;padding:13px 0!important;border-top:1px solid var(--pn-line)!important;border-radius:0!important;background:none!important;transform:none!important;box-shadow:none!important;min-height:0!important}
  @P .pn-links a::after{display:none!important}
  @P .pn-links a strong{font:600 .95rem/1.3 var(--pn-sans)!important;color:var(--pn-ink)!important}
  @P .pn-links a em{font:400 .82rem/1.4 var(--pn-sans)!important;color:var(--pn-ink2)!important;margin-top:3px!important;display:block!important}
  @P .pn-links a:hover strong,@P .pn-links a[aria-current="page"] strong{color:var(--pn-gold-ink)!important}
  @P .pn-links a[aria-current="page"]{padding-left:0!important;box-shadow:inset 0 2px 0 var(--pn-gold)!important}
  @P .pn-feat{display:flex!important;flex-direction:column!important;justify-content:flex-end!important;gap:8px!important;min-height:220px!important;
    grid-column:auto!important;grid-row:auto!important;padding:28px!important;border:0!important;border-top:2px solid var(--pn-gold)!important;border-radius:0!important;
    background:var(--pn-mist)!important;background-image:none!important;transform:none!important;color:var(--pn-ink)!important;text-decoration:none!important}
  @P .pn-feat .tag{font:600 .7rem/1 var(--pn-sans)!important;letter-spacing:.2em!important;text-transform:uppercase!important;color:var(--pn-gold-ink)!important}
  @P .pn-feat strong{font:400 1.75rem/1.08 var(--pn-serif)!important;color:var(--pn-ink)!important;margin:6px 0 0!important}
  @P .pn-feat em{font:400 .88rem/1.5 var(--pn-sans)!important;color:var(--pn-ink2)!important}
  @P .pn-feat .arr{color:var(--pn-gold-ink)!important;font-size:1.1rem!important;margin-top:6px!important}
  @P .pn-feat:hover strong{color:var(--pn-gold-ink)!important}
}

@media (max-width:1240px){
  @P #navLinks.open,@P #navLinks{background:var(--pn-bg)!important;color:var(--pn-ink)!important}
  @P .pn-item{border-bottom:1px solid var(--pn-line)!important;background:none!important;border-radius:0!important}
  @P .pn-item>.nav-trigger{font:500 1.05rem/1.2 var(--pn-sans)!important;color:var(--pn-ink)!important;background:none!important;padding:18px 4px!important;border:0!important;border-radius:0!important;box-shadow:none!important}
  @P .pn-item>.nav-trigger::after,@P .pn-item>.nav-trigger::before{display:none!important}
  @P .pn-mega{background:none!important;border:0!important;box-shadow:none!important;padding:0 4px 14px!important}
  @P .pn-intro .nxh,@P .pn-intro .pn-d,@P .pn-feat{display:none!important}
  @P .pn-mega a{padding:10px 0!important;background:none!important;border-radius:0!important}
  @P .pn-mega a strong{color:var(--pn-ink)!important;font-weight:500!important}
  @P .pn-mega a em{color:var(--pn-ink2)!important}
  @P .pn-intro .pn-all em{display:none!important}
  @P .pn-intro .pn-all strong{color:var(--pn-gold-ink)!important}
  @P .nx-util-m a{color:var(--pn-ink2)!important}
  @P .nx-util-m a.cta{background:var(--pn-ink)!important;color:var(--pn-bg)!important;border-radius:0!important}
}

/* Pied de page nuit, identique dans les deux themes */
@F{--pf-bg:#07111F;--pf-ink:#F3F1EC;--pf-ink2:#A7B1C2;--pf-line:rgba(255,255,255,.14);--pf-gold:#D9B567;
  background:var(--pf-bg)!important;color:var(--pf-ink2)!important;border:0!important;box-shadow:none!important;padding:0!important;margin-top:0!important}
@F::before,@F::after{display:none!important}
@F .wrap{padding-top:88px!important;padding-bottom:36px!important}
@F .pft-motto{font:400 clamp(2.6rem,6vw,5.2rem)/.98 "Instrument Serif","Iowan Old Style",Georgia,serif!important;color:#fff!important;letter-spacing:-.015em!important;margin:0 0 56px!important;max-width:16ch}
@F .foot-news{background:none!important;border:0!important;border-top:1px solid var(--pf-line)!important;border-bottom:1px solid var(--pf-line)!important;border-radius:0!important;box-shadow:none!important;padding:28px 0!important;margin:0 0 56px!important}
@F .foot-news .fn-k{color:var(--pf-gold)!important;letter-spacing:.2em!important;font-size:.7rem!important}
@F .foot-news .fn-t{color:var(--pf-ink)!important;font:400 1.7rem/1.15 "Instrument Serif",Georgia,serif!important}
@F .foot-news .fn-d,@F .foot-news .fn-alt{color:var(--pf-ink2)!important}
@F .foot-news .fn-alt a{color:var(--pf-ink)!important;text-decoration:underline!important;text-underline-offset:3px!important}
@F .foot-news .fn-form{display:flex!important;flex-wrap:wrap!important;gap:12px!important;align-items:stretch!important;margin:16px 0 10px!important;max-width:560px!important}
@F .foot-news input{flex:1 1 240px!important;min-height:48px!important;padding:12px 2px!important;font-size:1rem!important;background:transparent!important;color:var(--pf-ink)!important;-webkit-text-fill-color:var(--pf-ink)!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.4)!important;border-radius:0!important}
@F .foot-news input::placeholder{color:var(--pf-ink2)!important;-webkit-text-fill-color:var(--pf-ink2)!important}
@F .foot-news button{min-height:48px!important;padding:12px 24px!important;font-size:.95rem!important;background:var(--pf-gold)!important;color:#07111F!important;-webkit-text-fill-color:#07111F!important;border:0!important;border-radius:0!important;font-weight:600!important}
@F .foot-grid{display:grid!important;grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,1fr))!important;gap:48px!important;border:0!important;padding:0!important;margin:0 0 56px!important}
@F .foot-brand .brand-tx,@F .foot-brand .brand-tx .s{color:#fff!important}
@F .foot-brand .brand-tx small{color:var(--pf-ink2)!important}
@F .foot-desc{color:var(--pf-ink2)!important;max-width:34ch;margin:18px 0!important}
@F .pft-contact a{display:block!important;color:var(--pf-ink)!important;text-decoration:none!important;padding:3px 0!important;font-size:.95rem!important}
@F .foot-social{margin-top:18px!important;display:flex!important;gap:10px!important}
@F .foot-social a svg{opacity:1!important;color:var(--pf-ink)!important;fill:currentColor!important}
@F .foot-social a{opacity:1!important;color:var(--pf-ink)!important;border:1px solid var(--pf-line)!important;border-radius:0!important;background:none!important}
@F .foot-col{border:0!important;background:none!important;padding:0!important}
@F .foot-col h3::before,@F .foot-col h3::after,@F .foot-legal::before,@F .foot-legal::after,@F .foot-grid::before,@F .foot-grid::after{display:none!important}
@F .foot-col h3{font:600 .7rem/1 "Inter",system-ui,sans-serif!important;letter-spacing:.22em!important;text-transform:uppercase!important;color:var(--pf-gold)!important;margin:0 0 18px!important;border:0!important;padding:0!important}
@F .foot-col h3 button{font:inherit!important;letter-spacing:inherit!important;text-transform:inherit!important;color:var(--pf-gold)!important;-webkit-text-fill-color:var(--pf-gold)!important;background:none!important;border:0!important;padding:10px 0!important;width:100%!important;text-align:left!important;min-height:44px!important}
@F .foot-col a{display:block!important;color:var(--pf-ink)!important;text-decoration:none!important;padding:7px 0!important;font-size:.95rem!important;background:none!important}
@F .foot-col a:hover,@F .pft-contact a:hover,@F .foot-legal a:hover{color:var(--pf-gold)!important}
@F .foot-legal{display:flex!important;flex-wrap:wrap!important;justify-content:space-between!important;gap:14px 28px!important;border-top:1px solid var(--pf-line)!important;padding:24px 0 0!important;margin:0!important;color:var(--pf-ink2)!important;font-size:.82rem!important;background:none!important}
@F .foot-legal-links{display:flex!important;flex-wrap:wrap!important;gap:8px 20px!important}
@F .foot-legal a{color:var(--pf-ink2)!important;text-decoration:none!important}
@F .pft-legal{max-width:70ch;color:var(--pf-ink2)!important;-webkit-text-fill-color:var(--pf-ink2)!important}
@media (max-width:900px){
  @F .foot-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  @F .foot-brand{grid-column:1/-1}
}
@media (max-width:560px){
  @F .wrap{padding-top:64px!important}
  @F .foot-grid{grid-template-columns:minmax(0,1fr)!important;gap:36px!important}
}
'''


def main():
    out = SRC.replace('@P', P).replace('@F', F).replace('@D', D).strip() + '\n'
    open('assets/chrome/premium-chrome.css', 'w', encoding='utf-8').write(out)
    print(len(out), 'octets')


if __name__ == '__main__':
    main()

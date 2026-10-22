"""Close the six October 22 comparative QA findings after existing migrations."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def save(path, transform):
 p=ROOT/path; old=p.read_text(); new=transform(old)
 if new!=old:p.write_text(new)
def products(s,en):
 lead=('Planned fuels, LPG, lubricants and bitumen range. Supply sources and distribution remain subject to confirmation; local refining is a future project, conditional on studies, permits and financing.' if en else 'Gamme envisagée de carburants, GPL, lubrifiants et bitume. Approvisionnement et distribution restent à confirmer ; le raffinage local est un projet futur, soumis aux études, autorisations et financements.')
 s=re.sub(r'(<p class="pp-sublead">).*?(</p>)',lambda m:m[1]+lead+m[2],s,count=1,flags=re.S)
 s=s.replace('A range <em>built to international standards</em>.','A planned range, <em>specifications to confirm</em>.').replace('Une gamme <em>aux normes internationales</em>.','Une gamme envisagée, <em>des spécifications à confirmer</em>.')
 s=s.replace('The mini-refinery: where our products come from.','Local refining: a future project.').replace('La mini-raffinerie\u00a0: d’où viennent nos produits.','Le raffinage local : un projet futur.')
 # Keep search/social excerpts aligned with the immediately visible status.
 s=re.sub(r'(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*',lambda m:m[1]+lead,s)
 s=re.sub(r'("@type":"WebPage"[^<]*?"description":")[^"]*',lambda m:m[1]+lead,s)
 return s
def contact(s):
 return re.sub(r'<option\b([^>]*)>([^<]*(?:Ingénierie / services amont|Engineering / upstream services)[^<]*)</option>',lambda m:'<option'+re.sub(r'\sdata-contact-profile="[^"]*"','',m[1])+' data-contact-profile="ep">'+m[2]+'</option>',s)
def catalogue(s,en):
 pairs=([
 ('Order energy, in a few clicks.','Prepare your quote request.'),
 ('Ordering designed for Chad','A request designed for Chad'),
 ('Validate the order and your preferred delivery slot.','Specify your request and preferred delivery slot.'),
 ('Quote · no-commitment pre-order','Quote request · no commitment'),
 ('EnerTchad Shop · Order online','EnerTchad · Prepare a quote request'),
 ('My order','My quote request'),('Your order is empty.','Your request is empty.'),
 ('your pre-order','your quote request'),
 ('An order designed for Chad','A request designed for Chad'),
 ('Confirm the order and your preferred delivery slot.','Specify your request and preferred delivery slot.'),
 ('Place your order','Prepare your request')
 ] if en else [
 ('Commander l’énergie, en quelques clics.','Préparer votre demande de devis.'),
 ('Devis · pré-commande sans engagement','Demande de devis · sans engagement'),
 ('Ma commande','Ma demande de devis'),('Votre commande est vide.','Votre demande est vide.'),
 ('votre pré-commande','votre demande de devis'),
 ('Une commande pensée pour le Tchad','Une demande pensée pour le Tchad'),
 ('Validez la commande et le créneau de livraison souhaité.','Précisez votre demande et le créneau de livraison souhaité.'),
 ('Passez commande','Préparez votre demande')
 ])
 for a,b in pairs:s=s.replace(a,b)
 return s
def projects(s,en):
 note=('<span data-project-evidence="unpublished"><strong>No project-specific milestone evidence published.</strong><br>General programme presentation; these links do not substantiate a project milestone.<br>Evidence review: 22 October 2026.</span><br>' if en else '<span data-project-evidence="unpublished"><strong>Aucune pièce spécifique au jalon de ce projet n’est publiée.</strong><br>Présentation générale du programme ; ces liens ne justifient pas un jalon du projet.<br>Revue des justificatifs : 22 octobre 2026.</span><br>')
 def section(m):
  block=m[0]
  block=re.sub(r'<span data-project-evidence="unpublished">.*?</span><br>', '', block, flags=re.S)
  return block.replace('<a href="/Point_Etape_EnerTchad_2026.pdf">',note+'<a href="/Point_Etape_EnerTchad_2026.pdf">').replace('>Published evidence</summary>','>Evidence &amp; programme documents</summary>').replace('>Supports publics</summary>','>Justificatifs &amp; documents du programme</summary>')
 return re.sub(r'<section id="avancement".*?</section>',section,s,count=1,flags=re.S)
for en in [False,True]:
 suf='-en' if en else ''
 save('aval/produits'+suf+'.html',lambda s:products(s,en))
 save('contact'+suf+'.html',contact)
 save('aval/boutique'+suf+'.html',lambda s:catalogue(s,en))
 save('projets'+suf+'.html',lambda s:projects(s,en))

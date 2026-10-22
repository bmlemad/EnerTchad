"""Homepage review: clearer journeys and source-backed programme information."""
from pathlib import Path
from html import escape, unescape
import re
ROOT=Path(__file__).resolve().parents[1]
def plain(s):return unescape(re.sub(r'<[^>]+>','',s)).strip()
def section(s,identity):
 m=re.search(r'<section\b[^>]*(?:id|aria-labelledby)="'+re.escape(identity)+r'"[^>]*>.*?</section>',s,re.S)
 if not m:raise ValueError('Missing homepage section: '+identity)
 return m[0]
def progress(en):
 s=(ROOT/('projets-en.html' if en else 'projets.html')).read_text()
 table=re.search(r'<table class="et-project-table">.*?</table>',s,re.S)[0]
 date=re.search(r'(?:reviewed on|revues le) (\d+) (October|octobre) (\d{4})',s)
 if not date:raise ValueError('Project review date missing')
 day,_,year=date.groups();iso=f'{year}-10-{int(day):02d}'
 label=f'{int(day)} October {year}' if en else f'{int(day)} octobre {year}'
 rows=re.findall(r'<tr>(.*?)</tr>',table,re.S)[1:]
 cards=[]
 for i in [0,3,4]:
  cells=re.findall(r'<(?:td|th)\b[^>]*>(.*?)</(?:td|th)>',rows[i],re.S)
  if len(cells)!=4:raise ValueError('Project table changed')
  title,status,condition=map(plain,cells[:3])
  cards.append(f'<article class="hm-card"><p class="hm-status">{escape(status)}</p><h3>{escape(title)}</h3><p><b>{"Next condition" if en else "Prochaine condition"}</b><br>{escape(condition)}</p><p class="hm-meta">{"Published status" if en else "État publié"} · <time datetime="{iso}">{label}</time></p><p class="hm-meta">{"Project-specific milestone evidence not published." if en else "Pièce spécifique au jalon non publiée."}</p></article>')
 return ''.join(cards)
def home(s,en):
 suf='-en' if en else '';client='/boutique/en/clients' if en else '/boutique/clients'
 figure=re.search(r'<figure class="et-hero-media">.*?</figure>',s,re.S)[0]
 chain=section(s,'chaine');team=section(s,'mod-equipe')
 # Keep industrial routes, image attributions and the original named governance.
 chain=chain.replace('Découvrez les activités envisagées. Leur présentation ne signifie pas qu’elles sont en exploitation. Les photographies sont des illustrations, pas des installations d’EnerTchad.','Quatre segments envisagés pour relier la ressource aux besoins du pays. Photographies d’illustration, hors installations d’EnerTchad.')
 chain=chain.replace('Explore the planned activities. Their presentation does not mean they are operating. The photographs are illustrations, not EnerTchad facilities.','Four planned segments connecting resources with the country’s needs. Illustrative photographs, not EnerTchad facilities.')
 article=(ROOT/('journal-gouvernance-avant-actifs'+suf+'.html')).read_text()
 published=re.search(r'"datePublished":"(\d{4}-\d{2}-\d{2})"',article)[1]
 if published!='2026-10-22':raise ValueError('Review the selected article publication date')
 # A sources-access date is explicitly not represented as an HSE publication date.
 hse=(ROOT/('cadre-hse'+suf+'.html')).read_text()
 source_date='Sources accessed on 22 October 2026.' if en else 'Sources consultées le 22 octobre 2026.'
 if source_date not in hse:raise ValueError('Review HSE source date')
 title='Developing an integrated energy value chain in Chad.' if en else 'Développer au Tchad une chaîne énergétique intégrée.'
 lead=('Professional supply, engineering and development partnerships: share your requirements and explore the proposed oil programme.' if en else 'Approvisionnement professionnel, ingénierie et partenariats : présentez votre besoin et découvrez les étapes du programme pétrolier envisagé.')
 note=('Company in formation. Proposed activities remain conditional on studies, approvals, financing and partnerships.' if en else 'Société en constitution. Activités envisagées, sous réserve d’études, d’autorisations, de financements et de partenariats.')
 hero=f'<header class="et-hero" id="top">{figure}<div class="et-inner"><p class="et-kicker">EnerTchad · N’Djamena</p><h1 id="ph-h1">{title}</h1><p class="mod-signature">{"From source rock to the pump." if en else "De la roche-mère à la pompe."}</p><p class="et-lead">{lead}</p><p class="hm-note">{note} <a href="/avertissements{suf}">{"Status and limitations" if en else "Statut et limites"}</a>.</p><div class="et-actions"><a class="et-primary" href="#besoin-client">{"Discuss a business requirement" if en else "Présenter un besoin professionnel"}</a><a class="et-secondary" href="/projets{suf}#avancement">{"Projects and status" if en else "Projets et avancement"} <span aria-hidden="true">→</span></a></div></div></header>'
 offers=([
 ('Professional supply','Product, recurring volumes, sites and purchasing schedule.','industriels','b2b'),
 ('Fleet management','Vehicle access, consumption tracking and proposed service area.','flottes','b2b'),
 ('Engineering & technical services','Study, design, technical assistance or project monitoring.','operateurs','ep')
 ] if en else [
 ('Approvisionnement professionnel','Produit, volumes récurrents, sites et calendrier d’achat.','industriels','b2b'),
 ('Gestion des flottes','Droits par véhicule, suivi des consommations et zone de service envisagée.','flottes','b2b'),
 ('Ingénierie & services techniques','Étude, conception, assistance technique ou suivi de projets.','operateurs','ep')
 ])
 cards=''.join(f'<article class="hm-card"><p class="hm-step" aria-hidden="true">0{i+1}</p><h3>{escape(t)}</h3><p>{escape(d)}</p><a href="{client}#{a}">{"Explore this offer" if en else "Découvrir cette offre"} <span aria-hidden="true">→</span></a><a class="hm-contact" href="/contact{suf}?profil={profile}#ctForm" aria-label="{escape(("Discuss: " if en else "Présenter un besoin : ")+t,quote=True)}">{"Discuss this requirement" if en else "Présenter ce besoin"}</a></article>' for i,(t,d,a,profile) in enumerate(offers))
 business=f'<section id="besoin-client" aria-labelledby="home-business-title"><div class="et-inner"><p class="hm-eyebrow">{"For your business" if en else "Pour votre activité"}</p><h2 id="home-business-title">{"Three requirements. The right contact." if en else "Trois besoins. Le bon interlocuteur."}</h2><p id="commercial-scope">{"Proposed launch: qualify recurring professional demand first. Scope, supply, service area and commercial terms are confirmed for each request." if en else "Lancement envisagé : qualifier d’abord les besoins professionnels récurrents. Périmètre, approvisionnement, zone desservie et conditions sont à confirmer pour chaque demande."}</p><div class="hm-grid">{cards}</div></div></section>'
 milestones=f'<section class="et-tinted" id="home-progress" aria-labelledby="et-progress-title"><div class="et-inner"><p class="hm-eyebrow">{"Published programme" if en else "Programme publié"}</p><h2 id="et-progress-title">{"Where do the projects stand?" if en else "Où en sont les projets ?"}</h2><p>{"These are published objectives and conditions, not completed operating milestones." if en else "Ces repères présentent des objectifs et conditions publiés, pas des jalons d’exploitation réalisés."}</p><div class="hm-grid">{progress(en)}</div><p><a href="/projets{suf}#avancement">{"Read all project statuses and supporting documents" if en else "Consulter tous les statuts et documents associés"} <span aria-hidden="true">→</span></a></p></div></section>'
 target=f'<section id="programme-cible" aria-labelledby="programme-cible-title"><div class="et-inner hm-target"><div><p class="hm-eyebrow">{"2030 internal target" if en else "Cible interne · horizon 2030"}</p><h2 id="programme-cible-title">{"Develop local sourcing" if en else "Développer les achats locaux"}</h2><p>{"80% of purchases sourced in Chad is a target, not a measured result. Scope and measurement method must be specified before reporting performance." if en else "80 % d’achats sourcés au Tchad : un objectif, pas un résultat mesuré. Le périmètre et la méthode de mesure sont à préciser avant le suivi des résultats."}</p></div><a href="/cibles-2030{suf}">{"Target framework and conditions" if en else "Cadre et conditions de la cible"} <span aria-hidden="true">→</span></a></div></section>'
 safety=f'<section class="et-tinted" id="home-hse" aria-labelledby="home-hse-title"><div class="et-inner hm-split"><div><p class="hm-eyebrow">{"Safety & preparation" if en else "Sécurité & préparation"}</p><h2 id="home-hse-title">{"Rules before the first worksite" if en else "Des règles avant le premier chantier"}</h2><p>{"The published HSE framework sets out stop-work rights, work permits and the indicators intended for future worksites. Certifications and operational performance remain separate matters." if en else "Le cadre HSE publié présente le droit d’arrêt, les permis de travail et les indicateurs prévus pour les futurs chantiers. Certifications et résultats opérationnels doivent être établis séparément."}</p><a href="/cadre-hse{suf}">{"Read the HSE framework" if en else "Consulter le cadre HSE"} <span aria-hidden="true">→</span></a></div><div><h3>{"Evidence and accountability" if en else "Justificatifs et responsabilités"}</h3><p>{"Future reporting must state the period, scope, hours worked and calculation method. No worksite results are claimed today." if en else "Le futur reporting devra préciser période, périmètre, heures travaillées et méthode de calcul. Aucun résultat de chantier n’est affirmé à ce jour."}</p><a href="/ethique{suf}">{"Ethics and reporting a concern" if en else "Éthique et signalement"}</a></div></div></section>'
 news=f'<section id="home-publications" aria-labelledby="ph-trust"><div class="et-inner"><p class="hm-eyebrow">{"Documents & updates" if en else "Documents & mises à jour"}</p><h2 id="ph-trust">{"Published information, with dates" if en else "Des informations publiées et datées"}</h2><div class="hm-grid hm-two"><article class="hm-card"><p class="hm-meta">{"Article published" if en else "Article publié"} · <time datetime="{published}">{"22 October 2026" if en else "22 octobre 2026"}</time></p><h3>{"Governance before assets" if en else "Une gouvernance avant les actifs"}</h3><p>{"Who decides, who oversees and what is published at the formation stage." if en else "Qui décide, qui contrôle et ce qui est publié au stade de constitution."}</p><a href="/journal-gouvernance-avant-actifs{suf}">{"Read the article" if en else "Lire le carnet"} <span aria-hidden="true">→</span></a></article><article class="hm-card"><p class="hm-meta">{"Sources reviewed" if en else "Sources consultées"} · <time datetime="2026-10-22">{"22 October 2026" if en else "22 octobre 2026"}</time></p><h3>{"The HSE measurement framework" if en else "Le cadre de mesure HSE"}</h3><p>{"Definitions, proposed reporting and source references for future operations." if en else "Définitions, reporting envisagé et références pour les futures opérations."}</p><a href="/cadre-hse{suf}#sources">{"Consult the sources" if en else "Consulter les sources"} <span aria-hidden="true">→</span></a></article></div><div class="et-inline-links"><a href="/publications{suf}">{"All public documents" if en else "Tous les documents publics"}</a><a href="/communiques{suf}">{"Official releases" if en else "Communiqués officiels"}</a><a href="/atlas/">{"Sector atlas" if en else "Atlas du secteur"}</a></div></div></section>'
 paths=f'<section class="et-tinted" aria-labelledby="et-paths-title"><div class="et-inner"><h2 id="et-paths-title">{"Continue with the right team" if en else "Poursuivre avec le bon interlocuteur"}</h2><div class="et-paths"><a href="/investor-center{suf}"><b>{"Investors & partners" if en else "Investisseurs & partenaires"}</b><span>{"Status, assumptions, risks and public documents." if en else "Statut, hypothèses, risques et documents publics."}</span></a><a href="/achats{suf}"><b>{"Suppliers" if en else "Fournisseurs"}</b><span>{"Introduce your company and request registration." if en else "Présenter votre entreprise et demander un référencement."}</span></a><a href="/contact{suf}#ctForm"><b>Contact</b><span>{"Discuss another requirement with the team." if en else "Présenter un autre besoin à l’équipe."}</span></a></div><p><a href="/carrieres{suf}">{"Careers and skills" if en else "Carrières et compétences"}</a></p></div></section>'
 body=f'<main id="main-content" tabindex="-1" class="et-home hm-review">{hero}{business}{milestones}{chain}{target}{team}{safety}{news}{paths}</main>'
 return re.sub(r'<main\b[^>]*>.*?</main>',lambda _:body,s,count=1,flags=re.S)
def main():
 for en in [False,True]:
  p=ROOT/('index-en.html' if en else 'index.html');s=p.read_text();p.write_text(home(s,en))
if __name__=='__main__':main()

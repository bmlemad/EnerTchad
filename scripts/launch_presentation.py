"""Maintain launch presentation and published status in both languages."""
import re

def launch_presentation(text, name, en):
    search = name in ('recherche.html', 'recherche-en.html')
    strategic = name in ('nos-activites.html','nos-activites-en.html','projets.html','projets-en.html','gouvernance.html','gouvernance-en.html','investor-center.html','investor-center-en.html')
    if search or strategic:
        sheet = 'search' if search else 'publication-status'
        link = f'<link rel="stylesheet" href="/assets/chrome/{sheet}.css?b=2026100702"/>'
        text = re.sub(r'/assets/chrome/' + sheet + r'\.css\?b=\d+', '/assets/chrome/' + sheet + '.css?b=2026100702', text)
        if link not in text:
            text = text.replace('</head>', link + '\n</head>', 1)
    if strategic:
        title = 'Status and published documents' if en else 'Statut et documents publiés'
        status = ('EnerTchad is in formation. The industrial segments and projects describe a target programme. Implementation depends on financing, permits and formalised partnerships.' if en else 'EnerTchad est en constitution. Les segments industriels et les projets décrivent un programme cible. Leur réalisation dépend des financements, des autorisations et des partenariats formalisés.')
        caveat = ('Published company documents describe the programme; they do not establish that an asset is operating or that a partner has committed.' if en else 'Les documents publiés par l’entreprise décrivent le programme ; ils ne constituent pas une preuve de mise en exploitation ni d’engagement d’un partenaire.')
        suffix = '-en' if en else ''
        labels = ('2026 progress report (PDF)', 'Investor factsheet (PDF)', 'Publications and dates') if en else ('Point d’étape 2026 (PDF)', 'Fiche investisseur (PDF)', 'Publications et dates')
        date = 'Page presentation updated on 7 October 2026.' if en else 'Présentation de la page mise à jour le 7 octobre 2026.'
        block = f'<aside class="et-status" id="et-status" aria-labelledby="et-status-title"><h2 id="et-status-title">{title}</h2><p>{status}</p><p>{caveat}</p><ul><li><a href="/Point_Etape_EnerTchad_2026.pdf">{labels[0]}</a></li><li><a href="/Fiche_Investisseur_EnerTchad.pdf">{labels[1]}</a></li><li><a href="/publications{suffix}">{labels[2]}</a></li></ul><small>{date}</small></aside>'
        text = re.sub(r'<aside class="et-status".*?</aside>', '', text, flags=re.S)
        text = re.sub(r'(<main\b[^>]*>.*?</(?:header|section)>)', lambda m:m[0] + block, text, count=1, flags=re.S)
    if name in ('gouvernance.html','gouvernance-en.html'):
        def organisation(m):
            s=m[0]
            s=s.replace('Trois pôles, trois directions générales adjointes.', 'Quatre segments industriels, des responsabilités à formaliser.').replace('Three poles, three deputy general managers.', 'Four industrial segments, responsibilities to formalise.')
            paragraph = ('The target organisation covers Exploration &amp; Production, Transport &amp; Storage, Refining &amp; Distribution and Petrochemicals. Engineering, corporate support and strategy are shared functions. Responsibilities and office holders will be announced as governance bodies are formalised.' if en else 'L’organisation cible couvre l’Exploration &amp; Production, le Transport &amp; stockage, le Raffinage &amp; distribution et la Pétrochimie. L’ingénierie, le support et la stratégie sont des fonctions transversales. Les responsabilités et les titulaires seront annoncés lors de la formalisation des organes.')
            s=re.sub(r'<p class="pp-lp">.*?</p>', '<p class="pp-lp">'+paragraph+'</p>', s, count=1, flags=re.S)
            s=s.replace('<span>Pôle</span>', '<span>Segment</span>').replace('<span>Pole</span>', '<span>Segment</span>').replace('DGA ', '').replace('DGM ', '')
            s=re.sub(r'<li>(?:Pétrochimie|Petrochemicals) <em>.*?</em></li>', '', s)
            url='/pole-enerchimie-en' if en else '/petrochimie/'
            label='Petrochemicals' if en else 'Pétrochimie'
            detail='Chemicals, gas valorisation and fertiliser projects; studies and approvals before implementation.' if en else 'Chimie, valorisation du gaz et projets d’engrais ; études et autorisations avant réalisation.'
            cell=f'<div class="pp-cell"><span>Segment</span><b><a href="{url}">{label}</a></b><p>{detail}</p></div>'
            if cell not in s:
                s=s.replace('\n\n<div class="pp-grid pp-cell"><div class="pp-cell"><span>'+('Transversal direction' if en else 'Direction transversale'), cell+'\n\n<div class="pp-grid pp-cell"><div class="pp-cell"><span>'+('Transversal direction' if en else 'Direction transversale'),1)
            box=('Target organisation. These functions are planned; appointments and operational milestones remain subject to formalisation and project conditions.' if en else 'Organisation cible. Ces fonctions sont prévues ; les nominations et les jalons opérationnels restent soumis à leur formalisation et aux conditions des projets.')
            s=re.sub(r'<p class="pp-box">.*?</p>', '<p class="pp-box">'+box+'</p>',s,flags=re.S)
            return s
        text=re.sub(r'<section id="organisation".*?</section>',organisation,text,flags=re.S)
    return text

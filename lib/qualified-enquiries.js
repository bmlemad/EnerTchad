import { htmlToDOM } from 'html-react-parser';

function nodes(html) {
  const all = [], walk = n => { all.push(n); (n.children || []).forEach(walk); };
  htmlToDOM(html, {withStartIndices:true, withEndIndices:true}).forEach(walk);
  return all;
}
const escape = text => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

export function withQualifiedEnquiries(html) {
  const language = html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1];
  if (!['fr','en'].includes(language)) return html;
  const en = language === 'en', suffix = en ? '-en' : '';
  // Existing fleet deep links keep the B2B profile and add only the specific need.
  const replacements = [];
  for (const node of nodes(html).filter(n=>n.name==='a' && /\/contact(?:-en)?\?profil=b2b#ctForm/.test(n.attribs?.href || ''))) {
    let fleet = false;
    for (let parent=node.parent;parent;parent=parent.parent) {
      if (parent.attribs?.id === 'flottes') fleet = true;
      if (parent.name === 'article' && /Gestion des flottes|Fleet management/.test(html.slice(parent.startIndex,parent.endIndex+1))) fleet = true;
    }
    if (fleet) replacements.push([node.startIndex,node.endIndex+1,html.slice(node.startIndex,node.endIndex+1).replace('profil=b2b#ctForm','profil=b2b&amp;besoin=flotte#ctForm')]);
  }
  for (const [start,end,text] of replacements.sort((a,b)=>b[0]-a[0])) html=html.slice(0,start)+text+html.slice(end);
  if (html.includes('id="ingenierie"') && !html.includes('data-engineering-brief')) {
    const section = nodes(html).find(n => n.attribs?.id === 'ingenierie');
    if (section) {
      let content = html.slice(section.startIndex, section.endIndex + 1);
      const briefs = en ? [
        'Objective, site, available data and decision deadline.',
        'Project phase, target capacity, existing plans and site constraints.',
        'Required expertise, scope of assistance, duration and project interfaces.',
        'Project stage, milestones, reporting needs and acceptance criteria.'
      ] : [
        'Objectif, site, données disponibles et échéance de décision.',
        'Phase du projet, capacité visée, plans existants et contraintes du site.',
        'Expertises attendues, périmètre d’assistance, durée et interfaces du projet.',
        'État du projet, jalons, besoins de suivi et critères de réception.'
      ];
      let index = 0;
      content = content.replace(/<article class="pp-cell">[\s\S]*?<\/article>/g, card => {
        const brief = briefs[index++];
        return !brief ? card : card.replace(/(<a\b|<\/article>)/, `<p data-engineering-brief><strong>${en ? 'To scope this assignment:' : 'Pour cadrer la mission :'}</strong> ${brief}</p>$1`);
      }).replace(/profil=partenariat(?=&amp;service=|&service=)/g,'profil=ep')
        .replace(`href="/contact${suffix}#ctForm"`, `href="/contact${suffix}?profil=ep#ctForm"`);
      html = html.slice(0,section.startIndex) + content + html.slice(section.endIndex+1);
    }
  }
  if (!html.includes('id="ctForm"') || html.includes('id="et-enquiry"')) return html;
  const input = (id, fr, english, max=160, type='text') => `<label>${en ? english : fr}<input id="${id}" type="${type}" maxlength="${max}"${type === 'number' ? ' min="1" max="999999" step="1"' : ''}></label>`;
  const fieldset = (kind, title, fields) => `<fieldset data-enquiry-kind="${kind}" hidden disabled><legend>${title}</legend><details><summary>${en ? 'Add details (optional)' : 'Préciser ce besoin (facultatif)'}</summary><div class="et-enquiry-fields">${fields}</div></details></fieldset>`;
  const serviceOptions = (en ? ['Studies & feasibility','Design & project preparation','Technical assistance','Project monitoring'] : ['Études & faisabilité','Conception & préparation','Assistance technique','Suivi de projets']).map((name,i)=>`<option value="${['faisabilite','conception','assistance','suivi'][i]}">${escape(name)}</option>`).join('');
  const qualifier = `<div id="et-enquiry" class="et-full"><input id="et-enquiry-summary" type="hidden" name="requirements"><label id="et-enquiry-business" hidden>${en ? 'Your business requirement' : 'Votre besoin professionnel'}<select id="et-enquiry-mode"><option value="supply">${en ? 'Fuel supply' : 'Approvisionnement en carburants'}</option><option value="fleet">${en ? 'Fleet management' : 'Gestion de flottes'}</option></select></label>${fieldset('supply',en?'Fuel supply':'Approvisionnement',input('eq-product','Produit recherché','Required product',80)+input('eq-volume','Volume et unité (ex. : litres/mois)','Volume and unit (e.g. litres/month)',80)+input('eq-frequency','Fréquence ou durée du besoin','Frequency or duration',80)+input('eq-supply-location','Lieu de livraison','Delivery location')+input('eq-supply-date','Échéance souhaitée','Preferred date',40,'date'))}${fieldset('fleet',en?'Fleet management':'Gestion de flottes',input('eq-vehicles','Nombre de véhicules','Number of vehicles',6,'number')+input('eq-fleet-location','Zones de circulation','Operating areas')+input('eq-fleet-needs','Besoin de suivi ou de contrôle','Reporting or control requirements',240)+input('eq-fleet-date','Échéance souhaitée','Preferred date',40,'date'))}${fieldset('engineering',en?'Engineering assignment':'Mission d’ingénierie',`<label>${en?'Type of assignment':'Type de mission'}<select id="eq-service"><option value="">${en?'To be scoped':'À définir'}</option>${serviceOptions}</select></label>`+input('eq-installation','Installation ou projet concerné','Facility or project')+input('eq-phase','Phase actuelle du projet','Current project phase',100)+input('eq-engineering-location','Localisation du projet','Project location')+input('eq-deliverable','Livrable attendu ou question à résoudre','Expected output or question to resolve',240)+input('eq-engineering-date','Échéance souhaitée','Preferred date',40,'date'))}<p class="et-enquiry-help" hidden>${en?'These details are optional. You can explain your requirement in your message. Scope, availability and terms are confirmed before any commitment.':'Ces précisions sont facultatives. Vous pouvez expliquer votre besoin dans votre message. Le périmètre, la disponibilité et les conditions sont à confirmer avant tout engagement.'}</p></div>`;
  // Preserve the existing form fields and their order; add optional context after the request type.
  const all = nodes(html), select = all.find(n=>n.attribs?.id==='ctType');
  if (!select?.parent || select.parent.name !== 'label') return html;
  const position = select.parent.endIndex + 1;
  html = html.slice(0,position)+qualifier+html.slice(position);
  return html.replace('</head>','<link rel="stylesheet" href="/assets/chrome/qualified-enquiries.css"></head>')
    .replace('</body>','<script defer src="/assets/chrome/qualified-enquiries.js"></script></body>');
}

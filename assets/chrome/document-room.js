/* EnerTchad Public Data Room — registry-driven document explorer */
(()=>{try{
  const host=document.querySelector('[data-et-docroom]'); if(!host)return;
  const lang=(document.documentElement.lang||'fr').slice(0,2)==='en'?'en':'fr';
  const labels=lang==='en'
    ? {all:'All',investors:'Investors',operations:'Operations',esg:'ESG',corporate:'Corporate',open:'Open',download:'Download',empty:'No document matches this filter.',integrity:'Git blob'}
    : {all:'Tous',investors:'Investisseurs',operations:'Opérations',esg:'ESG',corporate:'Institutionnel',open:'Ouvrir',download:'Télécharger',empty:'Aucun document ne correspond à ce filtre.',integrity:'Empreinte Git'};
  const fmtBytes=n=>n<1024? n+' B' : n<1048576? Math.round(n/1024)+' KB' : (n/1048576).toFixed(1)+' MB';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  fetch('/assets/data/document-registry.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(reg=>{
    const cats=['all','investors','operations','esg','corporate'];
    const controls=document.createElement('div'); controls.className='et-dr-filters'; controls.setAttribute('role','group'); controls.setAttribute('aria-label',lang==='en'?'Filter documents':'Filtrer les documents');
    cats.forEach((cat,i)=>{const b=document.createElement('button'); b.type='button'; b.dataset.cat=cat; b.setAttribute('aria-pressed',i?'false':'true'); b.textContent=labels[cat]; controls.appendChild(b)});
    const grid=document.createElement('div'); grid.className='et-data-room et-data-room-full';
    const render=cat=>{
      const docs=reg.documents.filter(d=>cat==='all'||d.category===cat);
      grid.innerHTML=docs.map(d=>{
        const role=lang==='en'?d.role_en:d.role_fr;
        const action=/^(PDF|PPTX|XLSX|CSV|ICS)$/.test(d.format)?labels.download:labels.open;
        const version=d.version?'<span>'+esc(d.version)+'</span>':'';
        const sha=d.git_blob_sha?esc(d.git_blob_sha.slice(0,10)):'—';
        return '<a class="et-dr-card" href="'+esc(d.path)+'" download>'+
          '<div class="et-dr-meta"><span>'+esc(d.format)+'</span><span>'+esc(d.language.toUpperCase())+'</span><span>'+esc(d.status)+'</span>'+version+'</div>'+
          '<h3>'+esc(role)+'</h3>'+
          '<p>'+esc(fmtBytes(d.bytes))+' · '+labels.integrity+' '+sha+'</p>'+
          '<div class="et-dr-foot"><span>'+esc(d.category)+'</span><span>'+action+' →</span></div></a>';
      }).join('') || '<p class="et-dr-empty">'+labels.empty+'</p>';
    };
    controls.addEventListener('click',e=>{const b=e.target.closest('button[data-cat]');if(!b)return;controls.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render(b.dataset.cat)});
    host.appendChild(controls); host.appendChild(grid); render('all');
  }).catch(()=>{host.hidden=true});
}catch(e){}})();
// Targeted export fixes for the legacy configurator and Arabic press template.
export function withClientQaFixes(html){
  if(html.includes('href="https://enertchad.com/ar-presse"')&&/<html\b[^>]*lang="ar"/.test(html)){
    html=html.replace(/<header class="pp-hero pp-hero-s" id="top-pole"><picture>[\s\S]*?<\/picture><div class="pp-wrap">/,
      '<header class="pp-hero pp-hero-s pp-hero-plain" id="top-pole" style="min-height:0!important"><div class="pp-wrap" style="padding-block:40px!important">');
    html=html.replace(/<link[^>]+rel="preload"[^>]*>/g,tag=>tag.includes('village-sahel')?'':tag);
  }
  if(html.includes('data-et-visual="config"')&&!html.includes("var explicit=el.getAttribute('aria-label');")){
    html=html.replace('for(var i=0;i<6&&el;i++){el=el.parentElement; if(!el)break;',
      "for(var i=0;i<6&&el;i++){el=el.parentElement; if(!el)break;\n      var explicit=el.getAttribute('aria-label');\n      if(explicit)return explicit;")
      .replace(`document.querySelectorAll('[role="slider"]:not([aria-label]):not([aria-labelledby])').forEach(function(s){\n      s.setAttribute('aria-label', labelFor(s)||'Curseur de réglage');`,
        `document.querySelectorAll('[role="slider"]:not([aria-labelledby])').forEach(function(s){\n      var label=labelFor(s)||s.getAttribute('aria-label')||'Curseur de réglage';\n      if(s.getAttribute('aria-label')!==label)s.setAttribute('aria-label',label);`)
      .replace("{childList:true,subtree:true,attributes:true,attributeFilter:['aria-controls','role']}",
        "{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-controls','aria-label','role']}");
  }
  return html;
}

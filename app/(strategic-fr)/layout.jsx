import Script from 'next/script';
import '../../assets/chrome/strategic-premium.css';
import '../../assets/chrome/coherence-20261013.css';
// Thème : suit le choix fait ailleurs sur le site (et-plight = 0 : sombre), posé avant l’affichage.
const THEME = "try{if(localStorage.getItem('et-plight')==='0')document.documentElement.classList.add('sp-dark')}catch(e){}";
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function Layout({ children }) {
  return <html lang="fr" suppressHydrationWarning><head><script id="sp-theme" dangerouslySetInnerHTML={{ __html: THEME }} /></head><body className="sp">{children}<Script id="et-audience-consent" src="/assets/chrome/audience-consent.js" strategy="afterInteractive" /><Script id="et-coherence" src="/assets/chrome/coherence-20261013.js" strategy="afterInteractive" /></body></html>;
}

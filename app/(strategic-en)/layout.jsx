import Script from 'next/script';
import '../../assets/chrome/strategic-premium.css';
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function Layout({ children }) {
  return <html lang="en"><body className="sp">{children}<Script id="et-audience-consent" src="/assets/chrome/audience-consent.js" strategy="afterInteractive" /></body></html>;
}

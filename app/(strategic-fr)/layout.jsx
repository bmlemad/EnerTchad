import '../../assets/chrome/strategic-premium.css';
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function Layout({ children }) {
  return <html lang="fr"><body className="sp">{children}</body></html>;
}

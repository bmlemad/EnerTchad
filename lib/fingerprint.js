// Lot 26 (m10) : URL versionnees (?v=<empreinte du contenu>) des ressources /assets/chrome/
// dans les pages React ; table calculee par scripts/next/prepare.mjs.
import versions from '../.generated/fingerprints.json';
import { rewriteRefs } from '../scripts/next/fingerprint.mjs';
export const fingerprintUrl = url => rewriteRefs(url, versions);

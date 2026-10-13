# Download language disclosures

Twenty-six links on eleven English source pages opened registered French documents without a visible language label. The English brochure landing page also linked to the French PDF despite an existing English version.

The build now labels registered French and Arabic downloads on English pages, including inline and card links, and includes the disclosure in existing accessible labels. Already disclosed links are preserved. The English brochure landing page uses the existing English PDF; the publication library retains both versions. The change translates no documents and changes no company claims.

Regression checks cover visible and accessible language labels, document-card titles, idempotence, the brochure destination, the bilingual library and unchanged French pages. Release checks include production export, document metadata, routes, language pairs, search destinations and performance.

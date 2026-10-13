# Consistent investor enquiry journeys

Shared headers and menus still offered Invest/Subscribe actions after the main pages were clarified. This migration aligns French and English action labels and destinations with the available investor contact form, including native React and generated subsite headers. Informational capital links and Arabic source pages are preserved.

The migration runs before the production build and after page regeneration. It preserves existing contact information. Regression checks cover both languages, absolute destinations, menu copy, idempotence and unaffected informational links. The release also checks exported routes, language pairs, content integrity and performance.

# Corporate readiness update — 13 October 2026

The reviewed editorial changes are maintained in `scripts/apply_readiness_20261013.py`.
The existing Next.js preparation step applies this idempotent migration before
exporting pages. Existing contact information is preserved in the original pages;
the migration does not replace it or introduce new corporate or project facts.

The update covers the French and English homepage, governance, projects,
investor centre, purchasing and customer pages. It moves homepage audience routes
ahead of future targets, clarifies intended financial reporting and purchasing
capabilities, adds project-specific evidence requirements and financing categories,
simplifies the customer introduction, and labels French investor PDFs in English.

Styles come from a shared CSS source. Homepages use their existing versioned
stylesheet; other edited pages embed the relevant styles. This adds no blocking
stylesheet requests. The source pages in Git remain the regeneration
inputs; deployable pages contain the applied migration.

The corporate-readiness workflow builds and verifies the export, checks the
performance budget, prepares the OVH Apache package, then commits the verified
files to the existing `ovh-static` branch without a force push. Its automatic
trigger is limited to the named implementation branch; future runs can be
started manually. OVH's existing Git deployment operation publishes that branch.

No DNS, hosting subscription, authentication credential, or contact receiver
configuration is changed by this editorial migration. Supporting technical
studies, biographies, funding commitments and English document translations still
require verified business inputs and are not invented by the build step.

# Public document reliability

The registry contained sizes and fingerprints that no longer matched several published files. The build now calculates metadata from each current document and stops when a registry file is missing. It preserves document versions and distinguishes the inventory check date from document dates.

French and English investor/publication cards show document language, format, file size and known or unspecified version. The explorer localizes categories and status, and keeps technical fingerprints in the existing registry. Underlying documents and company claims are unchanged.

Validation: three regression checks (stale integrity, missing file, idempotent language/version labels); preparation boundary tests; production export; migration, content integrity, redirects, language pairs and conversion checks; static budget with no blockers or warnings.

The narrowly scoped existing OVH export workflow runs for this implementation branch and publishes only after its checks pass.

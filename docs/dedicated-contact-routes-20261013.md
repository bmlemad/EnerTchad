# Dedicated contact routes

The contact-context update incorrectly rewrote every local contact link to the form's selected enquiry type. On a purchasing enquiry, the dedicated investor contact action therefore opened purchasing rather than investment.

Only language-switch links and generic contact links now follow the current selection. Explicit investor, supplier and other business profiles keep their own destination. Generic links carry a marker so dynamically cloned mobile links retain the intended behaviour; language links are recognized through their language class, hreflang or accessible label.

Seven regression checks cover all twelve enquiry types in both languages, changed and cleared selections, unknown input, unrelated destinations, explicit business routes, language links with existing query parameters and mobile clones. Form submission and personal-data handling are unchanged.

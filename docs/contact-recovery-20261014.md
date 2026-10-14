# Contact request recovery and Arabic mobile spacing

A stalled form submission previously had no timeout and could leave the send button disabled indefinitely. Requests now use a 30-second abort timeout. A failure or timeout retains the form contents, enables manual retry, and states that receipt could not be confirmed. There is no automatic resubmission. A response arriving after the timeout cannot reset the form or trigger a success event.

Six isolated JavaScript tests cover successful acknowledgement in all three languages, HTTP and network failures, timeout cancellation, late responses, repeated clicks, and invalid/honeypot forms. They use simulated responses and send no enquiries. Real inbox delivery remains unverified.

The Arabic contact section inherits a high-specificity theme rule that removes horizontal padding. A scoped inner wrapper restores 24-pixel padding without changing the shared theme. At 390 pixels, the form runs from x=24 to x=366, with no horizontal overflow; Investment preselection and fragment focus remain intact.

The production build, public navigation, enquiry access, Arabic readiness, integrity and language-pair checks pass. Existing release workflow checks remain in place. The contact asset URL is refreshed in generated HTML so returning visitors receive the new error handling.

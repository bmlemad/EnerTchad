# Contact language context

Language links previously kept only the original incoming profile. Changing the request type in the form or choosing one after arriving without a profile was ignored when switching language. The contact script now synchronizes language links with the current selected type, preserves unrelated query parameters and fragment identifiers, and removes stale context when the visitor clears the selection.

Four regression checks cover all twelve request profiles in French and English, changed and cleared selections, unknown input, and unrelated external links. No form is submitted by these tests. The change preserves request type only; it does not store the visitor's name, address or message. Delivery behaviour is unchanged.

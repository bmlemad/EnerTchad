import postcss from 'postcss';

// Compact only formatting in delivered CSS. Keep selectors, declarations,
// values, rule order, and source files unchanged, including legacy overrides.
export function compactCss(css) {
  const root = postcss.parse(css);
  root.walkComments(comment => {
    if (!/^!|@license|@preserve/i.test(comment.text)) comment.remove();
  });
  function compactFormatting(node) {
    for (const property of ['before', 'after', 'between']) {
      if (typeof node.raws[property] === 'string' && /^\s*$/.test(node.raws[property])) node.raws[property] = '';
    }
    if (node.type === 'decl' && /^\s*:\s*$/.test(node.raws.between)) node.raws.between = ':';
  }
  compactFormatting(root);
  root.walk(compactFormatting);
  return root.toString() + '\n';
}

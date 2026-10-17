"""Reject invalid quote quantities rather than silently changing them."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OLD = "var q=Math.max(1,(el?parseInt(el.value,10):1)||1);"
OLD_SUM = "if(cart[key]){cart[key].q+=q;}"
INPUT = 'type="number" min="1" value="1" inputmode="numeric"'

def patch(source, english=False):
    if '/* et-quantity-validation */' in source:
        return source
    if source.count(OLD) != 1 or source.count(OLD_SUM) != 1 or source.count(INPUT) != 1:
        raise ValueError('Review catalogue quantity structure before applying validation')
    message = 'Enter a whole number greater than zero.' if english else 'Saisissez un nombre entier supérieur à zéro.'
    overflow = 'The total quantity is too large.' if english else 'La quantité totale est trop élevée.'
    validation = "/* et-quantity-validation */if(!el)return;el.setCustomValidity('');var q=Number(el.value);if(!Number.isSafeInteger(q)||q<1){el.setCustomValidity('" + message + "');}if(!el.reportValidity())return;"
    total = "if(cart[key]){if(!Number.isSafeInteger(cart[key].q+q)){el.setCustomValidity('" + overflow + "');el.reportValidity();return;}cart[key].q+=q;}"
    return source.replace(OLD, validation).replace(OLD_SUM, total).replace(INPUT, 'type="number" min="1" step="1" required value="1" inputmode="numeric" oninput="this.setCustomValidity(String())"')

if __name__ == '__main__':
    for name in ('boutique.html', 'boutique-en.html'):
        path = ROOT / 'aval' / name
        old = path.read_text()
        new = patch(old, '-en' in name)
        if old != new:
            path.write_text(new)

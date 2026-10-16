"""Keep the public contact number aligned across generated text assets."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SEP=r'(?:[\s.\-]|&nbsp;|&#160;|&#x[aA]0;)*'
OLD=re.compile(r'99('+SEP+r')29('+SEP+r')86('+SEP+r')96')
SKIP={'.git','.next','out','node_modules','public','reports','qa','scripts','docs'}
def transform(text):
    text=OLD.sub(lambda m:'30'+m[1]+'16'+m[2]+'26'+m[3]+'26',text)
    return re.sub(r'/assets/chrome/(configurateur-service-(?:legacy|module))\.js(?:\?[^"\'<>\s]+)?',r'/assets/chrome/\1.js?b=2026101602',text)
def main():
    count=0;occurrences=0
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix not in {'.html','.js','.jsx','.json','.txt','.md'}:continue
        if any(part in SKIP for part in path.relative_to(ROOT).parts):continue
        old=path.read_text();occurrences+=len(OLD.findall(old));new=transform(old)
        if new!=old:path.write_text(new);count+=1
    print(f'Public phone aligned: {count} source files, {occurrences} replacements')
if __name__=='__main__':main()

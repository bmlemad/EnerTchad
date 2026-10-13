"""Validate indexed search pages and fragments against the production export."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Identifiers(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = set()

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == 'id':
                self.values.add(value)


def read_rules(path):
    rules = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[0].startswith('/') and '*' not in parts[0]:
            rules[parts[0]] = (parts[1], int(parts[2].rstrip('!')))
    return rules


def destination(root, url, rules):
    root = root.resolve()
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc or not parsed.path.startswith('/'):
        raise ValueError('Search destination must be a local absolute path: ' + url)
    path, fragment = parsed.path, unquote(parsed.fragment)
    visited = set()
    for _ in range(16):
        if path in visited:
            raise ValueError('Search redirect loop: ' + url)
        visited.add(path)
        rule = rules.get(path)
        candidates = [root / unquote(path.lstrip('/'))]
        candidates += [Path(str(candidates[0]) + '.html'), candidates[0] / 'index.html']
        file = next((p for p in candidates if p.is_file() and p.resolve().is_relative_to(root)), None)
        if rule and (300 <= rule[1] < 400 or file is None):
            target = urlsplit(rule[0])
            if target.scheme or target.netloc:
                raise ValueError('External search redirect cannot be verified: ' + url)
            path = target.path
            fragment = unquote(target.fragment) or fragment
            continue
        if file is None:
            raise ValueError('Missing search page: ' + url)
        if fragment and file.suffix == '.html':
            ids = Identifiers()
            ids.feed(file.read_text(encoding='utf-8'))
            if fragment not in ids.values:
                raise ValueError('Missing search section: ' + url)
        return file, fragment
    raise ValueError('Too many search redirects: ' + url)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='out', type=Path)
    parser.add_argument('--redirects', default='_redirects', type=Path)
    args = parser.parse_args()
    rules = read_rules(args.redirects)
    count = 0
    errors = []
    for name in ('cmdk_en.js', 'cmdk_extra.js'):
        path = args.root / 'assets/chrome' / name
        text = path.read_text(encoding='utf-8')
        entries = json.loads(text.split('=', 1)[1].strip().rstrip(';'))
        for entry in entries:
            count += 1
            try:
                destination(args.root, entry['url'], rules)
            except ValueError as error:
                errors.append(str(error))
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Search navigation verified: {count} French and English destinations')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Package the verified Next.js export for OVH's Apache hosting."""
import argparse
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
HOSTS = ("enertchad.com", "www.enertchad.com", "clients.enertchad.com",
         "atlas.enertchad.com", "boutique.enertchad.com")
OMIT = {"_headers", "_redirects", "CNAME"}


def wildcard(pattern):
    return re.escape(pattern).replace(r"\*", "(.*)")


def rules():
    converted = []
    count = 0
    for line in (ROOT / "_redirects").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) != 3:
            raise ValueError("Unsupported redirect: " + line)
        source, target, status = parts
        force = status.endswith("!")
        code = int(status.rstrip("!"))
        if code not in (200, 301, 302, 307, 308):
            raise ValueError("Unsupported status: " + line)
        conditions = []
        if source.startswith(("http://", "https://")):
            url = urlsplit(source)
            path = url.path
            conditions.append(f"RewriteCond %{{HTTP_HOST}} ^{re.escape(url.hostname)}(?::[0-9]+)?$ [NC]")
            if url.scheme == "http":
                conditions += ["RewriteCond %{HTTPS} !=on", "RewriteCond %{ENV:HTTPS} !=on"]
            else:
                conditions += ["RewriteCond %{HTTPS} =on [OR]", "RewriteCond %{ENV:HTTPS} =on"]
        else:
            path = source
        if not force:
            # Netlify also lets a pretty-URL file (path.html) shadow a non-forced rule.
            conditions += ["RewriteCond %{REQUEST_FILENAME} !-f", "RewriteCond %{REQUEST_FILENAME} !-d",
                           "RewriteCond %{REQUEST_FILENAME}.html !-f"]
        if ":" in path.lstrip("/"):
            raise ValueError("Unsupported named placeholder: " + line)
        substitution = target.replace(":splat", "$1")
        if code == 200:
            if not substitution.startswith("/"):
                raise ValueError("Only local rewrites are supported: " + line)
            substitution = substitution.lstrip("/")
            flags = "END"
        else:
            if substitution.startswith("/"):
                substitution = "https://%{HTTP_HOST}" + substitution
            flags = f"R={code},END,NE"
        converted += ["# " + line, *conditions,
                      f"RewriteRule ^{wildcard(path.lstrip('/'))}$ {substitution} [{flags}]", ""]
        count += 1
    return converted, count


def headers():
    # Netlify revalidates every response by default; keep that for documents
    # replaced in place (PDF, XLSX, sitemap, sw.js). /assets rules below override it.
    result = ["<IfModule mod_headers.c>",
              '  Header always set Cache-Control "public, max-age=0, must-revalidate"']
    scope = None
    for raw in (ROOT / "_headers").read_text().splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if not raw.startswith((" ", "\t")):
            scope = raw.strip()
            continue
        name, value = raw.strip().split(":", 1)
        value = value.strip()
        if scope is None or '"' in value:
            raise ValueError("Unsupported header: " + raw)
        condition = ""
        if scope != "/*":
            pattern = re.escape(scope).replace(r"\*", ".*")
            condition = f' "expr=%{{REQUEST_URI}} =~ m#^{pattern}$#"'
        result.append(f'  Header always set {name} "{value}"{condition}')
    result += ['  <FilesMatch "\\.html$">',
               '    Header always set Cache-Control "public, max-age=0, must-revalidate"',
               "  </FilesMatch>", "</IfModule>"]
    return result


def text_delivery():
    """UTF-8 and compression for text, as Netlify served them."""
    return ["# UTF-8 for text files (fiche presse .md, agenda .ics, security.txt).",
            "AddDefaultCharset UTF-8",
            "<IfModule mod_mime.c>",
            "  AddType text/markdown .md",
            "  AddCharset UTF-8 .css .js .mjs .json .md .ics .txt .xml .svg .webmanifest",
            "</IfModule>",
            "<IfModule mod_deflate.c>",
            "  AddOutputFilterByType DEFLATE text/html text/css text/plain text/markdown "
            "text/calendar text/xml application/xml application/javascript text/javascript "
            "application/json application/manifest+json image/svg+xml text/csv",
            "</IfModule>",
            "# OVH adds its own mod_expires headers (a second Cache-Control: max-age=900",
            "# and an Expires) to CSS, JS and images. Turn them off so the rules above apply alone.",
            "<IfModule mod_expires.c>",
            "  ExpiresActive Off",
            "</IfModule>"]


def apache_config():
    converted, count = rules()
    host_pattern = "(?:" + "|".join(re.escape(host) for host in HOSTS) + ")"
    lines = ["# Generated by scripts/ovh/package.py. All five hosts use the same root.",
             "Options -Indexes -MultiViews", "DirectoryIndex index.html",
             "DirectorySlash Off",
             "ErrorDocument 404 /404.html", "", "<IfModule mod_rewrite.c>",
             "RewriteEngine On", "RewriteOptions AllowNoSlash", "RewriteBase /", "",
             'RewriteRule "(^|/)\\.(?!well-known(?:/|$))" - [F,END]', "",
             "# Netlify Forms do not exist on Apache: contact POSTs go to the PHP receiver,",
             "# which mails the request or fails visibly (the page then offers email/WhatsApp).",
             "RewriteCond %{REQUEST_METHOD} =POST",
             "RewriteRule ^contact-received(?:-en|-ar)?(?:\\.html)?/?$ contact-handler.php [END]", "",
             "# Host-specific routing and legacy redirects, in their existing order.",
             *converted,
             "# Use OVH's HTTPS environment signal as well as Apache's native one.",
             f"RewriteCond %{{HTTP_HOST}} ^{host_pattern}(?::[0-9]+)?$ [NC]",
             "RewriteCond %{HTTPS} !=on", "RewriteCond %{ENV:HTTPS} !=on",
             "RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,END,NE]", "",
             "RewriteCond %{HTTP_HOST} ^www\\.enertchad\\.com(?::[0-9]+)?$ [NC]",
             "RewriteRule ^ https://enertchad.com%{REQUEST_URI} [R=301,END,NE]", "",
             "# Host copies are served only by the host-specific internal rewrites.",
             "RewriteRule ^_subsites(?:/|$) - [R=404,END]", "",
             "# Clean public HTML URLs; THE_REQUEST prevents internal rewrite loops.",
             "RewriteCond %{ENV:REDIRECT_STATUS} ^$",
             'RewriteCond %{THE_REQUEST} "\\s/+index\\.html(?:[?\\s])" [NC]',
             "RewriteRule ^index\\.html$ https://%{HTTP_HOST}/ [R=301,END,NE]",
             "RewriteCond %{ENV:REDIRECT_STATUS} ^$",
             'RewriteCond %{THE_REQUEST} "\\s/+[^?\\s]+\\.html(?:[?\\s])" [NC]',
             "RewriteCond %{REQUEST_FILENAME} -f",
             "RewriteRule ^(.+)\\.html$ https://%{HTTP_HOST}/$1 [R=301,END,NE]", "",
             "RewriteCond %{REQUEST_FILENAME} -f", "RewriteRule ^ - [END]", "",
             "# React exports also create RSC directories; prefer their public HTML.",
             "RewriteCond %{DOCUMENT_ROOT}/$1.html -f",
             "RewriteRule ^(.+?)/?$ $1.html [END]", "",
             "# Add slashes only for actual index directories, after HTML resolution.",
             "RewriteCond %{REQUEST_FILENAME} -d",
             "RewriteRule ^(.+[^/])$ https://%{HTTP_HOST}/$1/ [R=301,END,NE]", "",
             "RewriteCond %{REQUEST_FILENAME} -d", "RewriteRule ^ - [END]",
             "</IfModule>", "", *headers(), "", *text_delivery(), ""]
    return "\n".join(lines), count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    export = ROOT / "out"
    if not (export / "index.html").is_file() or not (export / "deploy-version.txt").is_file():
        parser.error("Run npm run build && npm run check:migration first.")
    manifest = json.loads((ROOT / ".generated/site.json").read_text())
    for page in manifest["pages"]:
        if not (export / page["source"]).is_file():
            raise RuntimeError("Incomplete export: " + page["source"])
    config, count = apache_config()
    (export / ".htaccess").write_text(config)
    # Contact receiver: the recipient is the address published on the contact page.
    addresses = re.findall(r'mailto:([^"?]+)', (ROOT / "contact.html").read_text(encoding="utf-8"))
    if not addresses:
        raise RuntimeError("No contact address in contact.html")
    recipient = max(set(addresses), key=addresses.count)
    handler = (ROOT / "scripts/ovh/contact.php").read_text(encoding="utf-8")
    (export / "contact-handler.php").write_text(handler.replace("{{RECIPIENT}}", recipient), encoding="utf-8")
    files = sorted(p for p in export.rglob("*") if p.is_file() and p.relative_to(export).as_posix() not in OMIT)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(export).as_posix())
    revision = (export / "deploy-version.txt").read_text().strip()
    print(json.dumps({"archive": str(args.output.resolve()), "commit": revision,
                      "pages": len(manifest["pages"]), "files": len(files),
                      "redirect_rules": count, "uncompressed_bytes": sum(p.stat().st_size for p in files),
                      "archive_bytes": args.output.stat().st_size}, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Verify the packaged export through a real local Apache 2.4 instance."""
import grp
import hashlib
import http.client
import json
import os
import pwd
import re
import shutil
import socket
import subprocess
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "out"


def main():
    apache = shutil.which("apache2") or shutil.which("httpd")
    if not apache:
        raise SystemExit("Apache 2.4 is required. On Ubuntu: sudo apt-get install apache2-bin")
    modules = Path("/usr/lib/apache2/modules")
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix="enertchad-apache-") as directory:
        temp = Path(directory)
        config = temp / "httpd.conf"
        error_log = temp / "error.log"
        # The OVH cluster's MIME table has no woff2, webmanifest, markdown or avif entry: test without them.
        (temp / "mime.types").write_text("".join(
            line for line in Path("/etc/mime.types").read_text().splitlines(keepends=True)
            if not re.search(r"\b(woff2|webmanifest|markdown|avif)\b", line)))
        load = "\n".join(f"LoadModule {name}_module {modules / ('mod_' + name + '.so')}"
                         for name in ("mpm_event", "authz_core", "dir", "mime", "rewrite", "headers", "setenvif", "expires"))
        config.write_text(f'''ServerRoot "{temp}"
ServerName localhost
Listen 127.0.0.1:{port}
PidFile "{temp / 'httpd.pid'}"
ErrorLog "{error_log}"
LogLevel warn
{load}
User {pwd.getpwuid(os.getuid()).pw_name}
Group {grp.getgrgid(os.getgid()).gr_name}
TypesConfig "{temp / 'mime.types'}"
AddType text/html .html
SetEnvIf X-OVH-Test-HTTPS ^on$ HTTPS=on
# Same defaults as the OVH shared hosting: mod_expires active for static files.
ExpiresActive On
ExpiresByType text/css "access plus 15 minutes"
ExpiresByType text/javascript "access plus 15 minutes"
ExpiresByType application/javascript "access plus 15 minutes"
ExpiresByType image/webp "access plus 15 minutes"
DocumentRoot "{OUT}"
<Directory "{OUT}">
  Options FollowSymLinks
  AllowOverride All
  Require all granted
</Directory>
''')
        subprocess.run([apache, "-f", str(config), "-t"], check=True)
        process = subprocess.Popen([apache, "-f", str(config), "-DFOREGROUND"], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        checks = 0
        try:
            def request(host, path, secure=True):
                connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
                headers = {"Host": host}
                if secure:
                    headers["X-OVH-Test-HTTPS"] = "on"
                connection.request("GET", path, headers=headers)
                response = connection.getresponse()
                data = response.read()
                result = (response.status, dict(response.getheaders()), data)
                connection.close()
                return result

            for _ in range(50):
                if process.poll() is not None:
                    raise RuntimeError(process.stderr.read().decode())
                try:
                    request("enertchad.com", "/")
                    break
                except ConnectionRefusedError:
                    time.sleep(0.1)
            else:
                raise RuntimeError("Apache did not start")

            def content(host, path, file, status=200):
                nonlocal checks
                actual, headers, body = request(host, path)
                assert actual == status, (host, path, actual, headers)
                assert hashlib.sha256(body).digest() == hashlib.sha256((OUT / file).read_bytes()).digest(), (host, path, "content differs")
                assert headers.get("X-Content-Type-Options") == "nosniff", (host, path, headers)
                assert headers.get("Content-Type"), (host, path, "no Content-Type with nosniff")
                checks += 1

            def redirect(host, path, target, status=301, secure=True):
                nonlocal checks
                actual, headers, _ = request(host, path, secure)
                assert actual == status and headers.get("Location") == target, (host, path, actual, headers, target)
                checks += 1

            cases = [
                ("enertchad.com", "/", "index.html"),
                ("enertchad.com", "/index-en", "index-en.html"),
                ("enertchad.com", "/essentiel", "essentiel.html"),
                ("enertchad.com", "/essentiel/", "essentiel.html"),
                ("enertchad.com", "/investisseurs-en", "investisseurs-en.html"),
                ("enertchad.com", "/amont/", "amont/index.html"),
                ("enertchad.com", "/amont/calculateur-baril-additionnel", "Calculateur_Baril_Additionnel.html"),
                ("enertchad.com", "/.well-known/security.txt", ".well-known/security.txt"),
                ("enertchad.com", "/boutique/", "boutique/index.html"),
                ("enertchad.com", "/boutique/en/", "boutique/en/index.html"),
                ("enertchad.com", "/boutique/clients", "boutique/clients.html"),
                ("enertchad.com", "/boutique/en/clients", "boutique/en/clients.html"),
                ("enertchad.com", "/atlas/", "atlas/index.html"),
                ("enertchad.com", "/atlas-en", "atlas-en.html"),
                ("enertchad.com", "/atlas/carte", "atlas/carte.html"),
                ("enertchad.com", "/atlas/sources-en", "atlas/sources-en.html"),
                # Lot 32 : the cluster has no avif entry; without AddType the file went out with no Content-Type.
                ("enertchad.com", "/assets/img/p/chantier-ferraillage-m720.avif", "assets/img/p/chantier-ferraillage-m720.avif"),
            ]
            for case in cases:
                content(*case)
            for host in ("enertchad.com",):
                content(host, "/does-not-exist.html", "404.html", 404)
                content(host, "/_subsites/atlas/index.html", "404.html", 404)
                assert request(host, "/.htaccess")[0] == 403
                checks += 1
            redirect("www.enertchad.com", "/contact?topic=ovh", "https://enertchad.com/contact?topic=ovh")
            redirect("enertchad.com", "/", "https://enertchad.com/", secure=False)
            redirect("clients.enertchad.com", "/en/", "https://enertchad.com/boutique/en/clients", secure=False)
            redirect("enertchad.com", "/contact.html", "https://enertchad.com/contact")
            redirect("enertchad.com", "/index.html", "https://enertchad.com/")
            redirect("enertchad.com", "/pole-amont", "https://enertchad.com/amont/", 308)
            redirect("enertchad.com", "/amont", "https://enertchad.com/amont/")
            redirect("enertchad.com", "/enertech/outils?foo=bar", "https://enertchad.com/tchaditech/outils?foo=bar", 308)
            redirect("enertchad.com", "/pole-enertech-outils", "https://enertchad.com/tchaditech/outils", 308)
            redirect("enertchad.com", "/clients", "https://enertchad.com/boutique/clients", 308)
            redirect("enertchad.com", "/aval/boutique", "https://enertchad.com/boutique/", 308)
            redirect("enertchad.com", "/boutique", "https://enertchad.com/boutique/")
            redirect("clients.enertchad.com", "/", "https://enertchad.com/boutique/clients")
            redirect("clients.enertchad.com", "/en/boutique", "https://enertchad.com/boutique/en/")
            redirect("atlas.enertchad.com", "/carte.html", "https://enertchad.com/atlas/carte")
            redirect("atlas.enertchad.com", "/en/sources", "https://enertchad.com/atlas/sources-en")
            redirect("boutique.enertchad.com", "/en/any-path", "https://enertchad.com/boutique/en/")
            for asset in sorted((OUT / "assets").rglob("*")):
                if asset.is_file():
                    relative = asset.relative_to(OUT).as_posix()
                    content("enertchad.com", "/" + relative, relative)
            assert (OUT / "contact-handler.php").is_file(), "contact receiver missing"
            checks += 1

            def cache_control(path):
                connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
                connection.request("GET", path, headers={"Host": "enertchad.com", "X-OVH-Test-HTTPS": "on"})
                response = connection.getresponse()
                response.read()
                cache = response.msg.get_all("Cache-Control")
                expires = response.getheader("Expires")
                connection.close()
                return cache, expires

            # Lot 27 (m10) : les .css/.js de /assets/chrome sont toujours appeles avec ?v=<empreinte>
            # (verify.mjs) et figes un an ; Apache ne voit pas la query string, la regle porte sur
            # l'extension, avec ou sans ?v=. Le reste du dossier (appele sans version) garde une heure.
            immutable = ["public, max-age=31536000, immutable"]
            hour = ["public, max-age=3600, stale-while-revalidate=86400"]
            chrome = sorted(p.name for p in (OUT / "assets/chrome").iterdir() if p.is_file())
            versions = json.loads((ROOT / ".generated/fingerprints.json").read_text())
            assert any(n.endswith(".css") for n in chrome) and any(n.endswith(".js") for n in chrome)
            for name in chrome:
                want = immutable if name.endswith((".css", ".js")) else hour
                paths = ["/assets/chrome/" + name]
                if name in versions:
                    paths.append(paths[0] + "?v=" + versions[name])
                for path in paths:
                    cache, expires = cache_control(path)
                    assert cache == want, (path, cache)
                    assert expires is None, (path, expires)
                    checks += 1
            for name in ("ftx_fr.json", "ftx_en.json", "ener-symbols.svg"):
                assert name in chrome, name + " missing"
                assert cache_control("/assets/chrome/" + name)[0] == hour, name
            # Les autres dossiers gardent leurs regles (police figee, donnees une heure, pages revalidees).
            assert cache_control("/assets/data/document-registry.json")[0] == hour
            assert cache_control("/")[0] == ["public, max-age=0, must-revalidate"]
            checks += 2
            print(json.dumps({"status": "passed", "http_checks": checks, "server": "Apache 2.4"}))
        except Exception:
            if error_log.exists():
                print(error_log.read_text())
            raise
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == "__main__":
    main()

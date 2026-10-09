#!/usr/bin/env python3
"""Verify the packaged export through a real local Apache 2.4 instance."""
import grp
import hashlib
import http.client
import json
import os
import pwd
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
        load = "\n".join(f"LoadModule {name}_module {modules / ('mod_' + name + '.so')}"
                         for name in ("mpm_event", "authz_core", "dir", "mime", "rewrite", "headers", "setenvif"))
        config.write_text(f'''ServerRoot "{temp}"
ServerName localhost
Listen 127.0.0.1:{port}
PidFile "{temp / 'httpd.pid'}"
ErrorLog "{error_log}"
LogLevel warn
{load}
User {pwd.getpwuid(os.getuid()).pw_name}
Group {grp.getgrgid(os.getgid()).gr_name}
TypesConfig /etc/mime.types
AddType text/html .html
SetEnvIf X-OVH-Test-HTTPS ^on$ HTTPS=on
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
                ("enertchad.com", "/investor-center-en", "investor-center-en.html"),
                ("enertchad.com", "/amont/", "amont/index.html"),
                ("enertchad.com", "/amont/calculateur-baril-additionnel", "Calculateur_Baril_Additionnel.html"),
                ("enertchad.com", "/.well-known/security.txt", ".well-known/security.txt"),
                ("clients.enertchad.com", "/", "_subsites/boutique/index.html"),
                ("clients.enertchad.com", "/en/", "_subsites/boutique/en/index.html"),
                ("clients.enertchad.com", "/boutique", "_subsites/boutique/boutique.html"),
                ("clients.enertchad.com", "/en/boutique/", "_subsites/boutique/en/boutique.html"),
                ("clients.enertchad.com", "/sitemap.xml", "_subsites/boutique/sitemap.xml"),
                ("atlas.enertchad.com", "/", "_subsites/atlas/index.html"),
                ("atlas.enertchad.com", "/en/", "_subsites/atlas/en/index.html"),
                ("atlas.enertchad.com", "/carte", "_subsites/atlas/carte.html"),
                ("atlas.enertchad.com", "/en/sources", "_subsites/atlas/en/sources.html"),
                ("atlas.enertchad.com", "/robots.txt", "_subsites/atlas/robots.txt"),
            ]
            for case in cases:
                content(*case)
            for host in ("enertchad.com", "clients.enertchad.com", "atlas.enertchad.com"):
                content(host, "/does-not-exist.html", "404.html", 404)
                content(host, "/_subsites/atlas/index.html", "404.html", 404)
                assert request(host, "/.htaccess")[0] == 403
                checks += 1
            redirect("www.enertchad.com", "/contact?topic=ovh", "https://enertchad.com/contact?topic=ovh")
            redirect("enertchad.com", "/", "https://enertchad.com/", secure=False)
            redirect("clients.enertchad.com", "/en/", "https://clients.enertchad.com/en/", secure=False)
            redirect("enertchad.com", "/contact.html", "https://enertchad.com/contact")
            redirect("enertchad.com", "/index.html", "https://enertchad.com/")
            redirect("enertchad.com", "/pole-amont", "https://enertchad.com/amont/", 308)
            redirect("enertchad.com", "/pole-enertech-outils", "https://enertchad.com/tchaditech/outils", 308)
            redirect("enertchad.com", "/clients", "https://clients.enertchad.com/")
            redirect("enertchad.com", "/atlas/", "https://atlas.enertchad.com/")
            redirect("atlas.enertchad.com", "/carte.html", "https://atlas.enertchad.com/carte")
            redirect("boutique.enertchad.com", "/en/any-path", "https://clients.enertchad.com/en/boutique")
            for asset in sorted((OUT / "assets").rglob("*")):
                if asset.is_file():
                    relative = asset.relative_to(OUT).as_posix()
                    content("enertchad.com", "/" + relative, relative)
            core = "assets/chrome/c_ac04328f0f47.js"
            for host in ("clients.enertchad.com", "atlas.enertchad.com"):
                content(host, "/" + core, core)
            cache = request("enertchad.com", "/" + core)[1].get("Cache-Control")
            assert cache == "public, max-age=3600, stale-while-revalidate=86400", cache
            checks += 1
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

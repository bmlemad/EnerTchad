import re
import unittest
from modernise_site import navigation, mobile, service_offer, SERVICES, projects


class ModernisationTests(unittest.TestCase):
    def test_consolidation_preserves_every_destination_and_controls(self):
        items = []
        for key in 'abcdef':
            items.append(f'<div class="nav-item pn-item"><button class="nav-trigger" aria-controls="nxm-{key}">Old <svg></svg></button><div id="nxm-{key}" role="region" aria-label="Old"><div class="nx-col pn-links"><a href="/{key}"><strong>{key}</strong></a></div><a class="pn-all" href="/{key}-overview">Overview</a></div></div>')
        source = '<div id="navLinks">' + ''.join(items) + '<div class="nx-util-m"><a href="/contact">Contact</a></div></div><div class="nav-cta"></div>'
        for en in (False, True):
            result = navigation(source, en)
            self.assertEqual(result.count('class="nav-trigger"'), 4)
            self.assertTrue(set(re.findall(r'href="([^"]+)"', source)).issubset(re.findall(r'href="([^"]+)"', result)))
            for key in 'abde':
                self.assertIn('aria-controls="nxm-' + key + '"', result)
                self.assertIn('id="nxm-' + key + '"', result)
            self.assertEqual(navigation(result, en), result)

    def test_three_mobile_actions_are_named_and_keep_contact_direct(self):
        source = '<nav id="nezBar">' + ''.join('<a href="/"><svg></svg>Old</a>' for _ in range(5)) + '</nav>'
        for en in (False, True):
            result = mobile(source, en)
            self.assertEqual(result.count('<a '), 3)
            self.assertEqual(result.count('aria-label='), 3)
            self.assertIn('/nos-activites' + ('-en' if en else ''), result)
            self.assertIn('/contact' + ('-en' if en else '') + '#ctForm', result)
            self.assertEqual(mobile(result, en), result)

    def test_all_featured_services_keep_explicit_prerequisites_and_context(self):
        source = '<main><header>Hero</header><section id="conviction">Existing</section></main>'
        for service in SERVICES:
            for en in (False, True):
                result = service_offer(source, service[int(en)], en)
                self.assertIn('service=' + service[2], result)
                self.assertIn('profil=partenariat', result)
                self.assertIn('Company in formation' if en else 'Société en constitution', result)
                self.assertIn('id="conviction"', result)
                self.assertEqual(service_offer(result, service[int(en)], en), result)

    def test_project_cards_preserve_status_and_original_evidence(self):
        source = '<section id="avancement"><div class="et-project-scroll"><table class="et-project-table"><tr><th>Project</th></tr><tr><th scope="row">Project A</th><td>Planned — not operational</td><td>Permits required</td><td><a href="/proof.pdf">Evidence</a></td></tr></table></div></section>'
        result = projects(source, True)
        self.assertIn('class="mod-card"', result)
        self.assertIn('Planned — not operational', result)
        self.assertIn('Permits required', result)
        self.assertIn('<table class="et-project-table">', result)
        self.assertEqual(projects(result, True), result)


if __name__ == '__main__':
    unittest.main()

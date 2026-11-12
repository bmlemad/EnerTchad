# Contrôles rapides du dépôt (une dizaine de secondes) : les mêmes commandes que le flux de mise en ligne
# lance avant la construction. La liste vient du flux lui-même, pour ne pas diverger :
# .github/workflows/corporate-readiness-ovh.yml, étapes « node --test scripts/… » et « python3 scripts/… »
# situées avant « npm ci ». Les contrats navigateur (qa/) demandent une construction complète et un serveur :
# ils restent sur GitHub.
.PHONY: test
test:
	@awk '/run: npm ci/{exit} /^ *(run: )?(node --test|python3) scripts\//{sub(/^ *(run: )?/,"");print}' .github/workflows/corporate-readiness-ovh.yml > .generated-prebuild-checks.txt
	@n=$$(wc -l < .generated-prebuild-checks.txt); [ "$$n" -ge 20 ] || { echo "seulement $$n contrôles lus dans le flux : liste suspecte"; rm -f .generated-prebuild-checks.txt; exit 1; }
	@while read -r c; do $$c > /tmp/et-check.log 2>&1 || { echo "ECHEC : $$c"; tail -20 /tmp/et-check.log; rm -f .generated-prebuild-checks.txt; exit 1; }; done < .generated-prebuild-checks.txt; echo "$$(wc -l < .generated-prebuild-checks.txt) contrôles avant construction : tous passent"; rm -f .generated-prebuild-checks.txt

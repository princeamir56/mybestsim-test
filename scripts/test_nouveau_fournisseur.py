# -*- coding: utf-8 -*-
"""
Test de non-régression : le livrable survit-il à un 19ᵉ fichier fournisseur ?

Pourquoi ce test existe
-----------------------
Le brief décrit un import QUOTIDIEN. Le dépôt doit donc tenir quand les données
changent — et le danger n'est pas le chiffre affiché, qu'on voit, mais la
phrase qui le commente, que personne ne recalcule.

« Les 56 produits à plus de 100 € sont tous des illimités » était vrai le
4 novembre 2026 sur 18 fichiers. Ce n'est pas une loi du marché : c'est une
observation datée. Tant que cette phrase était écrite en dur, le pipeline
était inautomatisable — un nouvel import aurait changé les graphiques sans
changer le texte, et le livrable se serait mis à mentir tout seul.

Ce que fait le test
-------------------
On copie les 18 CSV dans un dossier temporaire et on y ajoute un fournisseur
fictif construit EXPRÈS pour démentir chaque affirmation du dashboard :

  * un forfait à volume limité à plus de 100 €
      -> dément « les produits à plus de 100 € sont tous des illimités »
      -> dément « la barre des 100 € tombe dans l'intervalle vide »
  * un palier de volume inédit (100 Go)
      -> dément « un palier à six valeurs » et « le palier 50 Go »
  * deux lignes strictement identiques hors SKU
      -> dément « aucun doublon exact, même en ignorant le SKU »
      -> dément l'argument de D1 ET celui de D3

On vérifie ensuite que la prose produite a bien CHANGÉ DE CONCLUSION, pas
seulement de nombre. Un test qui contrôlerait uniquement les chiffres laisserait
passer exactement le défaut qu'on cherche à empêcher.

Rien n'est écrit dans le dépôt : tout se passe dans un dossier temporaire.

    python scripts/test_nouveau_fournisseur.py      (ou : npm run test-import)

Code de sortie non nul si un contrôle échoue : utilisable en CI.
"""

from __future__ import annotations

import csv
import glob
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mbs_catalogue import charger, sortie_utf8, COLONNES_ATTENDUES, DOSSIER_CSV  # noqa: E402
from build_site import construire_donnees  # noqa: E402

#: Le 19ᵉ fournisseur, conçu pour être hostile à chaque phrase du dashboard.
LIGNES_HOSTILES = [
    # Un forfait à VOLUME LIMITÉ au-dessus de 100 € : la frontière disparaît.
    ("TST-0001", "TestSIM", "eSIM Japon 100 Go 30 jours", "JP", "Japon",
     "100", "100 Go", "30", "129.90", "EUR", "5G", "oui"),
    # Un palier inédit, qui devient aussi le palier le plus haut.
    ("TST-0002", "TestSIM", "eSIM Japon 50 Go 30 jours", "JP", "Japon",
     "50", "50 Go", "30", "71.50", "EUR", "5G", "non"),
    # Doublon strict de la ligne précédente, SKU mis à part.
    ("TST-0003", "TestSIM", "eSIM Japon 50 Go 30 jours", "JP", "Japon",
     "50", "50 Go", "30", "71.50", "EUR", "5G", "non"),
    ("TST-0004", "TestSIM", "eSIM Europe Illimité 7 jours", "EU", "Europe",
     "", "Illimité", "7", "44.00", "EUR", "4G", "oui"),
]

echecs: list[str] = []


def verifier(nom: str, ok: bool, detail: str, out) -> None:
    if not ok:
        echecs.append(f"{nom} — {detail}")
    print(f"  {'ok  ' if ok else 'ÉCHEC'} {nom}"
          f"{'' if ok else '  — ' + detail}", file=out)


def main() -> None:
    out = sortie_utf8()
    # Référence : le catalogue réel, tel qu'il est aujourd'hui. Le test se
    # compare à lui plutôt qu'à un nombre écrit en dur — sinon il tomberait
    # exactement dans le défaut qu'il est censé interdire.
    avant = construire_donnees(charger())["faits"]
    attendu_fournisseurs = len(glob.glob(os.path.join(DOSSIER_CSV, "*.csv"))) + 1
    tmp = tempfile.mkdtemp(prefix="mbs-import-")
    try:
        for fichier in glob.glob(os.path.join(DOSSIER_CSV, "*.csv")):
            shutil.copy2(fichier, tmp)

        with open(os.path.join(tmp, "testsim.csv"), "w",
                  encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(COLONNES_ATTENDUES)
            w.writerows(LIGNES_HOSTILES)

        # Le chargeur doit accepter le fichier : ses garde-fous visent les
        # données corrompues, pas les données nouvelles.
        df = charger(tmp)
        d = construire_donnees(df)
        F = d["faits"]

        print("\n— Le 19ᵉ fichier est bien pris en compte —", file=out)
        verifier("le fournisseur est détecté",
                 F["fournisseurs"] == attendu_fournisseurs,
                 f"{F['fournisseurs']} au lieu de {attendu_fournisseurs}", out)
        verifier("les lignes sont agrégées",
                 F["lignes"] == avant["lignes"] + len(LIGNES_HOSTILES),
                 f"{F['lignes']} au lieu de "
                 f"{avant['lignes'] + len(LIGNES_HOSTILES)}", out)

        print("\n— Les faits structurels ont basculé —", file=out)
        verifier("« tous des illimités » est devenu faux",
                 F["chers_tous_illimites"] is False, "le booléen n'a pas bougé", out)
        verifier("le palier le plus haut a changé",
                 F["palier_max"] == 100, f"palier_max = {F['palier_max']}", out)
        verifier("les doublons hors SKU sont détectés",
                 F["doublons_hors_sku"] == 2,
                 f"{F['doublons_hors_sku']} lignes", out)

        # Le coeur du test : la PROSE, pas les nombres.
        textes = (
            [x["question"] + x["retenu"] + x["pourquoi"] + x["alternative"]
             for x in d["decisions"]]
            + [x["titre"] + x["texte"] for x in d["pieges"]]
        )
        tout = " ".join(textes)

        print("\n— Les phrases ont changé de conclusion, pas juste de chiffre —", file=out)
        verifier("plus aucune phrase n'affirme « tous des illimités »",
                 "sont tous des illimités" not in tout,
                 "l'affirmation a survécu au démenti", out)
        verifier("plus aucune phrase n'affirme « l'intervalle vide »",
                 "intervalle vide" not in tout,
                 "la frontière des 100 € est affirmée alors qu'elle n'existe plus", out)
        verifier("plus aucune phrase n'affirme « aucun doublon exact »",
                 "Aucun doublon exact" not in tout,
                 "l'absence de doublon est affirmée alors qu'il y en a", out)
        verifier("D1 ne conclut plus « chaque ligne est une référence distincte »",
                 "Chaque ligne est donc une référence" not in tout,
                 "l'argument de D1 a survécu alors que sa prémisse est tombée", out)
        verifier("le nombre de paliers est relu",
                 "palier à 7 valeurs" in tout, "le compte des paliers est figé", out)
        verifier("les doublons sont signalés au lecteur",
                 "doublons" in tout.lower(),
                 "le dashboard ne dit rien des doublons détectés", out)

        print("\n— Aucun nombre figé de l'ancien jeu de données ne subsiste —", file=out)
        # Les valeurs de l'ANCIEN catalogue, relues sur lui et non recopiées :
        # aucune ne doit subsister une fois le 19e fichier ajouté.
        fin = "\u202f"  # espace fine insécable, celle qu'utilise le formatage FR
        perimes = {
            f"{avant['lignes']:,}".replace(",", fin): "total de lignes",
            f"{avant['limites']:,}".replace(",", fin): "forfaits à volume limité",
            f"palier {avant['palier_max']} Go": "palier le plus haut",
        }
        for fige, quoi in perimes.items():
            verifier(f"l'ancien {quoi} (« {fige} ») a disparu de la prose",
                     fige not in tout, "valeur figée détectée", out)

        print("\n" + "=" * 62, file=out)
        if echecs:
            print(f"{len(echecs)} contrôle(s) en échec :", file=out)
            for e in echecs:
                print(f"  - {e}", file=out)
        else:
            print("Le livrable suit les données : prose comprise.", file=out)
        print("=" * 62, file=out)
        out.flush()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    sys.exit(1 if echecs else 0)


if __name__ == "__main__":
    main()

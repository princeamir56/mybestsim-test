# -*- coding: utf-8 -*-
"""
Étape 4/5 — données chiffrées de l'article SEO, extraites du catalogue réel.

L'article de la partie 2 ne doit contenir AUCUN prix inventé. Tous les chiffres
de son tableau comparatif sortent du jeu de données, par ce script, et sont
écrits dans app/src/data/article.json — que Vite empaquette au build.

Comme build_site.py, ce script n'écrit aucun nombre en dur, pas même dans ses
messages : le total de lignes est relu à chaque exécution.

Les itinéraires de croisière sont rapprochés des destinations du catalogue. Ce
rapprochement est un CHOIX éditorial, pas une donnée : il est écrit en clair
ci-dessous et rappelé dans l'article.

    python scripts/donnees_article.py
"""

from __future__ import annotations

import json
import os

import pandas as pd

from mbs_catalogue import charger, sortie_utf8, DOSSIER_DONNEES

# Rapprochement itinéraire -> destinations présentes dans le catalogue.
# Seules les destinations réellement présentes sont retenues ; rien n'est inventé.
ITINERAIRES = [
    ("Méditerranée", ["Espagne", "Italie", "Grèce", "Croatie", "France", "Portugal",
                      "Turquie", "Maroc"]),
    ("Caraïbes", ["Rép. dominicaine", "Mexique", "Colombie"]),
    ("Alaska / Amérique du Nord", ["États-Unis", "Canada"]),
    ("Norvège & fjords", ["Norvège"]),
    ("Baltique & mer du Nord", ["Suède", "Pologne", "Allemagne", "Pays-Bas"]),
]

# Profils d'achat typiques d'un croisiériste : escales, pas de travail à bord.
PROFILS = [(5, 7, "Croisière d'une semaine, usage normal"),
           (10, 15, "Croisière de 10 à 15 jours"),
           (20, 30, "Longue croisière ou gros usage")]


def bloc(sel: pd.DataFrame) -> dict | None:
    """Résumé de prix d'une sélection, ou None si la sélection est vide."""
    if sel.empty:
        return None
    moins_cher = sel.loc[sel["prix"].idxmin()]
    return {
        "offres": int(len(sel)),
        "fournisseurs": int(sel["provider"].nunique()),
        "prix_min": round(float(sel["prix"].min()), 2),
        "prix_median": round(float(sel["prix"].median()), 2),
        "prix_max": round(float(sel["prix"].max()), 2),
        "moins_cher_fournisseur": moins_cher["provider"],
        "moins_cher_produit": moins_cher["product_name"],
    }


def main() -> None:
    out = sortie_utf8()
    df = charger()

    donnees: dict = {
        "source": {
            "lignes": int(len(df)),
            "fournisseurs": int(df["provider"].nunique()),
            "devise": "EUR",
            "avertissement": "Prix relevés dans le catalogue fournisseurs importé par "
                             "MyBestSim. Ce sont des prix de catalogue, susceptibles "
                             "d'évoluer, et non des prix constatés en vente.",
        },
        "itineraires": [],
        "profils": [],
        "zones": [],
    }

    # --- Prix par itinéraire, pour un forfait type 5 Go / 7 jours ------------
    for nom, pays in ITINERAIRES:
        presents = [p for p in pays if p in set(df["country_name"])]
        sel = df[df["country_name"].isin(presents)]
        type5 = sel[(sel["go"] == 5) & (sel["jours"] == 7)]
        entree = {
            "nom": nom,
            "destinations_couvertes": presents,
            "destinations_absentes": [p for p in pays if p not in presents],
            "offres_totales": int(len(sel)),
            "forfait_type": bloc(type5),
            "toutes_offres": bloc(sel),
        }
        donnees["itineraires"].append(entree)

    # --- Prix par profil d'usage, toutes destinations confondues -------------
    for go, jours, libelle in PROFILS:
        sel = df[(df["go"] == go) & (df["jours"] == jours)]
        donnees["profils"].append({
            "libelle": libelle, "go": go, "jours": jours, **(bloc(sel) or {}),
        })

    # --- Les offres régionales, pertinentes pour une croisière multi-pays ----
    for nom in ["Europe", "Méditerranée", "Monde", "Amérique du Nord"]:
        sel = df[df["country_name"] == nom]
        if sel.empty:
            continue
        entree = {"nom": nom, "offres": int(len(sel))}
        for go, jours, _ in PROFILS:
            b = bloc(sel[(sel["go"] == go) & (sel["jours"] == jours)])
            if b:
                entree[f"{go}go_{jours}j"] = b
        illim = bloc(sel[sel["illimite"] & (sel["jours"] == 15)])
        if illim:
            entree["illimite_15j"] = illim
        donnees["zones"].append(entree)

    os.makedirs(DOSSIER_DONNEES, exist_ok=True)
    chemin = os.path.join(DOSSIER_DONNEES, "article.json")
    with open(chemin, "w", encoding="utf-8") as fh:
        json.dump(donnees, fh, ensure_ascii=False, indent=1)

    # --- Aperçu lisible ------------------------------------------------------
    print("=" * 74, file=out)
    print(f"CHIFFRES DE L'ARTICLE — tous extraits des {len(df)} lignes du catalogue", file=out)
    print("=" * 74, file=out)

    print("\n--- Forfait type 5 Go / 7 jours, par itinéraire ---", file=out)
    print(f"\n{'Itinéraire':<28}{'Offres':>8}{'Le moins cher':>15}{'Médian':>10}{'Le plus cher':>14}", file=out)
    print("-" * 74, file=out)
    for it in donnees["itineraires"]:
        b = it["forfait_type"]
        if b:
            print(f"{it['nom']:<28}{b['offres']:>8}{b['prix_min']:>14.2f}€"
                  f"{b['prix_median']:>9.2f}€{b['prix_max']:>13.2f}€", file=out)
        if it["destinations_absentes"]:
            print(f"    (absent du catalogue : {', '.join(it['destinations_absentes'])})", file=out)

    print("\n--- Le moins cher, par itinéraire ---", file=out)
    for it in donnees["itineraires"]:
        b = it["forfait_type"]
        if b:
            print(f"  {it['nom']:<28} {b['moins_cher_fournisseur']} — "
                  f"{b['moins_cher_produit']} à {b['prix_min']:.2f} €", file=out)

    print("\n--- Par profil d'usage, toutes destinations ---", file=out)
    for p in donnees["profils"]:
        print(f"  {p['libelle']:<40} {p['go']} Go / {p['jours']} j : "
              f"de {p['prix_min']:.2f} € à {p['prix_max']:.2f} € "
              f"(médiane {p['prix_median']:.2f} €, {p['offres']} offres)", file=out)

    print("\n--- Offres régionales, utiles sur un itinéraire multi-pays ---", file=out)
    for z in donnees["zones"]:
        print(f"\n  {z['nom']} ({z['offres']} offres)", file=out)
        for k, v in z.items():
            if isinstance(v, dict):
                print(f"    {k:<14} de {v['prix_min']:.2f} € à {v['prix_max']:.2f} € "
                      f"(médiane {v['prix_median']:.2f} €) — le moins cher : "
                      f"{v['moins_cher_fournisseur']}", file=out)

    print(f"\n[écrit] {chemin}", file=out)
    out.flush()


if __name__ == "__main__":
    main()

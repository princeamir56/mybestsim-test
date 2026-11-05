# -*- coding: utf-8 -*-
"""
Chargement canonique du catalogue eSIM MyBestSim.

Tout le reste du projet (profilage, calcul des statistiques, generation du JSON
du dashboard, tableau de prix de l'article) passe par ce module. Objectif : il
n'existe qu'UNE seule facon de lire les CSV, donc les chiffres ne peuvent pas
diverger d'un script a l'autre.

Deux precautions non negociables, documentees dans docs/etape-1-profilage.md :

1. keep_default_na=False
   Sans ce flag, pandas convertit le country_code "NA" (Amerique du Nord) en
   NaN : 192 lignes perdues silencieusement.

2. Lecture integrale en texte (dtype=str), typage explicite ensuite
   Evite toute coercition implicite, notamment sur data_gb dont la valeur vide
   signifie "Illimite" et non "manquant".
"""

from __future__ import annotations

import glob
import os
import sys
import io

import pandas as pd

# --- Chemins -----------------------------------------------------------------

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER_CSV = os.path.join(RACINE, "data", "fournisseurs")
DOSSIER_DOCS = os.path.join(RACINE, "docs")
DOSSIER_SITE = os.path.join(RACINE, "site")
#: Les JSON sont écrits dans les sources de l'app React ; Vite les empaquette
#: au build. Le navigateur ne fait donc toujours aucune requête réseau.
DOSSIER_DONNEES = os.path.join(RACINE, "app", "src", "data")

# --- Constantes metier -------------------------------------------------------

#: Codes qui ne sont PAS des pays ISO-2 mais des zones de couverture.
#: "NA" en fait partie : c'est l'Amerique du Nord, pas une valeur nulle.
ZONES = {
    "EU": "Europe",
    "AS": "Asie",
    "NA": "Amérique du Nord",
    "WW": "Monde",
}

COLONNES_ATTENDUES = [
    "sku", "provider", "product_name", "country_code", "country_name",
    "data_gb", "data_display", "validity_days", "price", "currency",
    "network", "top_up",
]

#: Identite commerciale d'un produit : ce qu'un client reconnait comme "le
#: meme produit", independamment du SKU technique.
CLE_COMMERCIALE = ["provider", "product_name"]

#: Attributs qui justifient qu'un meme nom commercial porte deux prix.
ATTRIBUTS_VARIANTE = ["country_code", "data_gb", "validity_days", "network", "top_up"]

#: Colonnes ajoutees par le chargeur : elles sont derivees, donc exclues de
#: toute recherche de doublon (sinon on compare une colonne avec elle-meme).
COLONNES_DERIVEES = (
    "fichier", "prix", "go", "illimite", "jours", "zone", "portee", "eur_par_go",
)


def sortie_utf8():
    """
    Rend stdout capable d'ecrire de l'UTF-8 sur une console Windows cp1252.

    Sans ca, afficher "Amérique du Nord" produit du charabia et donne
    l'illusion d'un probleme d'encodage des fichiers. Les CSV sont en UTF-8
    valide : c'est la console qui ment. Voir docs/etape-1-profilage.md, §4.F.
    """
    return io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def charger(dossier: str = DOSSIER_CSV) -> pd.DataFrame:
    """
    Charge les 18 CSV fournisseurs en un seul DataFrame typé.

    Colonnes ajoutées :
      fichier       nom du CSV d'origine (tracabilite)
      prix          float, le prix en euros
      go            float ou NaN ; NaN == forfait illimité (ce n'est pas un trou)
      illimite      bool
      jours         int, durée de validité
      zone          bool, True si l'offre couvre une région et non un pays
      portee        "Régional / Monde" ou "Mono-pays"
      eur_par_go    float ou NaN ; NaN pour les illimités (division impossible)
    """
    fichiers = sorted(glob.glob(os.path.join(dossier, "*.csv")))
    if not fichiers:
        raise FileNotFoundError(f"Aucun CSV trouvé dans {dossier}")

    morceaux = []
    for chemin in fichiers:
        bloc = pd.read_csv(
            chemin,
            dtype=str,
            keep_default_na=False,   # <-- le flag qui sauve les 192 "NA"
            encoding="utf-8",
        )
        manquantes = set(COLONNES_ATTENDUES) - set(bloc.columns)
        if manquantes:
            raise ValueError(f"{os.path.basename(chemin)} : colonnes absentes {manquantes}")
        bloc["fichier"] = os.path.basename(chemin)
        morceaux.append(bloc)

    df = pd.concat(morceaux, ignore_index=True)

    # Typage explicite
    df["prix"] = df["price"].astype(float)
    df["go"] = pd.to_numeric(df["data_gb"], errors="coerce")  # "" -> NaN
    df["illimite"] = df["data_gb"].str.strip() == ""
    df["jours"] = df["validity_days"].astype(int)
    df["zone"] = df["country_code"].isin(ZONES)
    df["portee"] = df["zone"].map({True: "Régional / Monde", False: "Mono-pays"})
    df["eur_par_go"] = df["prix"] / df["go"]  # NaN quand illimité, voulu

    _verifier(df)
    return df


def _verifier(df: pd.DataFrame) -> None:
    """
    Garde-fous qui transforment en erreur bruyante toute dérive des données
    d'import. Mieux vaut un script qui refuse de tourner qu'un dashboard qui
    affiche un chiffre faux sans prévenir.
    """
    assert len(df) > 0, "catalogue vide"
    assert df["sku"].is_unique, "des SKU sont dupliqués"
    assert (df["currency"] == "EUR").all(), "devise autre que EUR détectée"
    assert df["prix"].gt(0).all(), "prix nul ou négatif détecté"
    assert df["country_code"].str.strip().ne("").all(), "country_code vide détecté"
    # Le coeur du piège n°1 : si ce test casse, c'est que les "NA" ont sauté.
    assert (df["country_code"] == "NA").any(), \
        "aucun country_code 'NA' : pandas les a convertis en NaN (keep_default_na)"
    # Le coeur du piège n°2 : data_gb vide doit toujours vouloir dire "Illimité".
    assert (df.loc[df["illimite"], "data_display"] == "Illimité").all(), \
        "une ligne sans data_gb n'est pas marquée Illimité : vraie valeur manquante"


# --- Faits structurels -------------------------------------------------------

def faits(df: pd.DataFrame) -> dict:
    """
    Calcule tout ce que la prose du livrable AFFIRME sur les donnees.

    Pourquoi cette fonction existe
    ------------------------------
    Un dashboard peut sans risque afficher un chiffre faux de maniere visible :
    on le voit. Le vrai danger est la phrase qui commente le chiffre, parce
    qu'elle, personne ne la recalcule. "Les 56 produits a plus de 100 EUR sont
    tous des illimites" etait vrai le 4 novembre 2026 sur 18 fichiers ; ce
    n'est pas une loi du marche, c'est une observation datee.

    Tant que ces phrases etaient ecrites en dur, le pipeline etait
    inautomatisable : un 19e fournisseur aurait change les chiffres sans
    changer les phrases, et le livrable se serait mis a mentir tout seul.

    Chaque cle ci-dessous alimente donc une formulation du dashboard, de
    l'article ou des sorties texte. Les booleens `*_tous` servent a choisir
    entre "tous, sans exception" et "X sur Y" : l'insight survit a un import
    qui le dementirait, il change juste de forme.
    """
    lim = df[~df["illimite"]]
    unl = df[df["illimite"]]
    chers = df[df["prix"] > 100]

    # Colonnes reellement issues du CSV : les seules ou chercher un doublon.
    brutes = [c for c in df.columns if c not in COLONNES_DERIVEES]
    hors_sku = [c for c in brutes if c != "sku"]

    # --- Couples (fournisseur, nom) portant plusieurs prix -------------------
    groupes = df.groupby(CLE_COMMERCIALE)
    n_prix = groupes["price"].nunique()
    multi = n_prix[n_prix > 1].index

    if len(multi):
        sel = df.set_index(CLE_COMMERCIALE).loc[multi].reset_index()
        signature = sel.groupby(CLE_COMMERCIALE)[ATTRIBUTS_VARIANTE].nunique()
        explique = (signature > 1).any(axis=1)
        bornes = sel.groupby(CLE_COMMERCIALE)["prix"].agg(["min", "max"])
        ecart_pct = (bornes["max"] - bornes["min"]) / bornes["min"] * 100
        multi_lignes = int(len(sel))
        multi_expliques = int(explique.sum())
        multi_ecart_median = float(ecart_pct.median())
        multi_ecart_max = float(ecart_pct.max())
    else:
        multi_lignes = multi_expliques = 0
        multi_ecart_median = multi_ecart_max = 0.0

    # --- Les colonnes de texte sont-elles derivables des colonnes typees ? ---
    attendu = df["go"].map(lambda g: "Illimité" if pd.isna(g) else f"{g:.0f} Go")
    coherent = df.apply(
        lambda r: (r["data_display"] in r["product_name"])
        and (f"{r['validity_days']} jours" in r["product_name"])
        and (r["country_name"] in r["product_name"]),
        axis=1,
    )

    # --- Les zones occupent-elles vraiment le haut du classement ? -----------
    volumes = df["country_name"].value_counts()
    noms_zones = set(ZONES.values())
    tete = set(volumes.head(len(ZONES)).index)

    paliers = sorted(int(v) for v in lim["go"].dropna().unique())

    return {
        # Volumetrie
        "lignes": int(len(df)),
        "fournisseurs": int(df["provider"].nunique()),
        "fichiers": int(df["fichier"].nunique()),
        "limites": int(len(lim)),
        "illimites": int(len(unl)),
        "illimites_fournisseurs": int(unl["provider"].nunique()),
        "illimites_tous_fournisseurs": bool(
            unl["provider"].nunique() == df["provider"].nunique()
        ),

        # D1 - ce qu'est "un produit"
        "references": int(groupes.ngroups),
        "sku_uniques": bool(df["sku"].is_unique),
        "doublons_exacts": int(df.duplicated(subset=brutes, keep=False).sum()),
        "doublons_hors_sku": int(df.duplicated(subset=hors_sku, keep=False).sum()),

        # D3 - variantes ou donnees sales
        "multi_prix_couples": int(len(multi)),
        "multi_prix_lignes": multi_lignes,
        "multi_prix_expliques": multi_expliques,
        "multi_prix_ecart_median": multi_ecart_median,
        "multi_prix_ecart_max": multi_ecart_max,

        # Piege 1 - les "NA"
        "na_lignes": int((df["country_code"] == "NA").sum()),

        # Piege A - la frontiere des 100 EUR
        "chers": int(len(chers)),
        "chers_illimites": int(chers["illimite"].sum()),
        "chers_30j": int((chers["jours"] == 30).sum()),
        "chers_zone": int(chers["zone"].sum()),
        "chers_tous_illimites": bool(len(chers) and chers["illimite"].all()),
        "chers_tous_30j": bool(len(chers) and (chers["jours"] == 30).all()),
        "chers_tous_zone": bool(len(chers) and chers["zone"].all()),
        "chers_si_illimites_exclus": int((lim["prix"] > 100).sum()),
        "prix_pile_100": int((df["prix"] == 100).sum()),
        "max_limite": float(lim["prix"].max()),

        # Piege C - la grille de paliers
        "paliers": paliers,
        "nb_paliers": len(paliers),
        "palier_max": paliers[-1] if paliers else None,
        "go_moyen": float(lim["go"].mean()),
        "go_median": float(lim["go"].median()),

        # Piege E - aucun texte libre a parser
        "data_display_exceptions": int((attendu != df["data_display"]).sum()),
        "product_name_exceptions": int((~coherent).sum()),

        # D4 - pays contre zones
        "destinations": int(df["country_name"].nunique()),
        "pays": int(df.loc[~df["zone"], "country_code"].nunique()),
        "zones": len(ZONES),
        "noms_zones": list(ZONES.values()),
        "zones_lignes": int(df["zone"].sum()),
        "zones_part": float(df["zone"].mean() * 100),
        "zones_en_tete": bool(tete == noms_zones),
        "prix_moyen_zone": float(df.loc[df["zone"], "prix"].mean()),
        "prix_moyen_mono": float(df.loc[~df["zone"], "prix"].mean()),
    }


MOTS_FR = ("zéro", "un", "deux", "trois", "quatre", "cinq",
           "six", "sept", "huit", "neuf", "dix")


def mot_fr(v) -> str:
    """
    Petit nombre en toutes lettres, comme l'exige une phrase francaise.

    Pendant du helper `mot` cote React (app/src/lib/format.js) : les comptes
    du livrable etant desormais derives des donnees, sans lui une phrase
    rendrait "5 cas" la ou l'editorial dit "cinq cas".
    """
    v = int(v)
    return MOTS_FR[v] if 0 <= v <= 10 else str(v)


def liste_fr(elements) -> str:
    """
    Enumere en francais : "a, b et c". Utilise partout ou une phrase cite une
    liste calculee (les zones, les traits d'un profil), de sorte que la
    typographie reste correcte quel que soit le nombre d'elements.
    """
    elements = [str(e) for e in elements if e]
    if not elements:
        return ""
    if len(elements) == 1:
        return elements[0]
    return ", ".join(elements[:-1]) + " et " + elements[-1]


def accord(n: int, total: int, tous: str, partiel: str) -> str:
    """
    Choisit entre une formulation absolue et une formulation chiffree.

        accord(56, 56, "tous des illimités", "des illimités")
        -> "tous des illimités"
        accord(51, 56, "tous des illimités", "des illimités")
        -> "51 sur 56 des illimités"

    C'est le mecanisme qui permet a une affirmation forte de survivre a un
    import qui la dementirait : elle se degrade en fait chiffre au lieu de
    devenir un mensonge.
    """
    return tous if n == total else f"{n} sur {total} {partiel}"


if __name__ == "__main__":
    out = sortie_utf8()
    d = charger()
    print(f"{len(d)} lignes · {d['provider'].nunique()} fournisseurs · "
          f"{d['illimite'].sum()} illimités · {d['zone'].sum()} offres régionales",
          file=out)
    out.flush()

# -*- coding: utf-8 -*-
"""
Étape 3 — agrégation du catalogue vers les sources de l'application React.

Les CSV ne sont JAMAIS lus par le navigateur. Ce script les agrège au moment du
build en un seul objet JSON, que Vite empaquette ensuite dans le bundle :

    data/fournisseurs/*.csv  ->  build_site.py  ->  app/src/data/catalogue.json
                                                      |
                                                      v
                                             vite build + prérendu  ->  site/

Conséquence : pas de backend, pas de base, aucun aller-retour réseau vers les
données, et une prévisualisation locale identique au site déployé.

AUCUN NOMBRE N'EST ÉCRIT EN DUR ICI — ni dans les chiffres, ni dans les phrases
qui les commentent. Les textes du panneau « Décisions » et des « pièges » sont
rédigés à partir de `faits()` (voir mbs_catalogue.py), de sorte qu'un nouveau
fichier fournisseur déposé dans data/fournisseurs/ mette à jour la prose en
même temps que les graphiques. C'est ce qui rend ce script rejouable sans
relecture humaine — donc automatisable.

    python scripts/build_site.py
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re

import pandas as pd

from mbs_catalogue import (
    charger, sortie_utf8, faits, accord, liste_fr, mot_fr,
    DOSSIER_DONNEES, ZONES,
    CLE_COMMERCIALE,
)

CLE = CLE_COMMERCIALE
COMBO = ["country_name", "data_display", "validity_days"]


def r(x, n=2):
    """Arrondi JSON-safe (pandas/numpy -> float Python)."""
    return None if pd.isna(x) else round(float(x), n)


def fr(x, n=0) -> str:
    """Nombre au format français : espace fine insécable et virgule décimale.

    Les textes des décisions sont rédigés ici puis affichés tels quels par
    l'interface. Sans ce passage, le panneau affiche « 5056 produits » et
    « -14.5 % » au milieu d'une page par ailleurs entièrement francisée.
    """
    s = f"{float(x):,.{n}f}".replace(",", " ").replace(".", ",")
    return s


def insecables(v):
    """
    Pose les espaces insécables de la typographie française dans toute la prose.

    Sans ça, le navigateur peut couper entre un nombre et son unité : sur un
    téléphone, le panneau affichait « (−14,5 » en fin de ligne et « %). » seul
    au début de la suivante. Appliqué à la fin de la construction, donc à toute
    phrase présente et future, plutôt que cas par cas.
    """
    if isinstance(v, str):
        v = re.sub(r"(?<=\d) (?=(?:€|%|Go\b|jours\b))", "\u00a0", v)
        v = re.sub(r" (?=[:;?!»])", "\u00a0", v)
        return v.replace("« ", "«\u00a0")
    if isinstance(v, list):
        return [insecables(x) for x in v]
    if isinstance(v, dict):
        return {k: insecables(x) for k, x in v.items()}
    return v


def distribution_prix(df: pd.DataFrame, pas: int = 5) -> dict:
    """Histogramme des prix par classes de `pas` euros, limités et illimités."""
    debut = int(df["prix"].min() // pas * pas)
    fin = int(df["prix"].max() // pas * pas)
    classes = []
    for de in range(debut, fin + pas, pas):
        s = df[(df["prix"] >= de) & (df["prix"] < de + pas)]
        classes.append({"de": de, "a": de + pas,
                        "limites": int((~s["illimite"]).sum()),
                        "illimites": int(s["illimite"].sum())})
    return {"pas": pas, "classes": classes}


#: En dessous, une médiane par case ne dit rien : la case reste vide.
MIN_OFFRES_CASE = 3


def matrice_prix(df: pd.DataFrame) -> dict:
    """
    Fournisseur × palier : prix médian comparé à la médiane du marché.

    C'est la lecture que le classement global écrase : un fournisseur moyen
    partout peut être le moins cher du marché sur un seul palier. Les lignes
    sont triées du plus avantageux au moins avantageux en moyenne.
    """
    paliers = [f"{int(g)} Go" for g in sorted(df["go"].dropna().unique())]
    if df["illimite"].any():
        paliers.append("Illimité")
    marche = df.groupby("data_display")["prix"].median()
    lignes = []
    for nom, s in df.groupby("provider"):
        cases = []
        for pal in paliers:
            c = s[s["data_display"] == pal]
            if len(c) < MIN_OFFRES_CASE:
                cases.append(None)
                continue
            med = float(c["prix"].median())
            cases.append({"prix": r(med), "ecart": r((med / marche[pal] - 1) * 100, 1),
                          "offres": int(len(c))})
        valides = [c["ecart"] for c in cases if c]
        lignes.append({"nom": nom, "cases": cases,
                       "moyenne": r(sum(valides) / len(valides), 1) if valides else None})
    lignes.sort(key=lambda l: (l["moyenne"] is None, l["moyenne"]))
    return {"colonnes": paliers, "marche": [r(marche[p]) for p in paliers], "lignes": lignes}


def construire_donnees(df: pd.DataFrame) -> dict:
    # Les faits structurels : tout ce que les PHRASES du dashboard affirment.
    # Les chiffres etaient deja calcules ; ce sont les commentaires qui
    # restaient figes sur l'import du 4 novembre 2026.
    F = faits(df)

    lim = df[~df["illimite"]]
    unl = df[df["illimite"]]
    chers = df[df["prix"] > 100]
    mini, maxi = df.loc[df["prix"].idxmin()], df.loc[df["prix"].idxmax()]

    # --- Qui gagne chaque combinaison (destination x volume x durée) ---------
    gagnants = df.loc[df.groupby(COMBO)["prix"].idxmin()]
    victoires = gagnants["provider"].value_counts()
    presence = df.groupby("provider")[COMBO].apply(lambda d: len(d.drop_duplicates()))

    # --- Écarts de prix sur produit identique --------------------------------
    ec = df.groupby(COMBO)["prix"].agg(["min", "max", "count"])
    ec = ec[ec["count"] > 1].copy()
    ec["pct"] = (ec["max"] - ec["min"]) / ec["min"] * 100
    ec["eur"] = ec["max"] - ec["min"]

    # --- Profil des combinaisons ou l'ecart de prix est le plus eleve --------
    # L'interface commentait « ce sont tous des illimites 30 jours regionaux ».
    # C'est une observation, pas une regle : on la recalcule a chaque build et
    # on ne la formule que si elle tient encore.
    sommet = ec.nlargest(5, "eur")
    if len(sommet):
        noms_zones = set(ZONES.values())
        tous_illimites = all(d == "Illimité" for _, d, _ in sommet.index)
        tous_zone = all(c in noms_zones for c, _, _ in sommet.index)
        durees = {v for _, _, v in sommet.index}

        nom = "illimités" if tous_illimites else "offres"
        qualifs = []
        if tous_zone:
            qualifs.append("régionaux" if tous_illimites else "régionales")
        if len(durees) == 1:
            qualifs.append(f"de {durees.pop()} jours")

        if qualifs or tous_illimites:
            resume_top = (f"Les {mot_fr(len(sommet))} cas les plus rentables sont tous "
                          f"des {nom} {' '.join(qualifs)}.".replace("  ", " ")
                          .replace(" .", "."))
        else:
            resume_top = (f"Les {mot_fr(len(sommet))} cas les plus rentables n'ont pas "
                          f"de profil commun.")
    else:
        resume_top = None

    # --- Contrefactuel D3 : déduplication au prix le plus bas ----------------
    dedup = df.sort_values("prix").groupby(CLE, as_index=False).first()

    # --- Formulations qui dependent de ce que les donnees disent aujourd'hui -
    # Chacune a une version "forte" et une version de repli chiffree : si un
    # import futur dement l'observation, la phrase se degrade au lieu de
    # devenir fausse.
    # D1 — l'argument lui-meme depend du resultat de la deduplication. Si des
    # lignes tombent, "chaque ligne est une reference distincte" ne se deduit
    # plus : la phrase doit changer de conclusion, pas seulement de nombre.
    if F["doublons_hors_sku"] == 0:
        pourquoi_d1 = (
            f"Les {fr(F['lignes'])} SKU sont uniques, et surtout : dédupliquer sur "
            f"toutes les colonnes <em>en ignorant le SKU</em> ne retire "
            f"<strong>aucune</strong> ligne. Chaque ligne est donc une référence "
            f"vendable distincte, ce qui correspond aussi à ce que le fournisseur nous importe."
        )
    else:
        pourquoi_d1 = (
            f"Les {fr(F['lignes'])} SKU sont uniques, mais dédupliquer sur toutes les "
            f"colonnes <em>en ignorant le SKU</em> retire "
            f"<strong>{fr(F['doublons_hors_sku'])}</strong> lignes. L'argument qui "
            f"fondait ce choix ne tient plus : ces lignes sont des SKU distincts, pas "
            f"des produits distincts. Le compte reste celui de l'import, mais il "
            f"demande un arbitrage explicite."
        )

    # D3 — meme logique : de vrais doublons rendent "aucune deduplication"
    # indefendable en l'etat, et la decision doit le dire.
    if F["doublons_hors_sku"] == 0:
        retenu_d3 = "Variantes réelles, donc aucune déduplication"
        phrase_doublons = "Aucun doublon exact n'existe, même en ignorant le SKU."
    else:
        retenu_d3 = (f"Variantes réelles, sauf {fr(F['doublons_hors_sku'])} lignes "
                     f"à trancher")
        phrase_doublons = (
            f"<strong>{fr(F['doublons_hors_sku'])} lignes sont strictement identiques "
            f"en ignorant le SKU</strong> : celles-là sont de vrais doublons, et "
            f"l'argument ci-dessous ne les couvre pas."
        )
    phrase_zones_tete = (
        f"Comme les zones sont mécaniquement les {F['zones']} plus gros volumes, "
        f"les mélanger placerait {F['zones']} fausses « destinations » en tête de "
        f"toute répartition géographique."
        if F["zones_en_tete"]
        else f"Les mélanger ferait concourir {fr(F['zones_lignes'])} offres de "
             f"couverture ({fr(F['zones_part'], 1)} % du catalogue) dans le même "
             f"classement que des offres mono-pays."
    )
    phrase_alt_d4 = (
        f"« {F['destinations']} destinations », avec "
        f"{liste_fr(F['noms_zones'])} aux {F['zones']} premières places, "
        f"par construction."
        if F["zones_en_tete"]
        else f"« {F['destinations']} destinations », en comparant des pays à des "
             f"zones de couverture."
    )

    # Le piege le plus couteux du jeu de donnees : la frontiere des 100 EUR.
    if F["chers_tous_illimites"]:
        titre_chers = (f"Les {fr(F['chers'])} produits à plus de 100 € sont tous "
                       f"des illimités")
        ouverture_chers = "Tous, sans exception"
    else:
        titre_chers = (f"{fr(F['chers_illimites'])} des {fr(F['chers'])} produits à "
                       f"plus de 100 € sont des illimités")
        ouverture_chers = f"{fr(F['chers_illimites'])} sur {fr(F['chers'])}"
    phrase_frontiere = (
        "La barre des 100 € tombe pile dans l'intervalle vide entre les deux "
        "familles de produits : "
        if F["chers_tous_illimites"]
        else "La barre des 100 € ne sépare plus les deux familles de produits : "
    )
    detail_chers = ", ".join([
        accord(F["chers_30j"], F["chers"],
               "tous en validité 30 jours", "en validité 30 jours"),
        accord(F["chers_zone"], F["chers"],
               "tous régionaux", "régionaux"),
    ])

    ratio_go = F["go_moyen"] / F["go_median"] if F["go_median"] else 0
    exceptions_texte = F["data_display_exceptions"] + F["product_name_exceptions"]
    if exceptions_texte:
        phrase_texte_libre = "Vérifié ligne à ligne, et ce n'est plus vrai partout"
    elif F["doublons_hors_sku"]:
        phrase_texte_libre = "Pour les colonnes de texte, vérifié ligne à ligne"
    else:
        phrase_texte_libre = "Vérifié ligne à ligne"
    compte_exceptions = (
        "aucune exception"
        if exceptions_texte == 0
        else f"{fr(exceptions_texte)} exception"
             f"{'s' if exceptions_texte > 1 else ''}"
    )
    rappel_doublons = (
        ""
        if F["doublons_hors_sku"] == 0
        else f"{fr(F['doublons_hors_sku'])} lignes sont dupliquées en ignorant le SKU "
             f"(voir D3). "
    )
    titre_texte_libre = (
        "Aucun doublon, et aucun texte libre à analyser"
        if F["doublons_hors_sku"] == 0 and exceptions_texte == 0
        else "Doublons et colonnes de texte : l'état réel"
    )

    f = []
    for nom, s in df.groupby("provider"):
        sl = s[~s["illimite"]]
        f.append({
            "nom": nom,
            "produits": int(len(s)),
            "part": r(len(s) / len(df) * 100, 1),
            "prix_moyen": r(s["prix"].mean()),
            "prix_median": r(s["prix"].median()),
            "prix_min": r(s["prix"].min()),
            "prix_max": r(s["prix"].max()),
            "illimites": int(s["illimite"].sum()),
            "eur_go_median": r(sl["eur_par_go"].median(), 3),
            "part_5g": r((s["network"] == "5G").mean() * 100, 1),
            "part_topup": r((s["top_up"] == "oui").mean() * 100, 1),
            "destinations": int(s["country_name"].nunique()),
            "victoires": int(victoires.get(nom, 0)),
            "presence": int(presence[nom]),
            "taux_victoire": r(victoires.get(nom, 0) / presence[nom] * 100, 1),
        })
    f.sort(key=lambda x: -x["produits"])

    paliers = []
    for go, s in lim.groupby("go"):
        paliers.append({
            "label": f"{int(go)} Go", "go": int(go), "offres": int(len(s)),
            "prix_median": r(s["prix"].median()), "eur_go_median": r(s["eur_par_go"].median(), 3),
            "prix_min": r(s["prix"].min()), "prix_max": r(s["prix"].max()),
        })
    paliers.append({
        "label": "Illimité", "go": None, "offres": int(len(unl)),
        "prix_median": r(unl["prix"].median()), "eur_go_median": None,
        "prix_min": r(unl["prix"].min()), "prix_max": r(unl["prix"].max()),
    })

    prime = []
    for j in sorted(df["jours"].unique()):
        a = df[df["illimite"] & (df["jours"] == j)]["prix"].median()
        b = df[~df["illimite"] & (df["jours"] == j)]["prix"].median()
        prime.append({"jours": int(j), "illimite": r(a), "limite": r(b),
                      "ratio": r(a / b), "offres": int((df["illimite"] & (df["jours"] == j)).sum())})

    portee = []
    for nom, s in df.groupby("portee"):
        portee.append({
            "nom": nom, "offres": int(len(s)), "part": r(len(s) / len(df) * 100, 1),
            "prix_moyen": r(s["prix"].mean()), "prix_median": r(s["prix"].median()),
            "go_moyen": r(s["go"].mean(), 1), "part_illim": r(s["illimite"].mean() * 100, 1),
        })
    portee.sort(key=lambda x: -x["offres"])

    zones = []
    for nom, s in df[df["zone"]].groupby("country_name"):
        zones.append({"nom": nom, "offres": int(len(s)), "prix_median": r(s["prix"].median()),
                      "part_illim": r(s["illimite"].mean() * 100, 1)})
    zones.sort(key=lambda x: -x["offres"])

    return insecables({
        "meta": {
            "genere_le": dt.date.today().isoformat(),
            "lignes": int(len(df)),
            "fichiers": int(df["fichier"].nunique()),
            "devise": "EUR",
            "destinations": int(df["country_name"].nunique()),
            "pays": int(df.loc[~df["zone"], "country_code"].nunique()),
            "zones": len(ZONES),
        },
        # Les faits structurels, exposes tels quels : ils servent a l'interface
        # pour formuler ses phrases, et au verificateur pour controler que le
        # HTML servi dit bien ce que les donnees disent.
        "faits": F,
        # ---- Les six statistiques imposées par le brief ---------------------
        "kpi": {
            "total": int(len(df)),
            "fournisseurs": int(df["provider"].nunique()),
            "plus_100": int(len(chers)),
            "prix_min": r(mini["prix"]), "prix_max": r(maxi["prix"]),
            "produit_min": f"{mini['provider']} · {mini['product_name']}",
            "produit_max": f"{maxi['provider']} · {maxi['product_name']}",
            "amplitude": r(maxi["prix"] / mini["prix"], 1),
            "go_moyen": r(lim["go"].mean()), "go_median": r(lim["go"].median(), 0),
            "go_base": int(len(lim)),
            "prix_moyen": r(df["prix"].mean()), "prix_median": r(df["prix"].median()),
            "prix_moyen_limite": r(lim["prix"].mean()), "prix_median_limite": r(lim["prix"].median()),
            "prix_moyen_illimite": r(unl["prix"].mean()), "prix_median_illimite": r(unl["prix"].median()),
            "illimites": int(len(unl)), "part_illimites": r(df["illimite"].mean() * 100, 1),
            "max_limite": r(lim["prix"].max()),
            # Permet a l'interface de choisir entre « tous illimites » et un
            # decompte, sans jamais affirmer plus que ce que disent les donnees.
            "plus_100_illimites": F["chers_illimites"],
            "plus_100_30j": F["chers_30j"],
            "plus_100_zone": F["chers_zone"],
            "plus_100_tous_illimites": F["chers_tous_illimites"],
            "part_5g": r((df["network"] == "5G").mean() * 100, 1),
            "part_topup": r((df["top_up"] == "oui").mean() * 100, 1),
        },
        "fournisseurs": f,
        "paliers": paliers,
        "prime": prime,
        "portee": portee,
        "zones": zones,
        "ecarts": {
            "combinaisons": int(len(ec)),
            "median_pct": r(ec["pct"].median(), 1), "median_eur": r(ec["eur"].median()),
            "max_pct": r(ec["pct"].max(), 1), "max_eur": r(ec["eur"].max()),
            "total_combinaisons": int(df.groupby(COMBO).ngroups),
            "top": [{"libelle": f"{c} · {d} · {v} j", "min": r(row["min"]), "max": r(row["max"]),
                     "eur": r(row["eur"]), "pct": r(row["pct"], 0)}
                    for (c, d, v), row in ec.nlargest(5, "eur").iterrows()],
            # Decrit le profil REEL des cas ou comparer rapporte le plus. La
            # page affirmait « tous des illimites 30 jours regionaux » : le
            # 5e est un 50 Go, l'affirmation etait deja inexacte.
            "top_resume": resume_top,
        },
        # ---- Le panneau « Décisions & qualité des données » -----------------
        "decisions": [
            {
                "id": "D1",
                "question": "Qu'est-ce qu'« un produit » ?",
                "retenu": f"{fr(len(df))} produits, un par SKU",
                "pourquoi": pourquoi_d1,
                "alternative": f"{fr(df.groupby(CLE).ngroups)} références commerciales "
                               f"(fournisseur + nom), soit {fr(len(df) - df.groupby(CLE).ngroups)} "
                               f"de moins (−{fr((len(df) - df.groupby(CLE).ngroups) / len(df) * 100, 1)} %).",
            },
            {
                "id": "D2",
                "question": f"Que faire des {fr(F['illimites'])} forfaits illimités "
                            f"dans la moyenne de Go ?",
                "retenu": f"Exclus : la moyenne est calculée sur les {fr(len(lim))} forfaits à volume limité",
                "pourquoi": "Compter un forfait illimité pour 0 Go est factuellement faux : "
                            "l'illimité, c'est <em>plus</em> de data, pas moins. Les compter "
                            "pour zéro ferait <em>baisser</em> la moyenne alors que l'offre "
                            "est supérieure. Leur volume n'est pas inconnu, il est indéfini, "
                            "d'où un KPI explicitement libellé.",
                "alternative": f"{fr(df['go'].fillna(0).mean(), 2)} Go en les comptant pour zéro, "
                               f"soit {fr((1 - df['go'].fillna(0).mean() / lim['go'].mean()) * 100, 1)} % "
                               f"de moins, alors que cet écart est créé de toutes pièces.",
            },
            {
                "id": "D3",
                "question": f"{fr(F['multi_prix_couples'])} produits portent plusieurs "
                            f"prix : variantes ou données sales ?",
                "retenu": retenu_d3,
                "pourquoi": f"{phrase_doublons} {fr(F['multi_prix_expliques'])} des "
                            f"{fr(F['multi_prix_couples'])} couples se distinguent par un "
                            f"attribut réel (4G/5G, rechargeable). L'écart intra-couple "
                            f"médian est de {fr(F['multi_prix_ecart_median'], 1)} % : c'est "
                            f"une amplitude de pricing, pas une faute de saisie. Et sur un "
                            f"comparateur, qu'un même produit existe à plusieurs prix "
                            f"<em>est</em> l'information.",
                "alternative": f"En ne gardant que le prix le plus bas par référence : "
                               f"{fr(len(dedup))} produits, prix moyen {fr(dedup['prix'].mean(), 2)} €, "
                               f"et surtout <strong>{(dedup['prix'] > 100).sum()} produits à plus "
                               f"de 100 € au lieu de {len(chers)}</strong>.",
            },
            {
                "id": "D4",
                "question": "Les zones géographiques comptent-elles comme des pays ?",
                "retenu": f"Non : {df.loc[~df['zone'], 'country_code'].nunique()} pays et "
                          f"{len(ZONES)} zones présentés séparément",
                "pourquoi": f"Une eSIM « Europe » et une eSIM « Espagne » ne sont pas "
                            f"deux lignes d'un même classement. {phrase_zones_tete} "
                            f"L'écart de prix confirme deux marchés distincts : "
                            f"{fr(F['prix_moyen_zone'], 2)} € contre "
                            f"{fr(F['prix_moyen_mono'], 2)} €.",
                "alternative": phrase_alt_d4,
            },
        ],
        "pieges": [
            {"titre": "country_code « NA » n'est pas une valeur nulle",
             "texte": f"{fr(F['na_lignes'])} lignes portent le code <code>NA</code> pour "
                      f"« Amérique du Nord ». Lues avec les réglages par défaut de pandas, "
                      f"elles deviennent <code>NaN</code>, comme le confirme le contre-test : exactement "
                      f"{fr(F['na_lignes'])} disparitions silencieuses. Le chargeur impose "
                      f"<code>keep_default_na=False</code>, et une assertion fait échouer le "
                      f"build si jamais ces lignes venaient à manquer."},
            {"titre": titre_chers,
             "texte": f"{ouverture_chers}, et ils sont {detail_chers}. Le forfait à volume limité le "
                      f"plus cher du catalogue s'arrête à "
                      f"<strong>{fr(F['max_limite'], 2)} €</strong>. {phrase_frontiere}"
                      f"« nettoyer » les lignes sans volume répondrait "
                      f"<strong>{F['chers_si_illimites_exclus']}</strong> à une question "
                      f"imposée du brief, sans qu'on s'en aperçoive."},
            {"titre": f"La moyenne de Go vaut {fr(ratio_go, 1)} fois la médiane",
             "texte": f"<code>data_gb</code> n'est pas continu : c'est un palier à "
                      f"{F['nb_paliers']} valeurs. Moyenne {fr(F['go_moyen'], 2)} Go, "
                      f"<strong>médiane {fr(F['go_median'])} Go</strong>, un écart qui vient du "
                      f"palier {F['palier_max']} Go. Publier la seule moyenne donne une image "
                      f"fausse du catalogue, d'où la distribution complète affichée plus bas."},
            {"titre": titre_texte_libre,
             "texte": f"{rappel_doublons}{phrase_texte_libre} : <code>data_display</code> est dérivable de "
                      f"<code>data_gb</code>, et <code>product_name</code> reflète pays + "
                      f"volume + validité, avec {compte_exceptions} sur {fr(F['lignes'])} lignes. "
                      f"Tout est déjà dans les colonnes typées, mais il fallait le prouver "
                      f"avant de s'appuyer dessus."},
        ],
        "limites": [
            "Ce jeu de données est un <strong>catalogue</strong>, pas un journal de "
            "transactions : il ne contient ni ventes, ni popularité, ni marge. Aucun "
            "classement « des plus vendus » n'est calculable, et aucun n'est affiché.",
            "Les prix ne sont pas confrontés aux sites des fournisseurs : ce dashboard "
            "décrit le catalogue importé, pas le marché réel.",
            "Le périmètre exact de chaque offre (opérateur hôte, politique d'usage "
            "raisonnable sur les illimités) n'est pas dans les données.",
        ],
        "distribution": distribution_prix(df),
        "matrice": matrice_prix(df),
    })


def main() -> None:
    """Écrit le JSON agrégé dans les sources de l'app React.

    Le rendu des pages appartient désormais à Vite. La frontière reste la
    même : les CSV sont lus ici, au build, et jamais par le navigateur.
    """
    out = sortie_utf8()
    df = charger()
    donnees = construire_donnees(df)

    os.makedirs(DOSSIER_DONNEES, exist_ok=True)
    chemin = os.path.join(DOSSIER_DONNEES, "catalogue.json")

    # La date dit quand les DONNÉES ont changé, pas quand le script a tourné.
    # Sinon le passage quotidien de la CI produirait un commit par jour, et
    # « mis à jour le » mentirait sur un catalogue identique à la veille.
    if os.path.exists(chemin):
        with open(chemin, encoding="utf-8") as fh:
            ancien = json.load(fh)
        sans_date = lambda d: {**d, "meta": {**d["meta"], "genere_le": None}}
        if sans_date(ancien) == sans_date(donnees):
            donnees["meta"]["genere_le"] = ancien["meta"]["genere_le"]

    with open(chemin, "w", encoding="utf-8") as fh:
        json.dump(donnees, fh, ensure_ascii=False, indent=1)

    print(f"[ok] {chemin}  ({os.path.getsize(chemin) / 1024:.0f} Ko)", file=out)
    print(f"     {donnees['meta']['lignes']} lignes agrégées · "
          f"{donnees['kpi']['fournisseurs']} fournisseurs · "
          f"généré le {donnees['meta']['genere_le']}", file=out)
    out.flush()


if __name__ == "__main__":
    main()

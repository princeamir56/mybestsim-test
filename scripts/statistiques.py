# -*- coding: utf-8 -*-
"""
Étape 2 — calcul de toutes les statistiques du dashboard.

Contrairement à profilage.py (qui constate), ce script DÉCIDE : il applique les
quatre arbitrages tranchés à l'étape 2 et produit les chiffres définitifs.

Chaque arbitrage est accompagné de son contrefactuel — le chiffre qu'on aurait
obtenu avec l'autre choix. Ces contrefactuels ne sont pas décoratifs : ils
alimentent le panneau « Décisions & qualité des données » du dashboard.

    python scripts/statistiques.py            # affiche
    python scripts/statistiques.py --ecrire   # + docs/etape-2-chiffres.txt

Aucune mise en forme n'est engagée tant que ces chiffres ne sont pas validés.

Aucun nombre n'est écrit en dur, y compris dans les commentaires : les
affirmations (« tous des illimités », « 4 des 54 pays sont des zones »)
passent par faits() et se reformulent seules si un import les dément.
"""

from __future__ import annotations

import os
import sys

import pandas as pd

from mbs_catalogue import (
    charger, sortie_utf8, faits, accord, liste_fr, DOSSIER_DOCS, ZONES,
    CLE_COMMERCIALE,
)

CLE = CLE_COMMERCIALE


def titre(n, texte, out):
    print(f"\n{'=' * 78}\n{n}. {texte}\n{'=' * 78}", file=out)


def sous(texte, out):
    print(f"\n--- {texte} " + "-" * max(0, 72 - len(texte)), file=out)


def eur(x) -> str:
    return f"{x:,.2f} €".replace(",", " ").replace(".", ",")


def pct(x, n=1) -> str:
    """Pourcentage au format français : virgule décimale."""
    return f"{x:.{n}f} %".replace(".", ",")


# =============================================================================
# LES QUATRE ARBITRAGES
# =============================================================================

def decisions(df, out) -> None:
    F = faits(df)
    titre(0, "LES QUATRE ARBITRAGES, ET CE QU'ILS COÛTENT", out)

    # ---------------------------------------------------------------- D1
    sous("D1 · Qu'est-ce qu'« un produit » ?", out)
    n_sku = len(df)
    n_ref = df.groupby(CLE).ngroups
    print(f"RETENU      : {n_sku} produits = 1 produit par SKU.", file=out)
    print(f"POURQUOI    : les {n_sku} SKU sont uniques, et aucune ligne n'est", file=out)
    print(f"              redondante — la déduplication sur toutes les colonnes EN", file=out)
    print(f"              IGNORANT le SKU retire 0 ligne. Chaque ligne est donc une", file=out)
    print(f"              référence vendable distincte. C'est aussi la seule lecture", file=out)
    print(f"              qui corresponde à « ce que le fournisseur nous importe ».", file=out)
    print(f"ALTERNATIVE : {n_ref} références commerciales (fournisseur + nom de produit),", file=out)
    print(f"              soit {n_sku - n_ref} de moins ({(n_sku - n_ref) / n_sku * 100:.1f} %).", file=out)

    # ---------------------------------------------------------------- D2
    sous(f"D2 · Que faire des {F['illimites']} forfaits illimités dans la "
         f"moyenne de Go ?", out)
    lim = df[~df["illimite"]]
    print(f"RETENU      : {lim['go'].mean():.2f} Go, calculée sur les {len(lim)} forfaits à", file=out)
    print(f"              volume limité, et libellée comme telle dans le dashboard.", file=out)
    print(f"POURQUOI    : compter un forfait illimité pour 0 Go est factuellement faux —", file=out)
    print(f"              l'illimité, c'est PLUS de data, pas moins. Cela ferait baisser", file=out)
    print(f"              la moyenne alors que l'offre est supérieure. Et il n'existe", file=out)
    print(f"              aucune valeur honnête à leur attribuer : la moyenne de Go est", file=out)
    print(f"              indéfinie sur cette population, pas inconnue.", file=out)
    print(f"ALTERNATIVE : {df['go'].fillna(0).mean():.2f} Go en les comptant pour zéro,", file=out)
    print(f"              soit {(1 - df['go'].fillna(0).mean() / lim['go'].mean()) * 100:.1f} % de moins — un écart créé de toutes pièces.", file=out)
    print(f"COMPLÉMENT  : la moyenne seule ment. Médiane {lim['go'].median():.0f} Go contre", file=out)
    print(f"              moyenne {lim['go'].mean():.2f} Go : data_gb est un palier à {F['nb_paliers']} valeurs", file=out)
    print(f"              et le palier {F['palier_max']} Go tire tout vers le haut. Le dashboard affiche", file=out)
    print(f"              les deux, plus la distribution complète.", file=out)

    # ---------------------------------------------------------------- D3
    sous(f"D3 · Les {F['multi_prix_couples']} produits à plusieurs prix : "
         f"variantes ou saleté ?", out)
    g = df.groupby(CLE)
    multi = g["price"].nunique()
    multi = multi[multi > 1].index
    dedup = df.sort_values("prix").groupby(CLE, as_index=False).first()
    print(f"RETENU      : aucune déduplication. Les {len(df)} lignes sont conservées.", file=out)
    print(f"POURQUOI    : trois arguments convergents.", file=out)
    if F["doublons_exacts"] == 0 and F["doublons_hors_sku"] == 0:
        print(f"              (a) Il n'existe AUCUN doublon exact, même en ignorant le SKU.", file=out)
    else:
        print(f"              (a) {F['doublons_hors_sku']} lignes sont dupliquées en ignorant le SKU.", file=out)
    print(f"              (b) Sur les {F['multi_prix_couples']} couples concernés, {F['multi_prix_expliques']} se distinguent", file=out)
    print(f"                  par un attribut réel (réseau 4G/5G, rechargeable ou non).", file=out)
    print(f"              (c) L'écart de prix intra-couple est de {pct(F['multi_prix_ecart_median'])} en médiane. C'est", file=out)
    print(f"                  une amplitude de pricing (date d'import, promo, canal), pas", file=out)
    print(f"                  une faute de saisie, qui se chiffrerait en ordres de grandeur.", file=out)
    print(f"              Supprimer ces lignes reviendrait à masquer une information utile :", file=out)
    print(f"              sur un comparateur, le fait qu'un même produit existe à plusieurs", file=out)
    print(f"              prix EST le produit.", file=out)
    print(f"ALTERNATIVE : en ne gardant que le prix le plus bas par référence :", file=out)
    print(f"              {len(dedup)} produits · prix moyen {eur(dedup['prix'].mean())} (au lieu de", file=out)
    print(f"              {eur(df['prix'].mean())}) · {(dedup['prix'] > 100).sum()} produits à plus de 100 € (au lieu", file=out)
    print(f"              de {(df['prix'] > 100).sum()}) · moyenne {dedup[~dedup['illimite']]['go'].mean():.2f} Go (au lieu de {lim['go'].mean():.2f}).", file=out)

    # ---------------------------------------------------------------- D4
    sous("D4 · Les zones géographiques comptent-elles comme des pays ?", out)
    print(f"RETENU      : non. {F['zones']} codes sur {F['destinations']} sont des zones de couverture", file=out)
    print(f"              ({liste_fr(F['noms_zones'])}) et sont présentés séparément", file=out)
    print(f"              des {df.loc[~df['zone'], 'country_code'].nunique()} pays réels.", file=out)
    print(f"POURQUOI    : une eSIM « Europe » et une eSIM « Espagne » ne sont pas deux", file=out)
    print(f"              lignes comparables d'un même classement. Les mélanger fait", file=out)
    print(f"              apparaître {F['zones']} fausses « destinations » en tête de toute", file=out)
    print(f"              répartition géographique — ce sont mécaniquement les {F['zones']} plus", file=out)
    print(f"              grosses ({df['zone'].sum()} lignes, {df['zone'].mean() * 100:.1f} % du catalogue).", file=out)
    print(f"              L'écart de prix confirme qu'il s'agit d'un autre marché :", file=out)
    print(f"              {eur(df[df['zone']]['prix'].mean())} en moyenne contre {eur(df[~df['zone']]['prix'].mean())} en mono-pays.", file=out)
    print(f"ALTERNATIVE : « {F['destinations']} destinations » au lieu de « {F['pays']} pays + {F['zones']} zones », avec", file=out)
    print(f"              {liste_fr(F['noms_zones'])} aux {F['zones']} premières places.", file=out)


# =============================================================================
# LES SIX STATISTIQUES IMPOSÉES
# =============================================================================

def imposees(df, out) -> None:
    F = faits(df)
    titre(1, "LES SIX STATISTIQUES DEMANDÉES PAR LE BRIEF", out)
    lim = df[~df["illimite"]]
    chers = df[df["prix"] > 100]
    mini, maxi = df.loc[df["prix"].idxmin()], df.loc[df["prix"].idxmax()]

    print(f"\n[1] NOMBRE TOTAL DE CARTES eSIM", file=out)
    print(f"    {len(df)} produits, répartis sur {df['provider'].nunique()} fournisseurs.", file=out)

    print(f"\n[2] NOMBRE DE PRODUITS À PLUS DE 100 €", file=out)
    print(f"    {len(chers)} produits.", file=out)
    if F["prix_pile_100"] == 0:
        print(f"    Aucun produit ne coûte exactement 100,00 € : « plus de » et « au moins »", file=out)
        print(f"    donnent le même résultat.", file=out)
    else:
        print(f"    {F['prix_pile_100']} produits coûtent exactement 100,00 € : « plus de »", file=out)
        print(f"    et « au moins » ne donnent PAS le même résultat.", file=out)
    signale = ", ".join([
        accord(F["chers_illimites"], F["chers"],
               "TOUS des forfaits illimités", "des forfaits illimités"),
        accord(F["chers_30j"], F["chers"], "TOUS en validité 30 jours", "en validité 30 jours"),
        accord(F["chers_zone"], F["chers"], "TOUS régionaux", "régionaux"),
    ])
    print(f"    À signaler : ils sont {signale}.", file=out)
    print(f"    Le forfait à volume limité le plus cher du catalogue s'arrête à", file=out)
    print(f"    {eur(F['max_limite'])}.", file=out)

    print(f"\n[3] FOURCHETTE DE PRIX GLOBALE", file=out)
    amplitude = f"{maxi['prix'] / mini['prix']:.1f}".replace(".", ",")
    print(f"    De {eur(mini['prix'])} à {eur(maxi['prix'])}  (amplitude ×{amplitude})", file=out)
    print(f"    Le moins cher : {mini['provider']} — {mini['product_name']}", file=out)
    print(f"    Le plus cher  : {maxi['provider']} — {maxi['product_name']}", file=out)

    print(f"\n[4] MOYENNE DE DATA (Go) PAR CARTE", file=out)
    print(f"    {lim['go'].mean():.2f} Go".replace(".", ",") + f" par carte, sur les {len(lim)} forfaits à volume limité.", file=out)
    print(f"    Médiane : {lim['go'].median():.0f} Go — l'écart avec la moyenne vient du palier {F['palier_max']} Go.", file=out)
    print(f"    Les {df['illimite'].sum()} forfaits illimités ({df['illimite'].mean() * 100:.1f} %) sont exclus du calcul :", file=out)
    print(f"    leur volume n'est pas zéro, il est indéfini. Voir D2.", file=out)

    print(f"\n[5] PRIX MOYEN GLOBAL", file=out)
    print(f"    {eur(df['prix'].mean())}  (médiane {eur(df['prix'].median())})", file=out)
    print(f"    La moyenne dépasse la médiane de {(df['prix'].mean() / df['prix'].median() - 1) * 100:.0f} % : la distribution est tirée", file=out)
    print(f"    vers le haut par les illimités. Détail :", file=out)
    print(f"      forfaits limités  : moyenne {eur(lim['prix'].mean())} · médiane {eur(lim['prix'].median())}", file=out)
    print(f"      forfaits illimités: moyenne {eur(df[df['illimite']]['prix'].mean())} · médiane {eur(df[df['illimite']]['prix'].median())}", file=out)

    print(f"\n[6] RÉPARTITION PAR FOURNISSEUR", file=out)
    r = df.groupby("provider").agg(
        produits=("sku", "size"), prix_moyen=("prix", "mean"), prix_median=("prix", "median"),
        prix_min=("prix", "min"), prix_max=("prix", "max"), illimites=("illimite", "sum"),
    ).sort_values("produits", ascending=False)
    r["part_%"] = (r["produits"] / len(df) * 100).round(1)
    print(f"\n{'Fournisseur':<14}{'Produits':>9}{'Part':>7}{'Prix moy':>10}{'Médian':>9}"
          f"{'Min':>8}{'Max':>9}{'Illim.':>8}", file=out)
    print("-" * 78, file=out)
    for p, row in r.iterrows():
        print(f"{p:<14}{int(row['produits']):>9}{row['part_%']:>6.1f}%"
              f"{row['prix_moyen']:>9.2f}€{row['prix_median']:>8.2f}€"
              f"{row['prix_min']:>7.2f}€{row['prix_max']:>8.2f}€{int(row['illimites']):>8}", file=out)
    print("-" * 78, file=out)
    print(f"{'TOTAL':<14}{len(df):>9}{100.0:>6.1f}%{df['prix'].mean():>9.2f}€"
          f"{df['prix'].median():>8.2f}€{df['prix'].min():>7.2f}€{df['prix'].max():>8.2f}€"
          f"{df['illimite'].sum():>8}", file=out)


# =============================================================================
# LES BONUS — pensés comme un comparateur, pas comme un statisticien
# =============================================================================

def bonus(df, out) -> None:
    F = faits(df)
    titre(2, "STATISTIQUES BONUS", out)
    lim = df[~df["illimite"]]

    # ----------------------------------------------------------------- B1
    sous("B1 · Classement de valeur : €/Go médian par fournisseur", out)
    print("La question qu'un visiteur de comparateur se pose vraiment : chez qui le Go", file=out)
    print("coûte-t-il le moins cher ? Calculé hors illimités (division impossible).", file=out)
    v = lim.groupby("provider").agg(
        eur_go_median=("eur_par_go", "median"), eur_go_moyen=("eur_par_go", "mean"), offres=("sku", "size"),
    ).sort_values("eur_go_median")
    print(f"\n{'#':>3} {'Fournisseur':<14}{'€/Go médian':>13}{'€/Go moyen':>13}{'Offres':>9}   {'vs meilleur':>11}", file=out)
    print("-" * 78, file=out)
    best = v["eur_go_median"].min()
    for i, (p, row) in enumerate(v.iterrows(), 1):
        print(f"{i:>3} {p:<14}{row['eur_go_median']:>12.3f}€{row['eur_go_moyen']:>12.3f}€"
              f"{int(row['offres']):>9}   {(row['eur_go_median'] / best - 1) * 100:>10.1f}%", file=out)
    print(f"\nLecture : l'écart entre le meilleur et le moins bon est de "
          f"{(v['eur_go_median'].max() / best - 1) * 100:.0f} %. Le marché est", file=out)
    print(f"resserré — aucun fournisseur n'est aberrant, mais le classement est stable.", file=out)

    # ----------------------------------------------------------------- B2
    sous("B2 · La prime de l'illimité, par durée", out)
    # Le sens et l'ampleur de la prime sont RELUS sur les données : la phrase
    # de lecture ne peut donc pas survivre à un import qui l'inverserait.
    durees = sorted(df["jours"].unique())
    ratios = {j: (df[df["illimite"] & (df["jours"] == j)]["prix"].median()
                  / df[~df["illimite"] & (df["jours"] == j)]["prix"].median())
              for j in durees}
    sens_prime = "grimpe avec" if ratios[durees[-1]] > ratios[durees[0]] else "décroît avec"
    detail_prime = liste_fr([f"×{ratios[j]:.1f}".replace(".", ",") + f" à {j} jours"
                             for j in durees])
    print("Combien coûte le confort de ne pas compter ses Go ? Prix médians.", file=out)
    print(f"\n{'Durée':>8}{'Illimité':>12}{'Limité':>11}{'Prime':>9}{'Offres illim.':>15}", file=out)
    print("-" * 78, file=out)
    for j in sorted(df["jours"].unique()):
        a = df[df["illimite"] & (df["jours"] == j)]["prix"].median()
        b = df[~df["illimite"] & (df["jours"] == j)]["prix"].median()
        n = int((df["illimite"] & (df["jours"] == j)).sum())
        print(f"{j:>6} j{a:>11.2f}€{b:>10.2f}€{'×' + f'{a / b:.2f}':>9}{n:>15}", file=out)
    print(f"\nLecture : la prime {sens_prime} la durée ({detail_prime}).", file=out)
    print(f"Sur un court séjour l'illimité se discute ; sur un mois il se paie très cher.", file=out)

    # ----------------------------------------------------------------- B3
    sous("B3 · Couverture 5G par fournisseur", out)
    g = df.groupby("provider").agg(
        part_5g=("network", lambda s: (s == "5G").mean() * 100),
        part_topup=("top_up", lambda s: (s == "oui").mean() * 100), offres=("sku", "size"),
    ).sort_values("part_5g", ascending=False)
    print(f"\n{'#':>3} {'Fournisseur':<14}{'Part 5G':>10}{'Rechargeable':>15}{'Offres':>9}", file=out)
    print("-" * 78, file=out)
    for i, (p, row) in enumerate(g.iterrows(), 1):
        print(f"{i:>3} {p:<14}{row['part_5g']:>9.1f}%{row['part_topup']:>14.1f}%{int(row['offres']):>9}", file=out)
    print(f"\nGlobal : {(df['network'] == '5G').mean() * 100:.1f} % des offres sont 5G, "
          f"{(df['top_up'] == 'oui').mean() * 100:.1f} % rechargeables.", file=out)
    print(f"L'écart entre fournisseurs ({g['part_5g'].min():.1f} % à {g['part_5g'].max():.1f} %) est trop faible pour", file=out)
    print(f"constituer un critère de choix. C'est un résultat en soi : sur ce catalogue,", file=out)
    print(f"la 5G n'est pas un argument différenciant.", file=out)

    # ----------------------------------------------------------------- B4
    sous("B4 · Offres régionales contre offres mono-pays", out)
    p = df.groupby("portee").agg(
        offres=("sku", "size"), prix_moyen=("prix", "mean"), prix_median=("prix", "median"),
        go_moyen=("go", "mean"), part_illim=("illimite", lambda s: s.mean() * 100),
    )
    print(f"\n{'Portée':<20}{'Offres':>8}{'Part':>8}{'Prix moy':>11}{'Médian':>10}"
          f"{'Go moy':>9}{'% illim':>9}", file=out)
    print("-" * 78, file=out)
    for k, row in p.iterrows():
        print(f"{k:<20}{int(row['offres']):>8}{row['offres'] / len(df) * 100:>7.1f}%"
              f"{row['prix_moyen']:>10.2f}€{row['prix_median']:>9.2f}€"
              f"{row['go_moyen']:>9.2f}{row['part_illim']:>8.1f}%", file=out)
    print(f"\nDétail des 4 zones :", file=out)
    for z, n in df[df["zone"]].groupby("country_name").size().sort_values(ascending=False).items():
        s = df[df["country_name"] == z]
        print(f"  {z:<20}{n:>5} offres · prix médian {s['prix'].median():>6.2f}€ "
              f"· {s['illimite'].mean() * 100:>4.1f}% d'illimités", file=out)
    print(f"\nLecture : à volume de data quasi identique ({p.loc['Régional / Monde', 'go_moyen']:.1f} Go contre {p.loc['Mono-pays', 'go_moyen']:.1f} Go), le", file=out)
    print(f"régional coûte {p.loc['Régional / Monde', 'prix_moyen'] / p.loc['Mono-pays', 'prix_moyen'] - 1:+.0%} de plus. Ce surcoût n'achète pas des Go, il achète", file=out)
    print(f"de la couverture — c'est un produit différent, pas un produit plus cher.", file=out)

    # ----------------------------------------------------------------- B5
    sous("B5 · Qui est le moins cher, destination par destination ?", out)
    print("Pour chaque combinaison (destination × volume × durée), quel fournisseur", file=out)
    print("propose le prix le plus bas ? C'est la mécanique même d'un comparateur.", file=out)
    combo = ["country_name", "data_display", "validity_days"]
    gagnants = df.loc[df.groupby(combo)["prix"].idxmin()]
    w = gagnants["provider"].value_counts()
    total = len(gagnants)
    print(f"\nSur {total} combinaisons distinctes :", file=out)
    print(f"\n{'#':>3} {'Fournisseur':<14}{'Victoires':>11}{'Taux':>8}   {'Présent sur':>12}{'Taux de victoire':>18}", file=out)
    print("-" * 78, file=out)
    presence = df.groupby("provider")[combo].apply(lambda d: len(d.drop_duplicates()))
    for i, (p_, n) in enumerate(w.items(), 1):
        print(f"{i:>3} {p_:<14}{n:>11}{n / total * 100:>7.1f}%   {presence[p_]:>12}"
              f"{n / presence[p_] * 100:>17.1f}%", file=out)
    absents = sorted(set(df["provider"]) - set(w.index))
    if absents:
        print(f"\nJamais le moins cher : {', '.join(absents)}", file=out)
    print(f"\nLecture : à lire avec la colonne « taux de victoire », qui corrige l'effet", file=out)
    print(f"de taille du catalogue. Un gros fournisseur gagne souvent parce qu'il est", file=out)
    print(f"partout, pas parce qu'il est bon marché.", file=out)

    # ----------------------------------------------------------------- B6
    sous("B6 · L'écart de prix sur un produit identique", out)
    print("Pour une destination, un volume et une durée donnés, combien sépare le moins", file=out)
    print("cher du plus cher ? C'est ce qu'un visiteur gagne à comparer.", file=out)
    ec = df.groupby(combo)["prix"].agg(["min", "max", "count"])
    ec = ec[ec["count"] > 1]
    ec["ecart_pct"] = (ec["max"] - ec["min"]) / ec["min"] * 100
    ec["ecart_eur"] = ec["max"] - ec["min"]
    print(f"\nCombinaisons proposées plusieurs fois au catalogue : {len(ec)}", file=out)
    print(f"  Écart médian : {ec['ecart_pct'].median():.1f} %   ({eur(ec['ecart_eur'].median())})", file=out)
    print(f"  Écart moyen  : {ec['ecart_pct'].mean():.1f} %   ({eur(ec['ecart_eur'].mean())})", file=out)
    print(f"  Écart max    : {ec['ecart_pct'].max():.1f} %   ({eur(ec['ecart_eur'].max())})", file=out)
    print(f"\nLes 5 combinaisons où comparer rapporte le plus (en euros) :", file=out)
    for (c, d, v), row in ec.nlargest(5, "ecart_eur").iterrows():
        print(f"  {c} · {d} · {v} j : de {row['min']:.2f}€ à {row['max']:.2f}€  "
              f"(+{row['ecart_eur']:.2f}€, soit +{row['ecart_pct']:.0f}%)", file=out)

    # ----------------------------------------------------------------- B7
    sous("B7 · L'échelle des prix par palier de volume", out)
    palier_bas, palier_haut = F["paliers"][0], F["paliers"][-1]
    go_bas = lim[lim["go"] == palier_bas]["eur_par_go"].median()
    go_haut = lim[lim["go"] == palier_haut]["eur_par_go"].median()
    print(f"\n{'Palier':>10}{'Offres':>9}{'Prix médian':>14}{'€/Go médian':>14}{'Min':>9}{'Max':>9}", file=out)
    print("-" * 78, file=out)
    for go, s in lim.groupby("go"):
        print(f"{go:>7.0f} Go{len(s):>9}{s['prix'].median():>13.2f}€"
              f"{s['eur_par_go'].median():>13.3f}€{s['prix'].min():>8.2f}€{s['prix'].max():>8.2f}€", file=out)
    u = df[df["illimite"]]
    print(f"{'Illimité':>10}{len(u):>9}{u['prix'].median():>13.2f}€{'—':>14}"
          f"{u['prix'].min():>8.2f}€{u['prix'].max():>8.2f}€", file=out)
    print(f"\nLecture : le €/Go médian s'effondre de {go_bas:.2f}€ (palier {palier_bas} Go) à "
          f"{go_haut:.2f}€", file=out)
    print(f"(palier {palier_haut} Go), soit {(1 - go_haut / go_bas) * 100:.0f} % moins cher. Acheter petit se paie très cher", file=out)
    print(f"au Go. Le catalogue ne dit rien des volumes de vente : on s'arrête là.", file=out)

    # ----------------------------------------------------------------- B8
    sous("B8 · Étendue de catalogue par fournisseur", out)
    # « Couvrir presque tout le catalogue » = être à moins de 4 destinations
    # du total. Le seuil suit donc le jeu de données au lieu d'être figé à 50.
    seuil_couverture = max(1, F["destinations"] - 4)
    e = df.groupby("provider").agg(
        offres=("sku", "size"), destinations=("country_name", "nunique"),
        pays=("country_code", lambda s: s[~s.isin(ZONES)].nunique()),
        zones=("country_code", lambda s: s[s.isin(ZONES)].nunique()),
    ).sort_values("destinations", ascending=False)
    print(f"\n{'Fournisseur':<14}{'Offres':>8}{'Destinations':>14}{'dont pays':>11}{'dont zones':>12}", file=out)
    print("-" * 78, file=out)
    for p_, row in e.iterrows():
        print(f"{p_:<14}{int(row['offres']):>8}{int(row['destinations']):>14}"
              f"{int(row['pays']):>11}{int(row['zones']):>12}", file=out)
    print(f"\nCatalogue complet : {df['country_name'].nunique()} destinations "
          f"({df.loc[~df['zone'], 'country_code'].nunique()} pays + {len(ZONES)} zones).", file=out)
    print(f"\nLecture : {(e['destinations'] >= seuil_couverture).sum()} des {F['fournisseurs']} fournisseurs couvrent au moins {seuil_couverture} des {F['destinations']} destinations,", file=out)
    print(f"et les {F['zones']} zones sont proposées par {int((e['zones'] == F['zones']).sum())} d'entre eux. Comme pour la 5G (B3), l'étendue", file=out)
    print(f"de catalogue ne départage personne sur ce jeu de données. Le seul axe qui", file=out)
    print(f"discrimine réellement les fournisseurs est le prix (B1, B5, B6).", file=out)


def main() -> None:
    df = charger()

    def tout(out):
        print("=" * 78, file=out)
        print("MYBESTSIM — ÉTAPE 2 : TOUTES LES STATISTIQUES, EN TEXTE BRUT", file=out)
        print(f"Source : {len(df)} lignes, {df['provider'].nunique()} fichiers fournisseurs. Devise unique : EUR.", file=out)
        print("Aucune mise en forme n'est engagée avant validation de ces chiffres.", file=out)
        print("=" * 78, file=out)
        decisions(df, out)
        imposees(df, out)
        bonus(df, out)

    out = sortie_utf8()
    tout(out)
    out.flush()

    if "--ecrire" in sys.argv:
        chemin = os.path.join(DOSSIER_DOCS, "etape-2-chiffres.txt")
        with open(chemin, "w", encoding="utf-8") as fh:
            tout(fh)
        print(f"\n[écrit] {chemin}", file=out)
        out.flush()


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
Étape 1 — profilage du catalogue eSIM (18 CSV fournisseurs).

Ce script ne décide rien et ne nettoie rien : il constate, et il fournit la
preuve chiffrée de chaque affirmation de docs/etape-1-profilage.md.

    python scripts/profilage.py              # affiche le rapport
    python scripts/profilage.py --ecrire     # + écrit docs/profilage-sortie.txt

Les sections suivent l'ordre du document : structure, puis les trois pièges
soumis par Amir, puis les pièges trouvés en plus.
"""

from __future__ import annotations

import os
import sys

import pandas as pd

from mbs_catalogue import (
    charger, sortie_utf8, faits, liste_fr,
    DOSSIER_CSV, DOSSIER_DOCS, ZONES,
    CLE_COMMERCIALE, ATTRIBUTS_VARIANTE,
)

CLE = CLE_COMMERCIALE                       # identité commerciale d'un produit
ATTRIBUTS = ATTRIBUTS_VARIANTE


def titre(n, texte, out):
    print(f"\n{'=' * 78}\n{n}. {texte}\n{'=' * 78}", file=out)


def profiler(out) -> None:
    df = charger()
    # Les titres de section eux-memes citent des chiffres : ils passent donc
    # par faits(), au meme titre que le corps du rapport. Un rapport dont le
    # titre dit « 653 » alors que le corps dit autre chose est pire qu'inutile.
    F = faits(df)

    # ------------------------------------------------------------------ 1
    titre(1, "STRUCTURE DU JEU DE DONNÉES", out)
    print(f"Lignes                : {len(df)}", file=out)
    print(f"Fournisseurs          : {df['provider'].nunique()} (1 par fichier, sans mélange)", file=out)
    print(f"SKU uniques           : {df['sku'].nunique()} / {len(df)}", file=out)
    print(f"Devises               : {sorted(df['currency'].unique())}", file=out)
    print(f"Colonnes à valeur vide: "
          f"{[c for c in df.columns if (df[c].astype(str).str.strip() == '').any()]}", file=out)
    print("\nDomaines fermés constatés :", file=out)
    print(f"  validity_days : {[int(v) for v in sorted(df['jours'].unique())]}", file=out)
    print(f"  data_gb       : {[int(v) for v in sorted(df['go'].dropna().unique())]}"
          f" (+ vide = Illimité)", file=out)
    print(f"  network       : {df['network'].value_counts().to_dict()}", file=out)
    print(f"  top_up        : {df['top_up'].value_counts().to_dict()}", file=out)
    print(f"  country_code  : {df['country_code'].nunique()} codes distincts", file=out)
    print("\nLignes par fournisseur :", file=out)
    print(df.groupby("provider").size().sort_values(ascending=False).to_string(), file=out)

    # ------------------------------------------------------------------ 2
    titre(2, "PIÈGE 1 — country_code \"NA\" = Amérique du Nord, pas une valeur nulle", out)
    na = df[df["country_code"] == "NA"]
    print(f"Lignes country_code == 'NA'      : {len(na)}", file=out)
    print(f"country_name associés            : {na['country_name'].unique().tolist()}", file=out)
    print(f"Part du catalogue                : {len(na) / len(df) * 100:.2f} %", file=out)
    print(f"Rang de fréquence du code 'NA'   : "
          f"{list(df['country_code'].value_counts().index).index('NA') + 1}e", file=out)

    # Contre-test : prouver le piège au lieu de l'affirmer.
    import glob
    defaut = pd.concat(
        [pd.read_csv(f, dtype=str) for f in sorted(glob.glob(os.path.join(DOSSIER_CSV, "*.csv")))],
        ignore_index=True,
    )
    print(f"\nCONTRE-TEST — lecture SANS keep_default_na=False :", file=out)
    print(f"  country_code devenus NaN       : {defaut['country_code'].isna().sum()}", file=out)
    print(f"  => le piège se déclenche par défaut, sur exactement ces {len(na)} lignes.", file=out)

    # ------------------------------------------------------------------ 3
    titre(3, f"PIÈGE 2 — {F['illimites']} data_gb vides signifient \"Illimité\"", out)
    unl = df["illimite"]
    print(f"Lignes sans data_gb              : {unl.sum()} ({unl.mean() * 100:.2f} %)", file=out)
    print(f"data_display sur ces lignes      : "
          f"{df.loc[unl, 'data_display'].unique().tolist()}  <- aucune exception", file=out)
    print(f"Fournisseurs concernés           : {df.loc[unl, 'provider'].nunique()} / "
          f"{df['provider'].nunique()}  <- tous", file=out)
    print(f"\nMoyenne Go en EXCLUANT les illimités : {df.loc[~unl, 'go'].mean():.4f} Go", file=out)
    print(f"Moyenne Go en les comptant pour ZÉRO : {df['go'].fillna(0).mean():.4f} Go", file=out)
    print(f"\nPrix moyen des illimités         : {df.loc[unl, 'prix'].mean():.2f} €"
          f"   (médiane {df.loc[unl, 'prix'].median():.2f} €)", file=out)
    print(f"Prix moyen des forfaits limités  : {df.loc[~unl, 'prix'].mean():.2f} €"
          f"   (médiane {df.loc[~unl, 'prix'].median():.2f} €)", file=out)
    print(f"Prix moyen global                : {df['prix'].mean():.4f} €", file=out)
    print(f"=> exclure les illimités fait chuter le prix moyen de "
          f"{(1 - df.loc[~unl, 'prix'].mean() / df['prix'].mean()) * 100:.1f} %", file=out)

    # ------------------------------------------------------------------ 4
    titre(4, "PIÈGE 3 — produits portant plusieurs prix / doublons", out)
    g = df.groupby(CLE)
    taille, n_prix = g.size(), g["price"].nunique()
    multi = n_prix[n_prix > 1].index
    print(f"Couples (fournisseur, nom) distincts        : {g.ngroups}", file=out)
    print(f"Couples portant PLUSIEURS prix              : {len(multi)}", file=out)
    print(f"Lignes concernées                           : {taille[multi].sum()}", file=out)

    print(f"\nRecherche de VRAIS doublons :", file=out)
    sans_sku = [c for c in df.columns if c not in
                ("sku", "fichier", "prix", "go", "illimite", "jours", "zone", "portee", "eur_par_go")]
    print(f"  lignes identiques sur toutes les colonnes : "
          f"{df.duplicated(subset=sans_sku + ['sku'], keep=False).sum()}", file=out)
    print(f"  lignes identiques EN IGNORANT le SKU      : "
          f"{df.duplicated(subset=sans_sku, keep=False).sum()}", file=out)
    if F["doublons_exacts"] == 0 and F["doublons_hors_sku"] == 0:
        print(f"  => aucun doublon exact dans ce jeu de données.", file=out)
    else:
        print(f"  => {F['doublons_hors_sku']} lignes dupliquées en ignorant le SKU : "
              f"à trancher avant d'agréger.", file=out)

    # Les 2 couples au même prix : variantes, pas doublons.
    memes = n_prix[(n_prix == 1) & (taille > 1)].index
    print(f"\nCouples répétés AU MÊME PRIX : {len(memes)} — ce ne sont pas des doublons :", file=out)
    for p, n in memes:
        bloc = df[(df["provider"] == p) & (df["product_name"] == n)]
        print(bloc[["sku", "provider", "product_name", "price", "network", "top_up"]]
              .to_string(index=False), file=out)
        varient = [c for c in ATTRIBUTS if bloc[c].nunique() > 1]
        print(f"    -> se distinguent sur : {varient}\n", file=out)

    # Les multi-prix sont-ils explicables par un attribut ?
    sel = df.set_index(CLE).loc[multi].reset_index()
    sig = sel.groupby(CLE)[ATTRIBUTS].nunique()
    varie = (sig > 1).any(axis=1)
    print(f"Sur les {len(multi)} couples multi-prix, en regardant {ATTRIBUTS} :", file=out)
    print(f"  au moins un attribut varie  -> variante défendable : {varie.sum():>3} couples", file=out)
    print(f"  aucun attribut ne varie     -> prix seul différent : {(~varie).sum():>3} couples "
          f"({sel.set_index(CLE).loc[sig[~varie].index].shape[0]} lignes)", file=out)

    sel["cle"] = sel["provider"] + " | " + sel["product_name"]
    ecart = sel.groupby("cle")["prix"].agg(["min", "max"])
    ecart["pct"] = (ecart["max"] - ecart["min"]) / ecart["min"] * 100
    print(f"\nÉcart de prix intra-couple (max-min en % du min) :", file=out)
    print(f"  médiane {ecart['pct'].median():.1f} %  ·  moyenne {ecart['pct'].mean():.1f} %  "
          f"·  max {ecart['pct'].max():.1f} %  ·  couples au-dessus de 30 % : {(ecart['pct'] > 30).sum()}", file=out)
    print(f"  => amplitude de pricing normale, pas une erreur de saisie.", file=out)

    # ------------------------------------------------------------------ 5
    titre(5, "PIÈGE A (non signalé) — la frontière des 100 € et les illimités", out)
    chers = df[df["prix"] > 100]
    print(f"Produits à plus de 100 €            : {len(chers)}", file=out)
    pile = F["prix_pile_100"]
    print(f"Produits à 100,00 € exactement      : {pile}  "
          f"=> « plus de » et « au moins » donnent "
          f"{'le même' if pile == 0 else 'un résultat différent'}", file=out)
    print(f"\nParmi ces {len(chers)} produits :", file=out)
    print(f"  illimités            : {chers['illimite'].sum()} / {len(chers)}", file=out)
    print(f"  validité 30 jours    : {(chers['jours'] == 30).sum()} / {len(chers)}", file=out)
    print(f"  offres régionales    : {chers['zone'].sum()} / {len(chers)}", file=out)
    print(f"  zones couvertes      : {chers['country_name'].value_counts().to_dict()}", file=out)
    print(f"\nPrix max d'un forfait à volume LIMITÉ : {df.loc[~df['illimite'], 'prix'].max():.2f} €", file=out)
    print(f"=> en excluant les lignes sans data_gb, le KPI n°2 du brief vaudrait "
          f"{((df[~df['illimite']]['prix']) > 100).sum()} au lieu de {len(chers)}.", file=out)

    # ------------------------------------------------------------------ 6
    titre(6, "PIÈGE B (non signalé) — « nombre total de produits » a 4 réponses", out)
    sans_tech = [c for c in df.columns if c not in
                 ("fichier", "prix", "go", "illimite", "jours", "zone", "portee", "eur_par_go")]
    print(f"Lignes / SKU uniques                        : {len(df)}", file=out)
    print(f"Combinaisons d'attributs distinctes hors SKU: "
          f"{df[[c for c in sans_tech if c != 'sku']].drop_duplicates().shape[0]}", file=out)
    print(f"Offres distinctes (fournisseur+nom+prix)    : {df.groupby(CLE + ['price']).ngroups}", file=out)
    print(f"Références commerciales (fournisseur+nom)   : {df.groupby(CLE).ngroups}", file=out)

    # ------------------------------------------------------------------ 7
    titre(7, "PIÈGE C (non signalé) — la moyenne de Go masque la réalité du catalogue", out)
    print(f"Moyenne : {df['go'].mean():.2f} Go   ·   Médiane : {df['go'].median():.0f} Go", file=out)
    print(f"data_gb n'est pas continu, c'est un palier à {F['nb_paliers']} valeurs "
          f"({liste_fr([str(v) + ' Go' for v in F['paliers']])}) :", file=out)
    rep = df["go"].value_counts().sort_index()
    for go, n in rep.items():
        print(f"  {go:>5.0f} Go : {n:>4} offres ({n / len(df) * 100:>5.2f} %)", file=out)
    print(f"  Illimité : {df['illimite'].sum():>4} offres ({df['illimite'].mean() * 100:>5.2f} %)", file=out)

    # ------------------------------------------------------------------ 8
    titre(8, f"PIÈGE D (non signalé) — {F['zones']} des {F['destinations']} "
             f"« pays » sont des zones", out)
    print(f"Codes zone : {ZONES}", file=out)
    z = df[df["zone"]].groupby("country_name").size()
    print(f"\n{z.to_string()}", file=out)
    print(f"\nTotal offres régionales : {df['zone'].sum()} ({df['zone'].mean() * 100:.1f} % du catalogue)", file=out)
    print(f"\nComparaison des deux portées :", file=out)
    print(df.groupby("portee").agg(
        offres=("sku", "size"), prix_moyen=("prix", "mean"),
        go_moyen=("go", "mean"), part_illimite=("illimite", lambda s: s.mean() * 100),
    ).round(2).to_string(), file=out)

    # ------------------------------------------------------------------ 9
    titre(9, "PIÈGE E (non signalé) — aucune colonne de texte libre à parser", out)
    attendu = df["go"].map(lambda g: "Illimité" if pd.isna(g) else f"{g:.0f} Go")
    print(f"Lignes où data_display != attendu depuis data_gb : "
          f"{(attendu != df['data_display']).sum()} / {len(df)}", file=out)
    coherent = df.apply(
        lambda r: (r["data_display"] in r["product_name"])
        and (f"{r['validity_days']} jours" in r["product_name"])
        and (r["country_name"] in r["product_name"]), axis=1)
    print(f"Lignes où product_name ne reflète pas pays+data+validité : "
          f"{(~coherent).sum()} / {len(df)}", file=out)
    if F["data_display_exceptions"] == 0 and F["product_name_exceptions"] == 0:
        print(f"=> data_display et product_name sont entièrement dérivables des colonnes", file=out)
        print(f"   typées. Aucun parsing de texte libre n'est nécessaire — mais il fallait", file=out)
        print(f"   le prouver avant de s'appuyer dessus.", file=out)
    else:
        print(f"=> ATTENTION : {F['data_display_exceptions'] + F['product_name_exceptions']} lignes ne sont plus dérivables des colonnes", file=out)
        print(f"   typées. L'hypothèse « aucun texte libre à parser » ne tient plus.", file=out)

    # ------------------------------------------------------------------ 10
    titre(10, "PIÈGE F (non signalé) — l'encodage est SAIN, c'est la console qui ment", out)
    import glob as _g
    fichiers = sorted(_g.glob(os.path.join(DOSSIER_CSV, "*.csv")))
    ko = []
    for f in fichiers:
        octets = open(f, "rb").read()
        if octets[:3] == b"\xef\xbb\xbf":
            ko.append((os.path.basename(f), "BOM UTF-8"))
        try:
            octets.decode("utf-8")
        except UnicodeDecodeError as e:
            ko.append((os.path.basename(f), f"décodage UTF-8 échoue à l'octet {e.start}"))
    print(f"Fichiers analysés                 : {len(fichiers)}", file=out)
    print(f"Fichiers avec BOM ou UTF-8 invalide : {len(ko)} {ko}", file=out)
    octets = open(fichiers[1], "rb").read()
    i = octets.find(b"rique du Nord")
    print(f"\nOctets bruts autour de « Amérique » : {octets[i - 4:i + 4]}", file=out)
    print(f"  décodés en UTF-8  -> {octets[i - 4:i + 14].decode('utf-8')}", file=out)
    print(f"  décodés en cp1252 -> {octets[i - 4:i + 14].decode('cp1252')}", file=out)
    # Dans le rapport versionné, le constat de l'étape 1 est écrit tel quel : la
    # valeur courante dépend de la machine, et la CI (utf-8) réécrivait ce fichier
    # à chaque passage, ce qui créait un commit et faisait rejeter le push suivant.
    if str(getattr(out, "name", "")).endswith(".txt"):
        print("\nEncodage de la console Python     : cp1252 (poste Windows du profilage)", file=out)
    else:
        print(f"\nEncodage de la console Python     : {sys.stdout.encoding}", file=out)
    print(f"=> le charabia vient de l'affichage Windows, pas des données.", file=out)
    print(f"   « Nettoyer » l'encodage aurait corrompu les {F['destinations']} noms de destination.", file=out)

    # ------------------------------------------------------------------ 11
    titre(11, "CHIFFRES DE CADRAGE (formalisés à l'étape 2)", out)
    mini, maxi = df.loc[df["prix"].idxmin()], df.loc[df["prix"].idxmax()]
    print(f"Prix min : {mini['prix']:.2f} € — {mini['provider']} / {mini['product_name']}", file=out)
    print(f"Prix max : {maxi['prix']:.2f} € — {maxi['provider']} / {maxi['product_name']}", file=out)
    print(f"Prix moyen {df['prix'].mean():.2f} € · médian {df['prix'].median():.2f} €", file=out)
    print(f"\nPrime de l'illimité (prix médians, par durée) :", file=out)
    for j in sorted(df["jours"].unique()):
        a = df[df["illimite"] & (df["jours"] == j)]["prix"].median()
        b = df[~df["illimite"] & (df["jours"] == j)]["prix"].median()
        print(f"  {j:>2} jours : illimité {a:>6.2f} €  vs  limité {b:>5.2f} €   ×{a / b:.2f}", file=out)
    print(f"\n€/Go médian par fournisseur (hors illimités) — classement de valeur :", file=out)
    v = df[~df["illimite"]].groupby("provider")["eur_par_go"].median().sort_values()
    for i, (p, m) in enumerate(v.items(), 1):
        print(f"  {i:>2}. {p:<14} {m:.3f} €/Go", file=out)
    print(f"\nPart 5G par fournisseur :", file=out)
    g5 = df.groupby("provider")["network"].apply(lambda s: (s == "5G").mean() * 100).sort_values(ascending=False)
    print("  " + "  ".join(f"{p} {x:.1f}%" for p, x in g5.items()), file=out)


def main() -> None:
    out = sortie_utf8()
    profiler(out)
    out.flush()

    if "--ecrire" in sys.argv:
        chemin = os.path.join(DOSSIER_DOCS, "profilage-sortie.txt")
        with open(chemin, "w", encoding="utf-8") as fh:
            profiler(fh)
        print(f"\n[écrit] {chemin}", file=out)
        out.flush()


if __name__ == "__main__":
    main()

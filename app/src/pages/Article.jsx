import { Children, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Faq from '../components/ui/Faq.jsx';
import Magnetic from '../components/ui/Magnetic.jsx';
import { n, n1, eur, dateFr, mot, Mot } from '../lib/format.js';
import art from '../data/article.json';
import cat from '../data/catalogue.json';
import { FAQ, ITINERAIRES_EDITO, SEUIL, SEUIL_TXT, SOMMAIRE, typo } from '../data/contenuArticle.js';
import { useSectionActive } from '../lib/scroll.js';

// Une page de lecture ne rejoue aucune entrée : le texte est là tout de suite,
// sans saut quand React prend la main sur le HTML prérendu. Le mouvement reste
// pour le tableau de bord.
const Reveal = ({ children }) => <>{children}</>;
const LineReveal = ({ text }) => typo(String(text).replace(/\n/g, ' '));
const T = (c) => Children.map(c, (x) => (typeof x === 'string' ? typo(x) : x));
const IDS_SOMMAIRE = SOMMAIRE.map(([href]) => href.slice(1));

const prof5 = art.profils.find((p) => p.go === 5);
const prof10 = art.profils.find((p) => p.go === 10);
const europe = art.zones.find((z) => z.nom === 'Europe');
const ecartRegional = Math.round((europe['5go_7j'].prix_min / prof5.prix_min - 1) * 100);
const petitForfait = art.multi_pays.petit_forfait;
const choixMediterranee = art.selections[0];

/** Le gabarit éditorial : une colonne étroite, du papier, rien qui distraie. */
export default function Article() {
  return (
    <article className="relative bg-porcelain pb-24 pt-[108px]">
      <Entete />
      <SommaireLateral />

      <div className="mx-auto w-full max-w-[720px] px-5 sm:px-7">
        <Reponse />
        <Sommaire />

        <Section id="pleine-mer" titre="Non, votre eSIM ne captera pas en pleine mer">
          <P>
            C'est le point que la plupart des guides mentionnent en petit, dans une ligne
            de tableau, avant de passer à autre chose.
          </P>
          <P>
            Une eSIM de voyage n'a rien de magique : c'est une carte SIM dématérialisée
            qui se connecte aux <B>antennes mobiles au sol</B>, comme votre carte SIM
            habituelle. Sa portée s'arrête donc là où s'arrête la couverture terrestre :
            quelques kilomètres après le port, le signal faiblit, puis disparaît.
          </P>
          <P>
            Le navire prend alors le relais avec ses propres moyens : une liaison{' '}
            <B>satellite</B> redistribuée en Wi-Fi, et sur la plupart des navires
            modernes <B>une antenne mobile embarquée</B> qui diffuse un réseau à
            l'intérieur du bateau. Ces deux solutions appartiennent à la compagnie. Votre
            eSIM n'y a pas accès.
          </P>

          <SchemaCouverture />

          <SousTitre>Et les « eSIM maritimes » ?</SousTitre>
          <P>
            Elles existent, et il serait malhonnête de les passer sous silence. Certains
            opérateurs commercialisent des forfaits donnant accès au{' '}
            <B>réseau mobile embarqué des navires</B> : c'est le cas de GigSky avec son offre{' '}
            <i>Cellular at Sea</i>, ou de revendeurs s'appuyant sur l'infrastructure de
            Telenor Maritime.
          </P>
          <P>
            Ce sont des produits à part : ils reposent sur une liaison satellite, et leur
            tarification au gigaoctet s'en ressent. Si vous devez absolument travailler
            en mer, comparez-les au forfait de votre compagnie. Pour un voyage
            d'agrément, le calcul tourne presque toujours à l'avantage des escales.
          </P>

          <ARetenir>
            Une eSIM de voyage n'est pas un substitut au Wi-Fi du bord. C'est un produit
            complémentaire, qui couvre les moments où vous êtes à terre, et qui les
            couvre très bien.
          </ARetenir>
        </Section>

        <Section id="escales" titre="Alors à quoi sert-elle ? Aux escales, et ça change tout">
          <P>
            Posée comme ça, la limite ressemble à un défaut rédhibitoire. Elle ne l'est
            pas, pour une raison simple : <B>c'est à terre que vous avez réellement
            besoin d'Internet.</B>
          </P>
          <P>En escale, votre téléphone redevient indispensable :</P>
          <Liste
            items={[
              ['Se repérer', "dans une ville inconnue, avec un temps compté avant l'heure de rappel."],
              ['Commander un VTC', 'ou vérifier les transports pour rentrer au port.'],
              ['Traduire', 'un menu, un panneau, une conversation.'],
              ['Réserver', "une excursion sur place, souvent moins chère qu'à bord."],
              ['Appeler le bateau', 'ou vos proches en cas de problème.'],
            ]}
          />
          <SuggestionImage
            description="photo d'une passagère consultant un plan sur son téléphone, sur le quai, avec le navire en arrière-plan."
            alt="Une passagère de croisière utilise son eSIM pour se repérer pendant une escale"
          />
          <P>
            À bord, en revanche, l'essentiel est fourni : le programme du jour, les
            réservations de restaurant et le plan du navire passent par l'application de
            la compagnie, qui fonctionne <B>gratuitement sur le Wi-Fi interne</B>, sans
            accès à Internet.
          </P>

          <SousTitre>Le seul calcul qui compte : escales contre jours en mer</SousTitre>
          <P>
            Personne ne peut vous promettre sérieusement un niveau de signal au large.{' '}
            <B>Prenez plutôt le programme de votre croisière et comptez les escales.</B>
          </P>
          <Liste
            items={[
              ['Une escale par jour ou presque', "(typiquement une Méditerranée d'été) : dans ce cas, l'eSIM est le meilleur rapport qualité/prix de votre voyage, et de loin."],
              ['Deux ou trois jours de navigation', "sur une semaine (Caraïbes, Baltique) : l'eSIM reste rentable, mais prévoyez de télécharger vos contenus avant les journées en mer."],
              ['Une traversée', "(transatlantique, longues navigations) : là, seul le forfait du bord répond."],
            ]}
          />
        </Section>

        <Section id="piege" titre="⚠️ Le vrai piège : le réseau du bateau qui s'allume tout seul">
          <P>
            C'est le point le plus important de cet article, et celui dont on parle le
            moins. Il ne concerne pas votre eSIM : <B>il concerne votre carte SIM
            habituelle</B>, celle de votre opérateur français, restée active dans votre
            téléphone.
          </P>
          <P>
            Le scénario est toujours le même. Le navire s'éloigne de la côte, votre
            téléphone perd l'antenne terrestre, cherche un réseau, puis{' '}
            <B>s'accroche seul à celui du bateau</B>. Sans manipulation de votre part,
            sans alerte visible. Une application qui se synchronise, une sauvegarde
            photo, une mise à jour : la consommation démarre.
          </P>

          <SousTitre>Pourquoi votre forfait européen ne vous protège pas</SousTitre>
          <P>
            C'est écrit noir sur blanc sur le portail officiel de l'Union européenne.
            Pour les trajets en bateau, la règle est double :
          </P>
          <Liste
            items={[
              ['Sur un réseau terrestre', "(dans un port, par exemple), l'itinérance européenne s'applique normalement : pas de frais supplémentaires."],
              ['Via un système par satellite', "« la réglementation de l'UE ne s'applique plus ». Des services sans plafonnement des prix peuvent alors vous être facturés."],
            ]}
          />
          <P>
            La recommandation de cette même page officielle est sans ambiguïté :{' '}
            <B>désactiver l'itinérance, ou passer en mode avion.</B>
          </P>

          <Alerte titre="Et le blocage automatique à 50 € ? Ne comptez pas dessus.">
            <P small>
              Vous avez peut-être en tête le garde-fou qui coupe les données au-delà d'un
              certain montant. Il existe bien : l'ARCEP fixe un plafond par défaut de{' '}
              <B>60 € TTC</B> (50 € hors taxes au niveau européen), avec une alerte à
              80 % puis un blocage.
            </P>
            <P small last>
              Mais c'est une protection attachée au <B>régime d'itinérance</B>, c'est-à-dire celui
              dont la page européenne dit précisément qu'il ne s'applique plus en liaison
              satellite. <B>Nous ne pouvons donc pas vous garantir que ce plafond vous
              protège en mer</B>, et les documents officiels consultés ne tranchent pas
              la question. La seule réponse fiable vient de votre opérateur, par écrit,
              avant le départ.
            </P>
          </Alerte>

          <P>
            Le mécanisme, lui, est documenté de longue date : l'UFC-Que Choisir décrivait
            déjà le cas d'un passager dont le téléphone avait basculé seul sur le réseau
            du navire, avec une facture à la clé. L'article est ancien et ses tarifs ne
            valent plus ; <B>le fonctionnement, lui, n'a pas changé</B>.
          </P>

          <SuggestionImage
            description="capture annotée des réglages iPhone et Android, avec « Itinérance des données » désactivée sur la ligne principale."
            alt="Réglage de l'itinérance des données désactivé sur un smartphone avant une croisière"
          />

          <Encadre titre="✅ Les 4 gestes à faire avant d'embarquer">
            <ol className="space-y-3.5">
              {[
                ['Désactivez les données en itinérance', "sur votre ligne habituelle. C'est le geste qui vous protège, et il est gratuit."],
                ['Désactivez aussi les appels et SMS en itinérance', 'si vous ne comptez pas les utiliser : la facturation maritime les concerne également.'],
                ['Coupez la synchronisation automatique', "des photos et sauvegardes cloud : c'est le premier poste de consommation involontaire."],
                ['Installez votre eSIM depuis chez vous', "avant le départ, sans l'activer : l'installation réclame une connexion Internet, et le forfait ne doit démarrer qu'à la première escale."],
              ].map(([t, s], i) => (
                <li key={t} className="flex gap-3.5 text-[0.95rem] leading-relaxed text-slate">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/15 font-mono text-[0.68rem] font-semibold text-marine">
                    {i + 1}
                  </span>
                  <span>
                    <B>{t}</B> {s}
                  </span>
                </li>
              ))}
            </ol>
          </Encadre>
        </Section>

        <Section id="prix" titre="Combien coûte une eSIM de croisière ? Les prix du catalogue">
          <P>
            Les chiffres qui suivent ne sont pas des estimations. Ils sont extraits du
            catalogue de <B>{n(art.source.lignes)} offres</B> que MyBestSim importe
            auprès de <B>{art.source.fournisseurs} fournisseurs</B>, et recalculés pour
            cet article.
          </P>

          <SousTitre>Le forfait type d'une croisière d'une semaine</SousTitre>
          <P>
            Pour 7 jours avec escales quotidiennes, <B>5 Go suffisent largement</B> :
            vous n'êtes connecté que quelques heures par jour, et la navigation GPS
            consomme peu une fois la carte téléchargée. Pour affiner, essayez notre{' '}
            <Mbs slug="calculateur-de-donnee-voyage/">calculateur de données</Mbs>.
          </P>

          <Tableau
            entetes={['Itinéraire', 'Offres', 'Le moins cher', 'Médian', 'Moins cher chez']}
            lignes={art.itineraires
              .filter((it) => it.forfait_type)
              .map((it) => [
                it.nom,
                String(it.forfait_type.offres),
                <b key="m" className="font-semibold text-marine">{eur(it.forfait_type.prix_min)}</b>,
                eur(it.forfait_type.prix_median),
                it.forfait_type.moins_cher_fournisseur,
              ])}
            legende="Forfait 5 Go valable 7 jours, sur les destinations de chaque bassin présentes au catalogue. Prix de catalogue, hors promotions."
          />

          <P>
            Première conclusion : <B>l'écart entre destinations est faible</B>. Que vous
            naviguiez en Méditerranée ou dans les Caraïbes, le ticket d'entrée tourne
            autour de 11 à 13 € pour la semaine. Le choix de l'itinéraire ne change
            presque rien au budget connexion.
          </P>

          <SousTitre>Si votre croisière est plus longue, ou votre usage plus intense</SousTitre>
          <Tableau
            entetes={['Profil', 'Forfait', 'Offres', 'Moins cher', 'Médian']}
            lignes={art.profils.map((p) => [
              p.libelle,
              `${p.go} Go / ${p.jours} j`,
              String(p.offres),
              <b key="m" className="font-semibold text-marine">{eur(p.prix_min)}</b>,
              eur(p.prix_median),
            ])}
            legende="Toutes destinations confondues. Les médianes donnent une image plus juste que les moyennes, tirées vers le haut par les illimités."
          />

          <SousTitre>Une eSIM par pays, ou une seule eSIM régionale ?</SousTitre>
          <P>
            C'est <B>la vraie question d'une croisière</B>, et celle que les comparatifs
            généralistes n'abordent jamais, parce qu'ils raisonnent sur un voyage dans
            un seul pays. Or un itinéraire en Méditerranée touche couramment l'Espagne,
            l'Italie et la Grèce dans la même semaine.
          </P>

          <Tableau
            entetes={["Type d'eSIM", '5 Go / 7 j', '10 Go / 15 j', 'Couverture']}
            lignes={[
              ['eSIM mono-pays', eur(prof5.prix_min), eur(prof10.prix_min), '1 pays'],
              ['eSIM régionale Europe', eur(europe['5go_7j'].prix_min), eur(europe['10go_15j'].prix_min), "Toute l'Europe"],
              [
                <i key="e">Écart</i>,
                <i key="a">+{ecartRegional} %</i>,
                <i key="b">+{Math.round((europe['10go_15j'].prix_min / prof10.prix_min - 1) * 100)} %</i>,
                '—',
              ],
            ]}
            legende={`Prix d'entrée relevés au catalogue. Une eSIM régionale coûte plus cher qu'une seule eSIM locale, mais moins cher que ${mot(SEUIL)} cumulées, à volume égal dans chaque pays.`}
          />

          <ARetenir>
            {SEUIL_TXT.Avant}, prenez une eSIM locale.{' '}
            <B>{SEUIL_TXT.Des} différents, l'eSIM régionale revient moins cher</B> à
            volume égal, et vous n'avez qu'une seule installation à gérer. Vérifiez
            simplement que chaque pays de votre itinéraire figure dans sa couverture.
          </ARetenir>

          {petitForfait.cout_au_seuil < europe['5go_7j'].prix_min ? (
            <P>
              Seule exception : les très petits volumes. {Mot(SEUIL)} forfaits locaux
              de {petitForfait.go} Go sur {petitForfait.jours} jours reviennent à partir
              de <B>{eur(petitForfait.cout_au_seuil)}</B>, moins qu'une régionale de 5 Go
              à {eur(europe['5go_7j'].prix_min)}, mais vous n'aurez
              que {SEUIL * petitForfait.go} Go au total.
            </P>
          ) : null}

          <Methodologie />
        </Section>

        <Section id="vs-wifi" titre="eSIM ou Wi-Fi du bord : la comparaison qu'on ne vous fait pas">
          <P>
            Vous avez sûrement croisé ce type d'argument : <i>« le Wi-Fi du bateau coûte
            10 € par jour, notre eSIM coûte 4 € par jour »</i>. C'est arithmétiquement
            exact et <B>intellectuellement malhonnête</B>.
          </P>
          <P>
            Ces deux produits ne couvrent pas les mêmes moments. Le Wi-Fi du bord
            fonctionne <B>en mer, là où rien d'autre ne fonctionne</B>. L'eSIM fonctionne{' '}
            <B>à terre, là où le Wi-Fi du bord ne vous sert à rien</B> puisque vous n'êtes
            plus à bord. Comparer leurs prix à la journée revient à comparer un parapluie
            à une paire de lunettes de soleil.
          </P>

          <Encadre titre="Les trois questions à se poser, dans l'ordre">
            <ol className="space-y-3.5">
              {[
                ["Ai-je besoin d'être joignable en mer ?", "Si oui, pour le travail ou une responsabilité familiale, le forfait du bord n'est pas optionnel, et aucune eSIM ne le remplacera."],
                ["Combien d'escales ?", "C'est ce qui détermine la rentabilité de l'eSIM, et elle est atteinte dès la première ou la deuxième."],
                ["Puis-je me passer d'Internet en mer ?", "Si oui, l'eSIM seule suffit, et vous économisez l'intégralité du forfait du bord."],
              ].map(([t, s], i) => (
                <li key={t} className="flex gap-3.5 text-[0.95rem] leading-relaxed text-slate">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azur/12 font-mono text-[0.68rem] font-semibold text-marine">
                    {i + 1}
                  </span>
                  <span>
                    <B>{t}</B> {s}
                  </span>
                </li>
              ))}
            </ol>
          </Encadre>

          <SousTitre>Comment lire la grille tarifaire de votre compagnie</SousTitre>
          <P>
            Nous ne publierons pas de tableau des prix Wi-Fi des compagnies : ils varient
            selon le navire, la durée, le moment de l'achat et les promotions, et les
            chiffres qui circulent en ligne se contredisent. Consultez le site de votre
            compagnie, mais vérifiez ces quatre points, qui changent tout :
          </P>
          <Liste
            items={[
              ['Par appareil ou par cabine ?', "La plupart des forfaits d'entrée de gamme ne couvrent qu'un seul appareil à la fois. Pour une famille, le prix affiché est à multiplier."],
              ['Quel usage est autorisé ?', 'Les forfaits les moins chers sont souvent limités à la messagerie, et les appels vidéo relèvent du forfait le plus élevé.'],
              ['Pour toute la croisière ou à la journée ?', "Un forfait « séjour complet » est généralement bien plus avantageux qu'un cumul de journées."],
              ['Acheté avant ou à bord ?', 'Le tarif de prévente est souvent inférieur à celui pratiqué une fois à bord.'],
            ]}
          />
          <P>
            Royal Caribbean illustre bien cette logique : sa page officielle distingue un
            forfait <i>Surf</i> (navigation, e-mails, réseaux sociaux) d'un
            forfait <i>Surf and Stream</i> (streaming et appels vidéo), vendus par appareil,
            et conseille d'acheter tôt. Chez MSC comme chez Costa, posez les mêmes questions
            sur le site de la compagnie ou dans votre espace de réservation.
          </P>
        </Section>

        <Section id="itineraires" titre="Quelle eSIM selon votre itinéraire ?">
          <P>
            Le principe est partout le même : <B>comptez les pays touchés</B>. Choisissez
            une eSIM locale {SEUIL_TXT.avant}, et une eSIM régionale {SEUIL_TXT.des}.
          </P>
          <SuggestionImage
            description="carte des cinq bassins de croisière, avec le type d'eSIM conseillé sur chacun."
            alt="Carte des itinéraires de croisière et de l'eSIM conseillée pour chacun"
          />
          <div className="mt-8 grid gap-4">
            {ITINERAIRES_EDITO.map((it, i) => (
              <Reveal key={it.nom} delay={i * 0.05}>
                <div className="card-surface rounded-[1.2rem] p-6 shadow-halo transition-shadow duration-500 hover:shadow-halo-lg">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    <span aria-hidden="true" className="text-[1.3rem]">{it.emoji}</span>
                    <h3 className="font-display text-[1.2rem] font-normal text-marine">{it.nom}</h3>
                    <span className="ml-auto shrink-0 rounded-full text-marine">
                      {it.verdict}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">{typo(it.texte)}</p>
                  <Selection itineraire={it.nom} comparateur={it.comparateur} />
                </div>
              </Reveal>
            ))}
          </div>
          <P small>
            <span className="mt-6 block">
              Ces sélections classent les offres par prix, le seul critère que notre
              catalogue mesure : ni la qualité du réseau, ni la liste exacte des pays
              couverts. Pour un avis plus large, consultez notre{' '}
              <Mbs slug="meilleurs-fournisseurs-esim/">comparatif des meilleurs fournisseurs</Mbs>.
            </span>
          </P>
        </Section>

        <Section id="installation" titre="Installer votre eSIM avant de partir">
          <P>
            Une règle, impérative : <B>installez votre eSIM depuis chez vous, avant
            l'embarquement.</B> L'installation nécessite une connexion Internet, et
            attendre d'être à bord, c'est devoir payer le Wi-Fi du bateau pour activer la
            solution censée vous en passer.
          </P>
          <Liste
            ordonnee
            items={[
              ['Vérifiez la compatibilité eSIM', <>de votre téléphone sur <Mbs slug="telephones-compatibles-esim/">notre liste</Mbs>, et qu'il n'est pas bloqué opérateur, car un téléphone verrouillé refusera une eSIM tierce.</>],
              ['Achetez et installez le forfait à la maison', "en Wi-Fi. Vous recevez un QR code ; l'eSIM s'ajoute à côté de votre ligne habituelle, qui reste active."],
              ['Activez-la à la première escale', 'pas avant. La plupart des forfaits démarrent leur décompte à la première connexion au réseau, pas à l\'achat.'],
              ['Désignez l\'eSIM comme ligne de données', "par défaut, et laissez l'itinérance désactivée sur votre ligne principale. C'est cette combinaison qui vous protège."],
            ]}
          />
        </Section>

        <Section id="faq" titre="Questions fréquentes">
          <Faq items={FAQ} />
        </Section>

        <Section id="resume" titre="En résumé">
          <Liste
            items={[
              ['En pleine mer, aucune eSIM de voyage ne capte.', "Il n'y a que le Wi-Fi du bord, ou une offre maritime dédiée."],
              ['En escale, l\'eSIM est imbattable', `: à partir de ${eur(prof5.prix_min)} les 5 Go sur 7 jours, contre un forfait de bord facturé à la journée et par appareil.`],
              ['Coupez les données en itinérance dès l\'embarquement.', 'Le réseau du navire n\'est pas couvert par la réglementation européenne, donc sans plafond de prix.'],
              [`${SEUIL_TXT.Des} : prenez une eSIM régionale.`, `${SEUIL_TXT.Avant}, une eSIM locale revient moins cher.`],
              ['Installez-la avant de partir', ', activez-la à la première escale.'],
            ]}
          />
        </Section>

        <Reveal>
          <div className="mt-14 rounded-[1.5rem] border border-marine/10 bg-gradient-to-br from-white/80 to-shell/60 p-9 text-center shadow-halo">
            <h2 className="font-display text-[1.6rem] font-light text-marine">
              Trouvez l'eSIM adaptée à votre itinéraire
            </h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-[0.95rem] text-slate">
              Comparez les offres de votre destination sur le comparateur MyBestSim.
            </p>
            <div className="mt-7 flex justify-center">
              <Magnetic>
                <a href={`${MBS}`} className="btn-primary">Comparer les eSIM</a>
              </Magnetic>
            </div>
          </div>
        </Reveal>

        <Sources />
      </div>
    </article>
  );
}

/* ----------------------------------------------------------- morceaux --- */

function Entete() {
  return (
    <header className="mx-auto mb-12 w-full max-w-[720px] px-5 sm:px-7">
      <Reveal>
        <nav aria-label="Fil d'Ariane" className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-marine/80">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link to="/" className="inline-block py-1 underline-offset-4 transition-colors hover:text-signal-fonce hover:underline">Accueil</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-marine">Guide croisière</li>
          </ol>
        </nav>
      </Reveal>

      <h1 className="h-display mt-6 text-marine">
        <LineReveal text={'Internet en croisière :\nquelle eSIM choisir ?'} />
      </h1>

      <Reveal delay={0.2}>
        <p className="mt-7 text-[1.1rem] leading-[1.7] text-slate md:text-[1.18rem]">
          La question revient avant chaque départ. La réponse honnête tient en une
          phrase, et elle ne va pas vous plaire :{' '}
          <B>en pleine mer, aucune eSIM de voyage classique ne captera</B>. Voici ce
          qu'elle vous apporte réellement, ce qu'elle coûte, et le piège qui fait
          exploser les factures.
        </p>
      </Reveal>

      <Reveal delay={0.28}>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-marine/10 pb-7 text-[0.84rem] text-marine/80">
          <span>Mis à jour le <time dateTime={cat.meta.genere_le}>{dateFr(cat.meta.genere_le)}</time></span>
          <span aria-hidden="true">·</span>
          <span>9&nbsp;min de lecture</span>
          <span aria-hidden="true">·</span>
          <span>Prix issus d'un catalogue de {n(art.source.lignes)} offres</span>
        </div>
      </Reveal>
    </header>
  );
}

function Reponse() {
  return (
    <Reveal>
      <aside className="rounded-[1.3rem] border border-signal/30 bg-white/70 p-6 shadow-halo sm:p-8">
        <p className="label-muted !text-signal-fonce">La réponse courte</p>
        <div className="mt-4 space-y-3.5 text-[1rem] leading-[1.7] text-slate">
          <p>
            Une eSIM de voyage se connecte aux <B>réseaux mobiles terrestres</B>. Elle
            fonctionne donc parfaitement <B>à quai et en escale</B>, et pas du tout au
            large. En pleine mer, il ne reste que le Wi-Fi du bord.
          </p>
          <p>
            Elle reste malgré tout le meilleur achat d'une croisière à escales
            nombreuses : comptez <B>{eur(prof5.prix_min)} à {eur(prof5.prix_max)}</B> pour
            5 Go sur 7 jours, là où le Wi-Fi du bateau se paie à la journée et par
            appareil. Pour une Méditerranée à plusieurs pays, notre choix est une{' '}
            <B>eSIM régionale {choixMediterranee.destination}</B>, à partir
            de <B>{eur(choixMediterranee.offres[0].prix)}</B> chez{' '}
            {choixMediterranee.offres[0].fournisseur}.
          </p>
          <p>
            Et surtout : <B>coupez les données mobiles dès l'embarquement.</B> Votre
            téléphone s'accroche seul au réseau du navire, qui n'est pas couvert par la
            réglementation européenne sur l'itinérance, <B>donc sans plafond de prix</B>.
          </p>
        </div>
      </aside>
    </Reveal>
  );
}

/**
 * Le sommaire qui suit la lecture, sur les écrans assez larges pour l'accueillir
 * dans la marge. Il ne recouvre jamais le texte : il vit à côté de la colonne, et
 * disparaît en dessous de 1280 px, où le menu mobile reprend la même liste.
 */
function SommaireLateral() {
  const active = useSectionActive(IDS_SOMMAIRE);
  return (
    <aside className="pointer-events-none absolute bottom-24 left-0 top-[108px] hidden w-[calc((100%-720px)/2)] justify-end pr-10 xl:flex">
      <nav aria-label="Sommaire de lecture" className="pointer-events-auto sticky top-[100px] h-fit w-full max-w-[250px]">
        <p className="label-muted mb-3">Dans cet article</p>
        <ol className="space-y-1 border-l border-marine/12">
          {SOMMAIRE.map(([href, label]) => {
            const courant = active === href.slice(1);
            return (
              <li key={href}>
                <a
                  href={href}
                  aria-current={courant ? 'true' : undefined}
                  className={`-ml-px block border-l-[1.5px] py-1.5 pl-3 text-[0.82rem] leading-snug transition-colors duration-300 ${
                    courant ? 'border-signal font-medium text-marine' : 'border-transparent text-slate hover:text-marine'
                  }`}
                >
                  {label.replace('⚠️ ', '')}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}

function Sommaire() {
  return (
    <Reveal delay={0.1}>
      <nav aria-label="Sommaire" className="mt-8 rounded-[1.3rem] border border-marine/10 bg-shell/50 p-6 sm:p-7">
        <p className="label-muted">Au sommaire</p>
        <ol className="mt-4 space-y-2.5">
          {SOMMAIRE.map(([href, label], i) => (
            <li key={href} className="flex gap-3 text-[0.95rem]">
              <span className="font-mono text-[0.72rem] text-marine/80">{String(i + 1).padStart(2, '0')}</span>
              <a href={href} className="inline-block py-0.5 text-slate underline-offset-4 transition-colors duration-300 hover:text-signal-fonce hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </Reveal>
  );
}

function Section({ id, titre, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-16">
      <h2 className="font-display text-[clamp(1.6rem,4.6vw,2.1rem)] font-light leading-snug tracking-[-0.02em] text-marine">
        <LineReveal text={titre} />
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const SousTitre = ({ children }) => (
  <Reveal>
    <h3 className="mt-10 font-display text-[1.25rem] font-normal text-marine">{children}</h3>
  </Reveal>
);

const P = ({ children, small, last }) => (
  <p
    className={`${small ? 'text-[0.95rem]' : 'text-[1.02rem]'} leading-[1.75] text-slate ${
      last ? '' : 'mb-4'
    }`}
  >
    {T(children)}
  </p>
);

const B = ({ children }) => <strong className="font-semibold text-marine">{T(children)}</strong>;

const MBS = 'https://mybestsim.com/fr/';

/** Un lien vers le site MyBestSim : c'est du maillage interne, donc sans nofollow. */
const Mbs = ({ slug, children }) => (
  <a
    href={`${MBS}${slug}`}
    className="py-1 font-medium text-marine underline decoration-signal/50 underline-offset-2 transition-colors hover:text-signal-fonce"
  >
    {children}
  </a>
);

const SuggestionImage = ({ description, alt }) => (
  <aside data-note-edition className="my-7 rounded-[1.1rem] border border-dashed border-marine/25 p-5 text-[0.84rem] leading-relaxed text-marine/80">
    <b className="font-semibold text-marine">Suggestion d'image :</b> {typo(description)}{' '}
    <i>Alt : « {alt} »</i>
  </aside>
);

/** Les trois offres les moins chères d'un itinéraire, lues dans article.json. */
function Selection({ itineraire, comparateur }) {
  const s = art.selections.find((x) => x.itineraire === itineraire);
  if (!s || !s.offres.length) return null;
  return (
    <div className="mt-4 border-t border-marine/10 pt-4">
      <p className="text-[0.84rem] font-medium text-marine">
        Les moins chères au catalogue : eSIM {s.destination}, {s.go}&nbsp;Go / {s.jours}&nbsp;jours
      </p>
      <ol className="mt-2 space-y-1.5 text-[0.9rem]">
        {s.offres.map((o) => (
          <li key={o.fournisseur} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-slate">
              <b className="font-semibold text-marine">{o.fournisseur}</b>{' '}
              <span className="text-[0.8rem]">
                {o.reseau}{o.rechargeable ? ' · rechargeable' : ''}
              </span>
            </span>
            <span className="font-mono font-semibold text-marine">{eur(o.prix)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[0.84rem]">
        <Mbs slug={comparateur}>Comparer toutes les eSIM {s.destination}</Mbs>
      </p>
    </div>
  );
}

function Liste({ items, ordonnee }) {
  const Tag = ordonnee ? 'ol' : 'ul';
  return (
    <Tag className="mb-5 space-y-3">
      {items.map(([t, s], i) => (
        <li key={t} className="flex gap-3.5 text-[1rem] leading-[1.7] text-slate">
          <span
            aria-hidden="true"
            className={
              ordonnee
                ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marine/8 font-mono text-[0.66rem] font-semibold text-marine/80'
                : 'mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal/70'
            }
          >
            {ordonnee ? i + 1 : ''}
          </span>
          <span>
            <B>{t}</B> {T(s)}
          </span>
        </li>
      ))}
    </Tag>
  );
}

// Tant qu'il reste des colonnes à droite, le bord s'estompe : c'est ce qui dit au
// lecteur qu'il peut faire défiler le tableau, comme dans ceux du tableau de bord.
const FONDU_TABLEAU = 'linear-gradient(to right, #000 calc(100% - 36px), transparent)';

function Tableau({ entetes, lignes, legende }) {
  const defilant = useRef(null);
  const [suite, setSuite] = useState(false);
  const mesurer = () => {
    const el = defilant.current;
    if (el) setSuite(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  };
  useEffect(() => {
    if (!defilant.current) return undefined;
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(defilant.current);
    return () => ro.disconnect();
  }, []);

  return (
    <Reveal>
      {/* Le tableau reste dans la colonne de lecture. Ce qui le faisait
          déborder, ce n'étaient pas les données mais les en-têtes : en mono
          capitales avec 0,22em d'interlettrage, « MOINS CHER CHEZ » est plus
          large que la colonne qu'il titre. Ici l'interlettrage est réduit et
          l'en-tête peut passer à la ligne. Sous `sm`, le défilement
          horizontal reprend : c'est le bon geste au doigt. */}
      <div
        ref={defilant}
        onScroll={mesurer}
        className="my-7 -mx-5 overflow-x-auto overscroll-x-contain px-5 sm:mx-0 sm:overflow-visible sm:px-0"
        style={suite ? { maskImage: FONDU_TABLEAU, WebkitMaskImage: FONDU_TABLEAU } : undefined}
        data-lenis-prevent
      >
        <table className="w-full min-w-[440px] table-auto border-collapse text-[0.88rem] sm:min-w-0">
          <thead>
            <tr>
              {entetes.map((e, i) => (
                <th
                  key={e}
                  scope="col"
                  className={`border-b border-marine/20 pb-3 font-mono text-[0.68rem] uppercase leading-tight tracking-[0.08em] text-marine/80 ${
                    i === 0 ? 'sticky left-0 z-[1] bg-porcelain pr-3 text-left sm:static' : 'pl-3 text-right'
                  }`}
                >
                  {e}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, li) => (
              <tr key={li} className="transition-colors hover:bg-marine/[0.035]">
                {l.map((c, ci) => (
                  <td
                    key={ci}
                    className={`border-b border-marine/[0.08] py-3 ${
                      ci === 0
                        ? 'sticky left-0 z-[1] bg-porcelain pr-3 font-medium leading-snug text-marine sm:static'
                        : 'whitespace-nowrap pl-3 text-right text-slate'
                    }`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legende ? (
        <p className="-mt-4 mb-7 text-[0.8rem] leading-relaxed text-marine/80">{legende}</p>
      ) : null}
    </Reveal>
  );
}

const ARetenir = ({ children }) => (
  <Reveal>
    <div className="my-7 rounded-[1.1rem] bg-azur/[0.08] p-6">
      <p className="text-[1rem] leading-[1.7] text-marine/80">
        <B>À retenir :</B> {children}
      </p>
    </div>
  </Reveal>
);

const Encadre = ({ titre, children }) => (
  <Reveal>
    <div className="my-7 rounded-[1.2rem] border border-marine/12 bg-white/55 p-6 shadow-halo sm:p-7">
      <p className="mb-5 font-display text-[1.1rem] font-normal text-marine">{titre}</p>
      {children}
    </div>
  </Reveal>
);

const Alerte = ({ titre, children }) => (
  <Reveal>
    <div className="my-7 rounded-[1.2rem] border border-signal/35 bg-signal/[0.055] p-6 sm:p-7">
      <p className="mb-4 font-display text-[1.1rem] font-normal text-marine">{titre}</p>
      {children}
    </div>
  </Reveal>
);

const Methodologie = () => (
  <Reveal>
    <div className="my-7 rounded-[1.1rem] bg-shell/70 p-6">
      <p className="label-muted mb-3">Méthodologie et limites</p>
      <p className="text-[0.88rem] leading-relaxed text-marine/80">
        Prix relevés dans le catalogue fournisseurs importé par MyBestSim, à la date de
        mise à jour indiquée en haut de cet article. Ce sont des <b>prix de catalogue</b>,
        hors promotions et codes de réduction, susceptibles d'évoluer : vérifiez toujours
        le tarif affiché avant d'acheter. Les médianes sont calculées sur l'ensemble des
        offres correspondant au couple volume / durée indiqué. Les forfaits illimités sont
        exclus des moyennes de volume, leur quantité de données n'étant pas chiffrable.
      </p>
    </div>
  </Reveal>
);

const ZONES_COUVERTURE = [
  ['Au port', 'Réseau terrestre', 'eSIM active', '#1f6fb2'],
  ['Près des côtes', 'Signal dégradé', 'Intermittent', '#7fb0de'],
  ['Au large', 'Satellite du navire', 'eSIM inutile', '#d2693a'],
];
const ARCS_ANTENNE = [18, 44, 74, 108, 146, 188, 236, 290];
const HOULE = `M60 158${' q10 -4 20 0 t20 0'.repeat(16)}`;

function Coque({ couleur, classePoint }) {
  return (
    <>
      <path d="M-34 0h68l-9 17h-50z" fill="#113a63" />
      <path d="M-22 0v-11h44V0zM-9-11v-9h18v9z" fill="#ffffff" stroke="#113a63" strokeWidth="1.5" />
      <circle cx="0" cy="-27" r="3.5" fill={couleur} className={classePoint} />
    </>
  );
}

/**
 * Du port au large, ce qui capte et ce qui ne capte plus : une boucle de 5 s.
 *
 * Tout le mouvement vit dans le CSS (classes `couverture-*` d'index.css). Le schéma
 * est donc dans le HTML servi, net à toute taille, sans fichier vidéo à charger et
 * sans JavaScript. En mouvement réduit, il redevient le schéma fixe à trois navires.
 */
function SchemaCouverture() {
  return (
    <figure className="my-8 rounded-[1.2rem] border border-marine/10 bg-white/50 p-5 sm:p-6">
      <svg viewBox="0 0 640 170" className="h-auto w-full" role="img" aria-label="Animation en boucle de la couverture mobile en croisière : au port, le téléphone capte le réseau terrestre ; près des côtes, le signal se dégrade ; au large, seule la liaison satellite du navire subsiste.">
        <rect x="0" y="145" width="640" height="25" fill="#6ba8e0" opacity="0.16" />
        <path className="couverture-houle" d={HOULE} fill="none" stroke="#6ba8e0" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M0 145 Q40 138 86 146 L110 170 L0 170 Z" fill="#dfd5c2" />
        <path d="M40 141V84M28 141l12-44 12 44" fill="none" stroke="#113a63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {ARCS_ANTENNE.map((r, i) => (
          <path
            key={r}
            className="couverture-onde"
            style={{ animationDelay: `${(i * 0.11 - 1.25).toFixed(2)}s` }}
            d={`M${40 + r} 84 A ${r} ${r} 0 0 0 ${40 + r * 0.72} ${84 - r * 0.69}`}
            fill="none"
            stroke="#1f6fb2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity={Math.max(0.12, 0.85 - i * 0.12)}
          />
        ))}
        <g transform="translate(590 26)" fill="none" stroke="#113a63" strokeWidth="2" strokeLinejoin="round">
          <rect className="couverture-satellite" x="-7" y="-6" width="14" height="12" rx="2" fill="#ffffff" />
          <path d="M-7 0h-16M7 0h16M-23-6h-0v12M23-6v12" />
        </g>

        {/* Mouvement réduit : les trois étapes côte à côte, sans rien qui bouge. */}
        <g className="couverture-fixe">
          <path d="M584 38 L546 94" stroke="#d2693a" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
          {[[130, '#1f6fb2'], [320, '#7fb0de'], [540, '#d2693a']].map(([x, couleur]) => (
            <g key={x} transform={`translate(${x} 128)`}><Coque couleur={couleur} /></g>
          ))}
        </g>

        <g className="couverture-anime">
          <path className="couverture-liaison" d="M584 38 L544 96" stroke="#d2693a" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
          <g transform="translate(130 128)">
            <g className="couverture-navire">
              <path className="couverture-sillage" d="M-38 21h-30M-42 26h-16" stroke="#6ba8e0" strokeWidth="1.75" strokeLinecap="round" />
              <g className="couverture-roulis">
                <Coque couleur="#1f6fb2" classePoint="couverture-point" />
                <g fill="#1f6fb2">
                  <rect className="couverture-barre-1" x="12" y="-18" width="4" height="5" rx="1" />
                  <rect className="couverture-barre-2" x="18" y="-22" width="4" height="9" rx="1" />
                  <rect className="couverture-barre-3" x="24" y="-26" width="4" height="13" rx="1" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {ZONES_COUVERTURE.map(([zone, reseau, etat, couleur], i) => (
          <div key={zone}>
            <span aria-hidden="true" className="block h-1 w-10 overflow-hidden rounded-full bg-marine/12">
              <span className={`couverture-jauge couverture-jauge-${i + 1} block h-full w-full rounded-full`} style={{ background: couleur }} />
            </span>
            <p className="mt-2.5 font-display text-[1rem] text-marine">{zone}</p>
            <p className="mt-0.5 text-[0.84rem] text-slate">{reseau} · {etat}</p>
          </div>
        ))}
      </div>
      <figcaption data-note-edition className="mt-4 border-t border-marine/10 pt-3 text-[0.8rem] text-marine/80">
        Suggestion d'image : garder cette animation sur la page publiée, ou la décliner en
        illustration du trajet entre le port et la pleine mer.{' '}
        <i>Alt : « Un navire quitte le port, perd le réseau terrestre, puis passe sur le satellite du bord »</i>
      </figcaption>
    </figure>
  );
}

const SOURCES = [
  ['Your Europe, Commission européenne : « Itinérance : ce que vous payez pour utiliser votre smartphone dans un autre pays de l\'UE », section bateau et avion.',
   'https://europa.eu/youreurope/citizens/consumers/internet-telecoms/mobile-roaming-costs/index_fr.htm'],
  ['ARCEP : « Comment fonctionne l\'itinérance à l\'international (hors Union européenne) ? », plafond par défaut, alerte et blocage.',
   'https://www.arcep.fr/mes-demarches-et-services/consommateurs/fiches-pratiques/itinerance-international-hors-union-europeenne.html'],
  ['UFC-Que Choisir : « Téléphoner en zone maritime : avis de tempête sur les factures ». Article ancien : nous en reprenons le mécanisme décrit, pas les tarifs cités.',
   'https://www.quechoisir.org/actualite-telephoner-en-zone-maritime-avis-de-tempete-sur-les-factures-n10537/'],
  ['Royal Caribbean : « Cruise 101: Getting Online When You\'re Onboard », page mise à jour en janvier 2021 : vérifiez les noms de forfaits en vigueur.',
   'https://webapps.royalcaribbean.com/blog/cruise-101-getting-online-when-youre-onboard/'],
];

function Sources() {
  return (
    <Reveal>
      <section className="mt-14 border-t border-marine/10 pt-8">
        <p className="label-muted">Sources</p>
        <ol className="mt-4 space-y-3">
          {SOURCES.map(([texte, url], i) => (
            <li key={url} className="flex gap-3 text-[0.85rem] leading-relaxed text-slate">
              <span className="font-mono text-[0.7rem] text-marine/80">[{i + 1}]</span>
              <a
                href={url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-slate underline decoration-marine/20 underline-offset-2 transition-colors hover:text-signal-fonce"
              >
                {texte}
              </a>
            </li>
          ))}
          <li className="flex gap-3 text-[0.85rem] leading-relaxed text-slate">
            <span className="font-mono text-[0.7rem] text-marine/80">[{SOURCES.length + 1}]</span>
            <span>
              Prix : catalogue fournisseurs MyBestSim, {n(art.source.lignes)} offres de{' '}
              {art.source.fournisseurs} fournisseurs, extrait le {dateFr(cat.meta.genere_le)}.
            </span>
          </li>
        </ol>
      </section>
    </Reveal>
  );
}

import SceneCard from "./SceneCard";
import SourceTag from "./SourceTag";
import { DWELL_WINDOW, STOPS_PER_ROOM, splitIntoStops } from "@/lib/journeyState";

/**
 * The 3-card system replacing one long chapter block per "room" scene (classroom / lab / molecule
 * — hero and closing keep their original single card, untouched). Visible text is written fresh
 * for a general audience — other students, people with no background in exact sciences — since
 * this site's job now is a good first impression, not a committee reading. Every number, formula
 * and citation from the original text still exists, verbatim, in a card's `detail` panel behind
 * "Més informació" — nothing here is a rewrite of the actual TDR, only of what a visitor sees first.
 *
 * Text is in Catalan, matching the TDR itself (see c:\Users\User\projectschool\TDR\04_TDR\output\
 * TDR_v05.docx) rather than the site's earlier Russian draft — content (rose as the confirmed
 * working material, the limonene/citronel·lol-geraniol chemistry contrast, the real personal story
 * from the TDR's own introduction, the Singh et al. 2025 novelty caveat) carries over from that
 * earlier draft, only the language changed.
 *
 * Each room's dwell is split into 6 tour stops (see STOPS_PER_ROOM/TOURS in journeyState.ts); only
 * the odd-indexed ones (1, 3, 5) carry a card — the even ones are wide/establishing or pure "look
 * at this" beats with no text at all, so a card now reads as present-at-one-stop-then-gone rather
 * than following the camera continuously across a third of the room's whole scroll range.
 */

function useThreeCardStops(window: { start: number; end: number }) {
  const stops = splitIntoStops(window, STOPS_PER_ROOM);
  return [stops[1], stops[3], stops[5]] as const;
}

export function ClassroomCards() {
  const [c1, c2, c3] = useThreeCardStops(DWELL_WINDOW.classroom);
  return (
    <>
      <SceneCard range={c1} side="left" eyebrow="Part I · L'aula on tot va començar" title="L'olor és química">
        <p>
          Cada flor fa una olor diferent perquè per dins hi ha molècules diferents. La primera idea
          era senzilla: agafar taronja, rosa i romaní, i veure de quina se n&apos;extreia «millor»
          l&apos;oli. Però comparar plantes tan diferents és com comparar pomes amb avions: el
          resultat només demostraria que són diferents, res més.
        </p>
      </SceneCard>

      <SceneCard
        range={c2}
        side="right"
        eyebrow="La idea"
        title="Una flor, dos mètodes"
        detail={
          <div className="space-y-3">
            <p>
              La primera versió d&apos;aquest treball comparava l&apos;aroma de plantes diferents —
              taronja, rosa, romaní — simplement per veure de quina s&apos;extreia «millor»
              l&apos;oli essencial. Però aquesta comparació no té una lògica científica rigorosa:
              plantes diferents contenen molècules radicalment diferents, i «millor» aquí no
              demostra res.
            </p>
            <p>
              Per això el disseny es va replantejar completament: en lloc de comparar plantes, es
              comparen <strong className="text-white/85">mètodes</strong> d&apos;extracció d&apos;un
              mateix material — la hipòtesi de treball: pètals de rosa (<em>Rosa damascena</em>,
              «rosa búlgara»; espècie encara pendent de confirmar pel proveïdor floral).
            </p>
            <p>
              La rosa i els cítrics, sobre els quals se solen fer aquests experiments, tenen una
              química radicalment diferent: als cítrics predomina el limonè, un hidrocarbur sense
              oxigen; a la rosa, els alcohols citronel·lol i geraniol. La pregunta és si els
              ultrasons funcionen igual de bé sobre alcohols que sobre hidrocarburs, i sobre un
              pètal de flor que sobre la pell d&apos;un fruit.
            </p>
          </div>
        }
      >
        <p>
          La solució: girar la idea 180°. En lloc de plantes diferents, un mateix material —
          pètals de rosa — tractat de dues maneres diferents. Així la variable és una sola: el
          mètode d&apos;extracció; tota la resta és honestament igual.
        </p>
      </SceneCard>

      <SceneCard
        range={c3}
        side="bottom"
        eyebrow="La pregunta"
        title="La pregunta que ho decideix tot"
        detail={
          <div className="space-y-3">
            <p>
              Tot va començar amb una idea força òbvia en la qual mai m&apos;havia aturat a pensar:
              la taronja, la rosa, el perfum — gairebé tot el que ens envolta fa alguna olor, i
              quasi mai ens preguntem per què. Al darrere hi ha tota una química — i la pregunta
              pràctica és encara més interessant: com es treu, exactament, aquesta olor d&apos;una
              planta, i com es conserva?
            </p>
            <p>
              La resposta clàssica és la hidrodestil·lació, un mètode amb segles d&apos;història,
              però lent i poc eficient. Buscant com accelerar-lo vaig trobar la intensificació per
              ultrasons (UAHD) i estudis amb cítrics on el rendiment arribava a créixer un 114%. I
              aquí va sorgir la idea: i si, en lloc d&apos;un altre cítric, agafo una flor amb una
              química completament diferent?
            </p>
            <p>
              Així va entrar en joc la rosa — i aquí hi ha una coincidència històrica bonica: el
              metge i filòsof persa Ibn Sina ja destil·lava rosa amb vapor al segle XI per
              obtenir-ne l&apos;essència amb finalitats mèdiques. Sembla que és una de les primeres
              plantes que es van destil·lar sistemàticament — un bon pont entre la part més antiga i
              la més moderna d&apos;aquest treball.
            </p>
          </div>
        }
      >
        <p>
          Així va néixer la pregunta central de tot el treball:{" "}
          <em className="text-white/90">
            la cavitació acústica — el tractament amb ultrasons — accelera l&apos;extracció de
            l&apos;oli essencial i la fa més eficient que la simple escalfor?
          </em>{" "}
          No és una pregunta filosòfica, sinó mesurable — calen els mateixos pètals, el mateix
          aparell i només un cronòmetre amb una balança. La resposta es busca a l&apos;habitació del
          costat.
        </p>
      </SceneCard>
    </>
  );
}

export function LabCards() {
  const [c1, c2, c3] = useThreeCardStops(DWELL_WINDOW.lab);
  return (
    <>
      <SceneCard
        range={c1}
        side="left"
        eyebrow="Part II · Dins del laboratori"
        title="Dos vasos, una hipòtesi"
        detail={
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase" style={{ color: "var(--color-accent)" }}>
                Condició A · Control
              </p>
              <p className="mt-1">
                Hidrodestil·lació convencional amb aparell de Clevenger: escalfor fins a ebullició,
                lectura del volum d&apos;oli a la trampa graduada cada 15 minuts fins a
                l&apos;estabilització.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase" style={{ color: "var(--color-accent)" }}>
                Condició B · UAHD
              </p>
              <p className="mt-1">
                Pretractament amb ultrasons (35–60 W, ~40 kHz, temps a determinar
                experimentalment), seguit de la mateixa destil·lació al mateix aparell.
              </p>
            </div>
          </div>
        }
      >
        <p>
          L&apos;experiment és una comparació honesta: dos vasos idèntics, els mateixos pètals de
          rosa, la mateixa escalfor fins a ebullició. L&apos;única diferència és un pas: en el segon
          cas, el material passa primer per un bany d&apos;ultrasons. Si el rendiment és diferent,
          la causa és el so, no l&apos;atzar.
        </p>
      </SceneCard>

      <SceneCard
        range={c2}
        side="right"
        eyebrow="Referent"
        title="No és un mite"
        hook="+114%"
        detail={
          <div className="space-y-3">
            <p>
              <SourceTag
                citation="Cadena-Cadena et al. (2025)"
                detail="BioTech (Basel) 14(3):59. Ultrasons (750 W, 40% d'amplitud, 20 min) abans de la hidrodestil·lació: rendiment de l'1,5±0,49% davant del 0,7±0,03% sense, en pell de raïm aranja."
              >
                Cadena-Cadena et al., 2025
              </SourceTag>{" "}
              — el pretractament amb ultrasons abans de la hidrodestil·lació va donar un augment de
              rendiment del 114% en pell de raïm aranja. Protocol clar i reproduïble — el referent
              principal per al disseny d&apos;aquest experiment.
            </p>
            <p className="font-mono text-[11px]">Rendiment (%) = m(oli) / m(pètals) × 100</p>
            <p>
              Un article de 2025 de tema semblant (Singh, Wikaputri, Bhoi et al.) va aplicar
              ultrasons a pètals de rosa — però per a extracció amb dissolvent (etanol), no
              hidrodestil·lació amb aigua com aquí. Article d&apos;accés restringit, trobat per
              cerca web, no confirmat del tot. Per això la comparació «hidrodestil·lació versus
              UAHD amb aigua, sobre rosa» sembla, de moment, un camí encara no explorat.
            </p>
            <p>
              Mínim 3 repeticions independents per condició — prou per calcular la mitjana i la
              desviació estàndard (s = √[Σ(xᵢ−x̄)²/(n−1)]), i traçar un gràfic amb barres
              d&apos;error. Si hi ha temps, test t de Student per comprovar la significació
              estadística de la diferència entre mètodes.
            </p>
          </div>
        }
      >
        <p>
          Aquest és el rendiment que va créixer — però en pell de raïm aranja, amb limonè, no en
          pètals de rosa amb els alcohols citronel·lol i geraniol. No s&apos;ha trobat cap estudi
          similar fet específicament amb rosa i amb aigua — aquest treball intenta omplir
          precisament aquest buit.
        </p>
      </SceneCard>

      <SceneCard
        range={c3}
        side="bottom"
        eyebrow="A continuació"
        title="Però per què funciona, exactament?"
        detail={
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-white/50 uppercase">Seguretat</p>
              <p className="mt-1">
                Guants tèrmics i ulleres de protecció durant tot l&apos;experiment. L&apos;aparell
                de Clevenger és de vidre i fràgil — evitar xocs tèrmics. No obrir el bany
                d&apos;ultrasons en funcionament. Ventilació adequada de l&apos;espai.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-wide text-white/50 uppercase">Limitacions conegudes</p>
              <p className="mt-1">
                La potència d&apos;ultrasons disponible (~35–60 W) és molt inferior als
                homogeneïtzadors de sonda de laboratori (~750 W) dels estudis de referència. La
                composició de l&apos;oli no s&apos;analitza — sense accés a GC-MS, només es compara
                el rendiment quantitatiu.
              </p>
            </div>
            <p className="rounded-lg border-l-4 border-amber-500 bg-white/5 p-2 text-[11px]">
              ⚠️ L&apos;experiment encara no s&apos;ha realitzat — els resultats apareixeran en
              aquesta pàgina després de la defensa.
            </p>
          </div>
        }
      >
        <p>
          Sobre el paper tot està pensat: protocol, repeticions, fórmula de rendiment, seguretat
          per si l&apos;aparell de vidre no aguanta l&apos;escalfor. Però per entendre per què el so
          és capaç de trencar una cèl·lula vegetal, cal baixar on l&apos;ull no hi arriba — al
          nivell d&apos;una sola molècula.
        </p>
      </SceneCard>
    </>
  );
}

export function MoleculeCards() {
  const [c1, c2, c3] = useThreeCardStops(DWELL_WINDOW.molecule);
  return (
    <>
      <SceneCard
        range={c1}
        side="left"
        eyebrow="Part III · A nivell molecular"
        title="El nas és més llest del que sembla"
        hook="~390 gens"
        detail={
          <p>
            Els receptors olfactius estan codificats per tota una família de gens — uns 388–390
            gens funcionals en humans, d&apos;un miler que hi ha a la família (la resta són
            pseudogens). La molècula de l&apos;olor s&apos;uneix al receptor i dispara un senyal que
            el cervell interpreta com una aroma concreta.{" "}
            <SourceTag
              citation="Buck, L.M.; Axel, R. (1991)"
              detail="Cell 65(1):175–187. Descobriment de la família de gens dels receptors olfactius — Premi Nobel de Fisiologia o Medicina 2004."
            >
              Buck &amp; Axel, 1991
            </SourceTag>{" "}
            ·{" "}
            <SourceTag
              citation="Malnic, B.; Godfrey, P.A.; Buck, L.B. (2004)"
              detail="PNAS 101(8):2584–2589. Nombre exacte de gens funcionals de receptors olfactius en humans."
            >
              Malnic et al., 2004
            </SourceTag>
          </p>
        }
      >
        <p>
          Uns 390 gens diferents del cos humà s&apos;ocupen només d&apos;una cosa: reconèixer
          olors. És una de les famílies gèniques més grans que existeixen en humans — més gran que
          la de la vista o l&apos;oïda. Cada gen respon a un grup concret de molècules, i el cervell
          combina els senyals de tots per formar una olor reconeixible.
        </p>
      </SceneCard>

      <SceneCard
        range={c2}
        side="right"
        eyebrow="El mecanisme"
        title="Una explosió dins la bombolla"
        detail={
          <div className="space-y-3">
            <p>
              Els terpens — les peces bàsiques de la majoria de molècules aromàtiques — la planta
              els sintetitza per dues vies paral·leles (la del mevalonat, MVA, i la del
              metileritritol fosfat, MEP), que treballen juntes precisament als teixits de la
              flor, i no només als cítrics com es pensava abans.{" "}
              <SourceTag
                citation="Dudareva, N. et al. (2005)"
                detail="PNAS 102(3):933–938. Les vies MVA/MEP de biosíntesi de terpens treballen juntes al teixit floral del boca de dragó."
              >
                Dudareva et al., 2005
              </SourceTag>
            </p>
            <p>
              Els ultrasons creen microbombolles que creixen a la superfície de la cèl·lula i
              col·lapsen a alta amplitud — trencant la paret cel·lular i facilitant la sortida de
              l&apos;oli essencial mitjançant un transport de massa accelerat, en condicions més
              suaus que amb l&apos;escalfor convencional.{" "}
              <SourceTag
                citation="Thilakarathna, R.C.N. et al. (2022)"
                detail="J Food Sci Technol 60(4):1222–1236. Article de revisió: mecanisme de la cavitació acústica (20–40 kHz) en l'extracció d'olis."
              >
                Thilakarathna et al., 2022
              </SourceTag>
            </p>
          </div>
        }
      >
        <p>
          La pròpia planta produeix l&apos;aroma per dues vies químiques independents que
          conflueixen precisament als teixits de la flor — una troballa que va capgirar la idea que
          això només passava als cítrics. I això n&apos;accelera la sortida: els ultrasons creen al
          líquid bombolles microscòpiques que creixen i col·lapsen amb força a la superfície de la
          cèl·lula — la paret no ho resisteix, i les molècules de l&apos;aroma surten més ràpid que
          amb l&apos;escalfor normal.
        </p>
      </SceneCard>

      <SceneCard
        range={c3}
        side="bottom"
        eyebrow="Honestedat"
        title="Falta comprovar-ho a la pràctica"
        detail={
          <p>
            Una part de les xifres de fonts properes (per exemple, l&apos;augment declarat «de 2514
            vegades» a Abdel Samad et al., 2023) està marcada al mateix TDR com no verificada
            directament per la font original — aquí i al text del treball només s&apos;aporten
            dades confirmades i reproduïbles.
          </p>
        }
      >
        <p>
          Important: una part de les xifres més cridaneres de fonts properes (com el suposat
          augment «de 2514 vegades») no s&apos;ha inclòs conscientment en aquest treball — no estan
          verificades per la font original. Aquí només s&apos;utilitzen dades confirmades i
          reproduïbles, encara que sonin menys espectaculars. Tot el que hi ha hagut fins ara és
          teoria i pla. A partir d&apos;ara, l&apos;experiment real: balança, cronòmetre i mesures
          pròpies.
        </p>
      </SceneCard>
    </>
  );
}

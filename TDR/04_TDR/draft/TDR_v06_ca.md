<!-- NOTA INTERNA: v05, reescriptura completa per sonar mes natural i menys "informe": sense parentesis d'autoreferencia a seccions/capitols, cites reduides a les 2-3 mes rellevants, marcadors de provisionalitat reformulats com a frases normals, bullets mantinguts pero una mica retallats. Mateixa estructura de capitols i mateixes figures que v04. -->

## Resum

Aquest treball estudia com el mètode d'extracció afecta l'obtenció d'oli essencial a partir de pètals de rosa. La hidrodestil·lació és la tècnica clàssica per obtenir olis essencials, però és lenta i consumeix molta energia. Una variant més recent, la hidrodestil·lació assistida per ultrasons (UAHD), aprofita la cavitació acústica per trencar les cèl·lules que contenen l'oli i accelerar-ne l'alliberament. Els estudis que documenten aquesta millora estan fets gairebé sempre amb pell de cítric, on el compost majoritari és el limonè; la rosa, en canvi, té com a majoritaris alcohols terpènics com el citronel·lol i el geraniol.

La part teòrica recorre la història de la destil·lació, les bases de l'olfacte, la química dels compostos aromàtics i dels terpens, el funcionament de la hidrodestil·lació i el mecanisme de la cavitació. La part experimental compara, amb un aparell de Clevenger, la destil·lació convencional i la mateixa destil·lació precedida de 30 minuts d'ultrasons en un bany de 110 W, mesurant el rendiment i el temps d'extracció, amb un control positiu amb pell de cítric per comprovar que el muntatge és capaç de detectar l'efecte. En el moment d'aquesta entrega l'experiment encara no s'ha dut a terme: el capítol corresponent és el disseny complet, no els resultats.

**Paraules clau:** oli essencial, hidrodestil·lació, ultrasons, cavitació acústica, rosa, terpens, química verda.

## 1. Introducció

Fa un temps, buscant un tema per a aquest treball, em vaig adonar d'una cosa una mica òbvia però que mai m'havia parat a pensar: gairebé tot el que fem cada dia té una olor, i quasi mai ens preguntem per què. Una taronja, una rosa, un perfum... totes aquestes olors són, al final, un munt de molècules invisibles que floten per l'aire i que el nostre nas és capaç de detectar. Quan vaig començar a llegir sobre el tema, això és el que més em va enganxar: darrere d'una cosa tan quotidiana com "fer bona olor" hi ha una química bastant complexa.

L'altra part que em va interessar és més pràctica: com s'aconsegueix treure aquesta olor d'una planta i guardar-la? La resposta clàssica és la destil·lació amb vapor d'aigua (hidrodestil·lació): es fa passar vapor a través del material vegetal, aquest vapor arrossega els compostos aromàtics, i després es recull i es condensa. És un mètode que funciona des de fa segles, però és lent —sovint diverses hores— i gasta molta energia.

Buscant com millorar això, vaig trobar un concepte que no coneixia: la **hidrodestil·lació assistida per ultrasons (UAHD)**. La idea és aplicar ones ultrasòniques al material abans o durant la destil·lació perquè les cèl·lules que contenen l'oli es trenquin més ràpid, i així s'extregui més quantitat en menys temps. Els estudis que vaig trobar amb cítrics són bastant impressionants: un 114% més de rendiment amb ultrasons que sense, en pell de raïm aranja (Cadena-Cadena et al., 2025). Això em va fer pensar: i si en comptes de repetir el mateix amb cítrics (ja força estudiats) ho provo amb una flor diferent, amb una química diferent?

Aquí és on entra la rosa. Vaig descobrir una cosa curiosa: el metge i filòsof persa Ibn Sina, al segle XI, ja destil·lava rosa amb vapor per obtenir la seva essència amb finalitats medicinals. La rosa no és, doncs, una elecció a l'atzar: és probablement una de les primeres flors que es van destil·lar sistemàticament, i em sembla una bona manera de connectar la part més antiga d'aquest treball amb la part més moderna.

El que proposo, doncs, és comparar dos mètodes d'extracció —hidrodestil·lació convencional amb un aparell de Clevenger, i hidrodestil·lació assistida per ultrasons— sobre pètals de rosa. La rosa de referència a la literatura és *Rosa damascena*; quina varietat concreta podré fer servir depèn del que em pugui proporcionar una floristeria, i ho concreto més endavant, al capítol del disseny experimental. En tot cas, la rosa és químicament bastant diferent dels cítrics: la rosa és rica en alcohols com el citronel·lol i el geraniol, mentre que els cítrics estan dominats pel limonè, que no és un alcohol. La pregunta que em faig és si la millora que s'ha vist en cítrics es manté quan canvies tant el material com el tipus de compost majoritari.

**Objectiu general:** entendre la química de les aromes i el procés de destil·lació, i comprovar com el mètode d'extracció afecta el rendiment i el temps d'extracció de l'oli essencial de material floral.

**Objectius més concrets:**
- Explicar les bases de l'olfacte i dels compostos aromàtics.
- Entendre per què funciona la hidrodestil·lació i què és la cavitació acústica.
- Dissenyar un experiment repetible que comparí de manera justa els dos mètodes.
- Veure si els avantatges de la UAHD documentats en cítrics es mantenen amb un material diferent.
- Ser honest sobre les limitacions de fer aquest experiment amb equipament casolà.

**Pregunta d'investigació:** Com afecta el mètode d'extracció —hidrodestil·lació convencional versus hidrodestil·lació assistida per ultrasons— al rendiment (%) i al temps d'extracció de l'oli essencial de pètals de rosa?

**Hipòtesi:** Crec que la UAHD donarà un rendiment més alt en menys temps que el mètode convencional, perquè la cavitació acústica hauria de trencar les estructures cel·lulars que contenen l'oli i facilitar que surti cap a l'aigua.

> No sé quina serà la magnitud real d'aquesta millora, perquè tota la literatura que he trobat és sobre cítrics, amb una química diferent de la de la rosa. Podria ser una millora semblant, més petita o (menys probable) més gran. Part de la gràcia d'aquest treball és, precisament, comprovar-ho.

[FIGURA: fig_timeline.png|Línia del temps amb els moments clau de la història de la destil·lació i la perfumeria que es comenten en aquest capítol.|Elaboració pròpia.]

## 2. Història de la perfumeria i de la destil·lació

### 2.1 Orígens antics

L'ús d'aromes no és cap invent modern: es remunta a milers d'anys enrere. Les primeres civilitzacions ja feien servir plantes aromàtiques, resines i olis, sobretot amb finalitats religioses i, més endavant, cosmètiques.

A l'antic Egipte els perfums tenien un paper molt important, i no només per fer bona olor. S'utilitzaven en rituals religiosos i, curiosament, també en la momificació. Substàncies com la mirra o l'encens eren molt valorades, i no és casualitat: contenen compostos amb propietats antimicrobianes que ajuden a retardar la descomposició, cosa que explica el seu ús en la momificació més enllà del valor simbòlic.

En aquesta època els mètodes eren molt bàsics: maceració de plantes en olis grassos, o cremar resines per obtenir fum aromàtic. Cap d'aquests mètodes permetia separar i concentrar l'aroma d'una manera tan eficaç com ho faria, segles després, la destil·lació.

### 2.2 El món àrab i l'edat mitjana: la invenció de l'alambí

Aquest és, per a mi, un dels punts més interessants de tota la part d'història. Es considera que el químic Jabir ibn Hayyan, al segle VIII, va perfeccionar l'alambí, l'aparell del qual ve el nom modern "alambí" en moltes llengües.

[FIGURA: alembic_diagram.png|Esquema en secció d'un alambí clàssic: el líquid s'escalfa al matràs inferior, el vapor puja i es condensa al coll lateral.|H Padleckas, Wikimedia Commons, CC BY-SA 3.0 / GFDL.]

Poc després, el filòsof Al-Kindi va escriure un llibre amb més de cent receptes d'olis aromàtics i mètodes de destil·lació. És un dels primers textos que expliquen com obtenir essències de manera sistemàtica, i no només com barrejar-les artesanalment.

I aquí ve la part amb més relació amb aquest treball: a Ibn Sina se li atribueix tradicionalment una de les primeres descripcions detallades de la destil·lació amb vapor aplicada, precisament, a l'obtenció d'essència de rosa, que utilitzava amb finalitats terapèutiques. No sé fins a quin punt els historiadors es posen d'acord sobre si va ser realment el primer a fer-ho, però el fet és que la rosa apareix des de molt aviat lligada a la història de la destil·lació. Per a mi, això és una raó més (a banda de les químiques) per triar-la com a material d'aquest treball.

[FIGURA: ibn_sina_canon.jpg|Coberta d'un manuscrit medieval del Canon de medicina d'Ibn Sina (Wellcome Library, Londres).|Domini públic, Wikimedia Commons.]

La destil·lació amb vapor era important perquè permetia treballar a temperatures més baixes que el punt d'ebullició dels compostos aromàtics purs, evitant així que es fessin malbé amb la calor. Aquest coneixement va arribar a l'Europa cristiana a través d'Al-Àndalus, i paraules com "alambí", "alcohol" o "elixir" —totes d'origen àrab— en són testimoni.

### 2.3 La revolució química (segles XVIII–XIX)

Amb el desenvolupament de la química orgànica als segles XVIII i XIX, els científics van començar a identificar —i més tard a sintetitzar— els compostos concrets responsables de moltes olors naturals. Poder caracteritzar molècules com els terpens va ser un pas clau: per primera vegada es podia explicar, a escala molecular, per què una planta fa una olor determinada.

### 2.4 Perfumeria moderna i química verda

A partir d'aquí, i sobretot durant el segle XX, la perfumeria es converteix en una indústria basada en química fina: es comencen a sintetitzar compostos aromàtics al laboratori, cosa que permet crear olors noves i no dependre només de recursos naturals limitats. Avui dia la perfumeria combina compostos naturals i sintètics.

El que trobo més rellevant per a aquest treball és que, més recentment, la indústria ha començat a adoptar tècniques d'extracció "verdes" —com la UAHD— per raons tant econòmiques com ambientals. Aquest treball, en el fons, s'emmarca en aquesta mateixa lògica: gastar menys energia i aprofitar millor els recursos.

## 3. Què és una olor: bases de l'olfacte

### 3.1 Definició general

Una olor és, bàsicament, el resultat que hi hagi molècules volàtils a l'aire que arribin al nostre nas. Quan respirem, aquestes molècules entren a la cavitat nasal i són detectades pel sistema olfactiu.

### 3.2 Com funciona el nas per dins

La detecció comença a l'epiteli olfactiu, una zona a la part alta del nas amb milions de neurones receptores. Cadascuna d'aquestes neurones té, a la seva superfície, un únic tipus de proteïna receptora. Els seus axons van directament al bulb olfactiu, una estructura del cervell situada just per sobre del nas, connectada a zones relacionades amb l'emoció i la memòria. Això explica per què les olors ens porten records amb tanta força: la connexió amb aquestes zones és molt més directa que en altres sentits.

### 3.3 El procés, pas a pas

1. Les molècules volàtils es dispersen a l'aire.
2. Entren al nas amb la respiració.
3. Es dissolen en la mucosa que recobreix l'epiteli olfactiu.
4. Interaccionen amb receptors específics de les neurones olfactives.
5. Això activa un senyal elèctric a la neurona.
6. El bulb olfactiu, i després el còrtex cerebral, interpreten el conjunt de senyals com una olor concreta.

[FIGURA: fig_olfactory_pathway.png|Etapes del procés olfactiu, des de la molècula volàtil fins a la percepció conscient al còrtex cerebral.|Elaboració pròpia.]

### 3.4 Els receptors olfactius

El mecanisme exacte no es va conèixer fins al 1991, quan Linda Buck i Richard Axel van identificar la família de gens que codifica els receptors olfactius, una troballa per la qual van rebre el Premi Nobel el 2004 (Buck i Axel, 1991). En humans hi ha uns 390 gens funcionals per a receptors olfactius, dins d'una família que passa del miler si es compten els que ja no funcionen.

El que trobo més interessant és que no funciona com un pany i clau d'un sol receptor per olor. Cada neurona té un únic tipus de receptor, però un mateix receptor pot respondre a diverses molècules semblants, i una mateixa molècula pot activar diversos receptors alhora. El cervell interpreta l'olor a partir d'aquest patró combinat, una mica com si poguéssim generar milers de colors combinant només uns quants colors bàsics.

Això també explica un fenomen que segur que tothom ha notat alguna vegada: que hi hagi persones que no percebin una olor concreta que per a altres és evident. Si cada persona té petites variacions genètiques en els seus gens de receptors, té sentit que el patró que percep cadascú davant la mateixa molècula no sigui exactament igual. Quan falta la capacitat de detectar olors, en general o d'una molècula concreta, se'n diu anòsmia.

### 3.5 Perquè una substància faci olor

No qualsevol molècula pot ser detectada com a olor. Cal que compleixi unes quantes condicions:
- Ha de ser volàtil, per poder passar a l'aire amb facilitat.
- Ha de tenir una massa molecular relativament baixa (normalment per sota de 300 g/mol).
- Ha de tenir prou polaritat per travessar la mucosa, però també prou caràcter lipòfil per interaccionar amb el receptor.
- Ha d'encaixar, encara que sigui parcialment, amb algun dels receptors disponibles.

### 3.6 Quan la forma ho és tot: el cas del limonè

Un dels exemples que més em va cridar l'atenció mentre investigava és el del limonè. El limonè té dos "enantiòmers" —dues formes que són com la mà dreta i l'esquerra—: l'una fa olor de taronja i l'altra de llimona, tot i tenir exactament la mateixa fórmula i el mateix pes molecular. Això passa perquè els receptors olfactius, com qualsevol proteïna, poden distingir entre aquestes dues formes, igual que una mà dreta només encaixa bé amb un guant dret. Aquest exemple diu molt: el nostre nas no reacciona només a de quins àtoms està feta una molècula, sinó també a la seva forma exacta en l'espai.

### 3.7 I el cervell, també hi diu la seva

L'olor que percebem no depèn només de la molècula: també depèn del cervell que la interpreta. El cervell associa cada senyal químic amb records i experiències prèvies, i per això la mateixa olor pot fer-nos sentir coses diferents a persones diferents.

## 4. Compostos aromàtics

### 4.1 Compostos orgànics volàtils

Cap olor natural ve d'una sola substància: sempre és una barreja de compostos orgànics volàtils, cadascun aportant una part de l'aroma total. Per això reproduir una olor natural amb síntesi química no és fàcil: normalment cal combinar moltes substàncies en proporcions molt concretes.

### 4.2 Les grans famílies

- Terpens — formats per unitats d'isoprè. Olors fresques, cítriques o resinoses.
- Alcohols — grup –OH. Aromes suaus i florals (geraniol, citronel·lol).
- Aldehids — grup –CHO. Olors més intenses (el citral fa olor de llimona).
- Èsters — d'un àcid i un alcohol. Aromes dolces i afruitades.
- Cetones — grup carbonil. Sovint olors dolces.
- Compostos fenòlics — un –OH sobre un anell aromàtic. Olors especiades.

### 4.3 Alguns exemples

| Compost | Família | Olor |
|---|---|---|
| Limonè | Terpè (monoterpè) | Cítrica |
| Geraniol | Alcohol terpènic | Floral, rosa |
| Citronel·lol | Alcohol terpènic | Rosa, més suau |
| Citral | Aldehid terpènic | Llimona |
| Acetat d'etil | Èster | Afruitada |
| Eugenol | Fenol | Especiada |

### 4.4 Res és pur: la complexitat de les mescles

Un dels aspectes que m'ha sobtat més és que els olis essencials mai són una única substància: són mescles amb desenes o centenars de compostos, cadascun amb la seva proporció. L'oli de taronja pot tenir desenes de compostos, tot i que el limonè n'és clarament el majoritari; l'oli de rosa, de manera semblant, en té desenes, amb el citronel·lol i el geraniol com a majoritaris. Aquests components minoritaris són els que fan que dues varietats de la mateixa flor no facin exactament la mateixa olor.

### 4.5 Estructura, olor, i com s'analitza

La mida, la forma i els grups funcionals d'una molècula determinen com interactua amb els receptors. Per identificar amb precisió tots els compostos d'un oli essencial, la química analítica fa servir cromatografia de gasos amb espectrometria de masses (GC-MS): primer separa els compostos segons la seva volatilitat, i després els identifica comparant-ne l'espectre amb bases de dades.

Jo no tinc accés a un equip de GC-MS, així que a la part experimental només podré comparar el rendiment global (%), sense poder dir amb precisió com canvia la composició exacta del destil·lat segons el mètode. Ho considero una limitació real d'aquest treball.

## 5. Terpens, alcohols terpènics i olis essencials

### 5.1 La unitat d'isoprè

Els terpens són probablement el grup més important de compostos en la química de les aromes vegetals. Es construeixen repetint una unitat de cinc carbonis anomenada isoprè, i es troben en moltíssimes plantes: cítrics, herbes aromàtiques, flors, coníferes.

### 5.2 D'on surten: les rutes MVA i MEP

Una cosa que no sabia abans d'investigar és que les plantes no fabriquen els terpens directament a partir d'isoprè lliure, sinó a partir de dos precursors amb cinc carbonis, que es poden obtenir per dues vies metabòliques diferents: la via del mevalonat, al citosol, i la via del metileritritol fosfat, als plastidis.

Al principi es pensava que cada via feia un tipus de terpè diferent, però sembla que totes dues poden contribuir a totes les classes de terpens, sobretot en teixit floral. Aquest darrer detall m'ha semblat rellevant perquè confirma que el teixit floral —com el que faré servir a la part experimental— té la seva pròpia maquinària bioquímica per produir terpens, i no és simplement una versió "pitjor" del teixit cítric.

[FIGURA: fig_biosynthesis.png|Les dues vies de biosíntesi de terpens (MVA al citosol, MEP al plastidi) conflueixen en la producció dels diferents tipus de terpens.|Elaboració pròpia.]

### 5.3 Tipus de terpens

- Monoterpens — dues unitats d'isoprè, els més comuns en aromes. Exemple: limonè.
- Alcohols monoterpènics — derivats amb un –OH afegit. Exemple: geraniol, citronel·lol.
- Sesquiterpens — tres unitats d'isoprè, menys volàtils, olors més pesades.
- Diterpens i superiors — pràcticament no volàtils, amb altres funcions biològiques.

### 5.4 Olis essencials: per què existeixen

Els olis essencials són mescles de terpens i derivats que la planta sintetitza i emmagatzema en estructures especialitzades: glàndules a la pell dels cítrics, tricomes a fulles com les de la menta o el romaní, o cèl·lules secretores als pètals de moltes flors.

I aquí hi ha una cosa que trobo interessant: aquests compostos no es fan per casualitat. Sovint tenen una funció ecològica real per a la planta —atraure pol·linitzadors, allunyar herbívors, o defensar-se de microorganismes. L'aroma que percebem els humans és, en certa manera, un efecte secundari d'aquesta funció biològica.

### 5.5 El cas dels cítrics

Als cítrics, l'oli essencial es concentra al flavedo (la part exterior de la pell), i el component majoritari és el limonè, que pot arribar al 90% del total. Per sota del flavedo hi ha l'albedo, la part blanca i esponjosa que no conté pràcticament gens d'oli essencial —un detall que em va fer entendre per què en molts protocols només es fa servir la part ratllada de la pell, i no la fruita sencera.

[FIGURA: orange_cross_section.jpg|Secció transversal d'una taronja: es distingeix el flavedo (la capa exterior acolorida, rica en glàndules oleíferes) de l'albedo (la part blanca i esponjosa, pràcticament sense oli essencial).|Elkagye, Wikimedia Commons, CC BY-SA 3.0.]

El limonè bull a 176°C en estat pur, molt per sobre dels 100°C —per això cal destil·lar-lo amb vapor i no escalfar-lo directament. Aquest és el material que apareix a gairebé tots els estudis sobre UAHD que he trobat, i per això és el meu punt de comparació.

### 5.6 El meu material d'estudi: la rosa

L'oli essencial de Rosa damascena, conegut tradicionalment com a "rosa otto" quan s'obté per hidrodestil·lació, té una composició força diferent de la dels cítrics: en lloc d'un monoterpè no oxigenat com el limonè, els components majoritaris són alcohols com el citronel·lol i el geraniol, junt amb nerol i, en algunes varietats, hidrocarburs de cadena llarga.

[FIGURA: rosa_damascena.jpg|Flor de Rosa damascena, l'espècie de referència en la literatura sobre oli de rosa i el punt de comparació d'aquest treball.|Kurt Stüber, Wikimedia Commons, CC BY-SA 3.0.]

Els percentatges exactes varien molt segons la varietat, la zona de cultiu i fins i tot l'any de collita, i no els he pogut contrastar amb una font primària. Per això no dono aquí cap rang numèric concret: el que sí que està ben establert, i és el que importa per a aquest treball, és que els majoritaris de l'oli de rosa són alcohols terpènics —citronel·lol i geraniol— i no un monoterpè no oxigenat com el limonè dels cítrics. Aquesta diferència de família química és tot el que necessito per plantejar la comparació; les proporcions exactes només caldrien si pogués analitzar la composició amb GC-MS, cosa que no està al meu abast.

El que a mi em sembla més rellevant d'aquesta diferència de composició és que em permet preguntar-me si la cavitació afecta igual l'alliberament d'un alcohol terpènic que el d'un monoterpè no oxigenat —són dues famílies químiques i dos tipus de teixit vegetal diferents.

### 5.7 Algunes propietats físiques importants

Els olis essencials, en general, són volàtils, hidrofòbics (no es barregen amb l'aigua) i sensibles a l'oxidació. Aquesta taula recull les dades dels compostos individuals més rellevants per a aquest treball:

| Compost | Fórmula | Massa molar (g/mol) | Punt d'ebullició | Font |
|---|---|---|---|---|
| Limonè | C₁₀H₁₆ | 136,24 | 176°C | PubChem CID 22311 |
| Geraniol | C₁₀H₁₈O | 154,25 | 230°C | PubChem CID 637566 |
| Citronel·lol | C₁₀H₂₀O | 156,27 | 225°C | PubChem CID 8842 |

[FIGURA: limonene_structure.png|Estructura molecular del limonè (C10H16).|PubChem, CID 22311, NIH.]
[FIGURA: geraniol_structure.png|Estructura molecular del geraniol (C10H18O).|PubChem, CID 637566, NIH.]
[FIGURA: citronellol_structure.png|Estructura molecular del citronel·lol (C10H20O).|PubChem, CID 8842, NIH.]

Es pot veure que els alcohols de la rosa bullen una mica per sobre del limonè, tot i tenir una massa molar semblant. És una diferència petita, però podria influir en el temps que cal perquè el vapor d'aigua arrossegui aquests compostos.

### 5.8 Per què tot això importa per a l'extracció

Els terpens i els seus derivats són relativament fàcils d'extreure per destil·lació perquè, encara que el seu punt d'ebullició és superior als 100°C, l'arrossegament amb vapor d'aigua permet extreure'ls a temperatures molt més baixes. Això val tant per als cítrics com per a la rosa.

## 6. La destil·lació

### 6.1 La idea de base

La destil·lació separa substàncies aprofitant que tenen volatilitats diferents. Quan un líquid s'escalfa, les molècules amb prou energia passen a gas; si es recull aquest vapor i es refreda, es torna a condensar en líquid, ara separat de la resta de components.

### 6.2 Hidrodestil·lació: la idea aplicada als olis essencials

Per obtenir olis essencials es fa servir destil·lació amb vapor d'aigua, que permet extreure els compostos aromàtics sense necessitat d'escalfar-los fins al seu propi punt d'ebullició. Hi ha diverses variants: contacte directe entre el material i l'aigua bullent, o vapor generat a part que només travessa el material. Jo faig servir la variant directa, amb un aparell de Clevenger.

### 6.3 L'aparell de Clevenger

És, probablement, l'aparell més estàndard en la literatura sobre olis essencials. Consisteix en un matràs (on van l'aigua i el material vegetal), connectat a una trampa graduada en forma de "U" i a un condensador. El vapor arrossega els compostos, es condensa i cau a la trampa; com que l'oli és menys dens que l'aigua i no s'hi barreja, es queda a sobre d'una petita columna d'aigua i se'n pot llegir el volum directament a l'escala graduada, mentre l'excés d'aigua torna cap al matràs.

[FIGURA: clevenger_diagram.png|Muntatge complet d'hidrodestil·lació tipus Clevenger: (A) control de temperatura, (B) matràs amb el material vegetal, (C) trampa de Clevenger on se separen l'oli i l'hidrolat, (D) condensador.|Sadgrove i Jones (2015), Agriculture 5(1), 48-102, CC BY 4.0.]

[VIDEO: video_clevenger_thumb.jpg|https://www.youtube.com/watch?v=s_KuvXXvgX4|Demostració real d'una hidrodestil·lació amb aparell de Clevenger (extracció d'oli de gingebre).|AGRI LEARN with Anuj, YouTube.]

### 6.4 Per què funciona: la llei de Dalton

Quan dos líquids que no es barregen bullen junts, cadascun genera la seva pròpia pressió de vapor per separat, i la pressió total és la suma de totes dues (llei de Dalton):

**P(total) = P(aigua) + P(compost)**

El sistema bull quan aquesta pressió total iguala la pressió atmosfèrica. Com que se sumen les dues pressions parcials, la mescla bull a una temperatura inferior a la de cadascun dels components per separat. El limonè pur bull a 176°C, però amb vapor d'aigua es pot arrossegar a una temperatura molt propera als 100°C —gairebé 80°C menys, cosa que evita que es faci malbé per la calor. El mateix val per als alcohols de la rosa.

Per posar-hi un número: si a 100°C l'aigua sola ja fa una pressió de vapor pràcticament igual a l'atmosfèrica, qualsevol pressió addicional que aporti el compost aromàtic —per petita que sigui— ja fa que la suma superi la pressió atmosfèrica abans d'arribar-hi. Per això una mescla d'aigua i oli sol començar a bullir una mica per sota del punt d'ebullició normal de l'aigua pura.

Per a mescles miscibles (que no és el meu cas) el fenomen equivalent es descriu amb la llei de Raoult.

### 6.5 Què n'obtens, al final

- Oli essencial — la fase orgànica, amb la major part dels compostos aromàtics.
- Hidrolat (aigua floral) — la fase aquosa, amb petites quantitats d'aroma dissolta.

Es separen amb facilitat perquè tenen densitats diferents i no es barregen.

### 6.6 Punts forts i febles del mètode convencional

A favor: temperatures moderades, es conserven bé els compostos sensibles a la calor, és senzill i molt documentat.

En contra: no tots els compostos aguanten ni tan sols aquesta temperatura moderada durant molta estona; el rendiment pot ser baix; cal temps i control constant.

### 6.7 Com accelerar-ho: la hidrodestil·lació assistida per ultrasons

#### 6.7.1 Què és la cavitació acústica

La UAHD parteix del mateix principi, però hi afegeix ultrasons abans o durant el procés, que provoquen cavitació acústica. Quan una ona ultrasònica travessa un líquid, crea zones de pressió alta i baixa alternades. A les zones de pressió baixa es formen microbombolles, que creixen fins que, en arribar a una mida crítica, col·lapsen de manera gairebé instantània prop de les parets cel·lulars. Aquest col·lapse genera un microjet de líquid a gran velocitat que pot trencar-les mecànicament.

[FIGURA: fig_cavitation.png|Seqüència simplificada de la cavitació acústica: nucleació, creixement, col·lapse de la bombolla i microjet que trenca la paret cel·lular.|Elaboració pròpia.]

[VIDEO: video_cavitation_thumb.jpg|https://www.youtube.com/watch?v=U-uUYCFDTrc|Explicació general del fenomen físic de la cavitació.|IET Institute for Energy Technology, YouTube.]

#### 6.7.2 Què li passa al teixit vegetal

Aquestes microforces trenquen les glàndules oleíferes, els tricomes o les cèl·lules secretores, i alliberen l'oli directament cap a l'aigua, en lloc que hagi de difondre's lentament a través de parets cel·lulars intactes. Una manera senzilla de visualitzar-ho: en el mètode convencional, l'oli ha de trobar el camí de sortida travessant capes de cèl·lules intactes, com aigua filtrant-se per terra compactada. Amb la cavitació, és com si s'obrissin milers de petits forats directament on hi ha l'oli emmagatzemat.

#### 6.7.3 El que diu la literatura (i el que no diu)

Cadena-Cadena et al. (2025) van fer un pretractament amb ultrasons (sonda, 750 W, 20 min) en pell de raïm aranja: rendiment d'1,5 ± 0,49% amb ultrasons davant de 0,7 ± 0,03% sense —un 114% més, és a dir gairebé el doble. Val la pena mirar també la desviació: ±0,49 sobre 1,5 és molta variabilitat, i això ja m'avisa que amb poques repeticions una diferència real pot quedar tapada pel soroll de les mesures.

Hi ha un altre estudi que es cita sovint amb xifres espectaculars: Abdel Samad et al. (2023) parlen d'un augment de 2514 vegades amb un prototip d'UAHD sobre pell de taronja. He anat a l'article original per veure d'on surt aquesta xifra, i he decidit no fer-la servir com a referència. El problema no és el prototip, sinó el control: la seva hidrodestil·lació convencional només va donar 0,35 μL d'oli en 6 hores. En pell de cítric, on el rendiment habitual és del 0,5-2%, això és entre cent i mil vegades menys del que s'espera d'una destil·lació que funciona. Aquell «2514 vegades», doncs, compara amb un control que va fallar, no amb una destil·lació normal. D'aquest article me'n quedo només amb la conclusió qualitativa —els ultrasons escurcen el temps i milloren el perfil de components— i faig servir Cadena-Cadena com a única referència numèrica. També he trobat un estudi de 2025 que fa servir pètals de rosa, però amb extracció assistida per ultrasons amb dissolvent (etanol), no amb hidrodestil·lació amb aigua com faig jo —una diferència metodològica important que no vull amagar.

Amb tot això, el que no he trobat és, específicament, una comparació d'hidrodestil·lació convencional versus UAHD amb aigua sobre pètals de rosa. Ho dic amb cautela: la meva cerca no ha estat exhaustiva, així que no puc descartar del tot que existeixi algun estudi que no he trobat. Amb aquesta reserva, crec que la comparació que proposo aporta alguna cosa nova.

#### 6.7.4 La limitació més gran d'aquest treball: la potència

L'equip d'ultrasons que tinc disponible és un bany domèstic de 110 W, per sota dels 750 W dels sonicadors de sonda dels estudis de referència. La diferència, però, no és només de xifra: un sonicador de sonda concentra tota la potència en la punta que va dins del líquid, mentre que un bany la reparteix per tot el volum a través de la paret del recipient. Això vol dir que la densitat d'energia que arriba realment als pètals és bastant més baixa del que suggereix la comparació 110 W contra 750 W.

[FIGURA: ultrasonic_bath.jpg|Bany d'ultrasons domèstic com el que s'utilitzarà en aquest treball, molt menys potent que els sonicadors de sonda emprats als estudis de referència.|William Rafti, Wikimedia Commons (llicència d'atribució).]

Per això m'espero que l'efecte que observi sigui més modest que el de la literatura, o que necessiti allargar el temps de sonicació per notar-lo.

## 7. Factors que afecten el rendiment

Temperatura, temps, tipus i part de la planta, mida de la mostra, proporció entre material i aigua, estanqueïtat del sistema, i —en el cas de la UAHD— potència, freqüència i temps d'ultrasons. Tot això fa variar el resultat, i per això cal controlar-ho el màxim possible perquè la comparació entre els dos mètodes sigui justa.

- Massa baixa temperatura → extracció lenta. Massa alta → es poden degradar compostos.
- Poc temps → no s'extreu tot. Massa temps → guany mínim i més despesa energètica.
- Cada espècie i cada part de la planta conté quantitats i tipus d'oli diferents.
- Trossos petits de material → més superfície de contacte → millor extracció.
- Cal mantenir la proporció material/aigua constant entre condicions per poder comparar-les.
- Un sistema ben tancat evita que es perdin compostos amb el vapor que s'escapa.
- Fuites o mala condensació poden reduir el rendiment per motius que no tenen res a veure amb la química.

## 8. Per què comparar mètodes i no espècies

### 8.1 Com ha canviat el disseny d'aquest treball

La primera versió d'aquest treball comparava el rendiment entre diferents espècies (cítrics, rosa, romaní), amb la idea que els cítrics donarien més rendiment. És un disseny vàlid, però vaig veure que respon a una pregunta ja força documentada. Per això he decidit plantejar una pregunta amb menys resposta prèvia: si una millora documentada en un context concret es manté quan canvies alhora el material i el tipus de compost majoritari. Crec que això aporta un component més original, i de pas m'ha permès formular una hipòtesi molt més mesurable que l'anterior.

### 8.2 Per què la rosa

- Hi ha molta literatura de referència sobre destil·lació convencional de rosa, cosa que em permet comparar amb valors ja coneguts.
- La seva composició química és força diferent de la dels cítrics, que és exactament el que vull comprovar.
- La puc aconseguir a través d'una floristeria, cosa que evita haver de recol·lectar plantes silvestres.
- No té toxicitat coneguda en les condicions d'aquest experiment, a diferència d'altres flors que vaig considerar i vaig descartar durant la planificació.

### 8.3 És realment original, això?

No he trobat una comparació específica d'hidrodestil·lació convencional versus UAHD amb aigua sobre pètals de rosa. Ho dic amb la cautela pròpia d'un treball de Batxillerat: la meva recerca no ha estat exhaustiva. Amb aquesta reserva, crec que la comparació aporta alguna cosa que val la pena.

### 8.4 Una mica de context: la química verda

Si la UAHD funcionés també amb material floral i equipament no professional, això reforçaria l'interès pràctic de la tècnica per a productors petits, o per aprofitar subproductes vegetals que normalment es llencen. És exactament la lògica de la química verda: gastar menys energia i aprofitar millor els recursos.

## 9. Perfumeria: de la molècula al producte final

### 9.1 Què és, al final, un perfum

Un perfum és una mescla de compostos aromàtics pensada per crear una olor agradable i que es mantingui en el temps. No és una barreja qualsevol: cada component hi té una funció concreta, tant a nivell d'olor com de volatilitat.

[FIGURA: perfume_bottles.jpg|Ampolles de perfum de diferents formes i èpoques: el disseny del recipient forma part, històricament, de com s'ha comercialitzat i conservat l'oli essencial o l'extracte.|Angela Andriot, Wikimedia Commons, CC BY-SA 3.0.]

No puc parlar de perfumeria sense mencionar Grasse, al sud de França, considerada des del segle XVII la capital mundial del perfum. Allà es van desenvolupar moltes tècniques que encara s'utilitzen avui, i encara ara hi ha "orgues de perfumista" —mobles amb centenars de petits pots d'essències— que els creadors fan servir per compondre noves fragàncies.

### 9.2 La piràmide olfactiva

Els perfums es construeixen segons la volatilitat relativa dels seus components:
- Notes de sortida — molècules petites, molt volàtils; desapareixen en pocs minuts.
- Notes de cor — el cos principal del perfum.
- Notes de fons — molècules grans, poc volàtils, que poden durar hores.

[FIGURA: fig_pyramid.png|La piràmide olfactiva d'un perfum: notes de sortida, de cor i de fons, organitzades segons la volatilitat decreixent dels seus components.|Elaboració pròpia.]

Aquesta estructura és la raó per la qual un perfum "evoluciona" sobre la pell al llarg del dia.

### 9.3 Natural i sintètic, junts

Els perfums moderns barregen compostos naturals i sintètics, que permeten crear olors sense equivalent natural, millorar l'estabilitat i abaratir costos.

### 9.4 Els fixadors

Són substàncies —normalment molècules grans i poc volàtils— que frenen l'evaporació dels compostos més volàtils, i que fan que el perfum duri més sobre la pell.

### 9.5 Regulació i seguretat

La International Fragrance Association posa límits a la concentració de certs compostos aromàtics segons el seu potencial al·lergen. És un recordatori que, més enllà del rendiment d'extracció, qualsevol ús pràctic d'un oli essencial hauria de tenir en compte també la seguretat. En el meu cas: l'oli que obtingui és sobretot una mostra experimental per mesurar-ne el volum, no un producte cosmètic acabat.

### 9.6 I això, per a què em serveix a mi

L'oli que obtingui (convencional o per UAHD) es podria fer servir directament com a nota de cor en un perfum. És, potser, l'aplicació més real de tot el que explico en aquest treball.

## 10. Disseny experimental

> Aquesta secció és, de moment, només planificació: encara no he fet l'experiment. Els camps que falten s'ompliran amb dades reals quan el faci.

### EXPERIMENT ID: EXP-01

**Nom:** Comparació del rendiment i del temps d'extracció d'oli essencial de rosa per hidrodestil·lació convencional vs. UAHD.

**Pregunta i hipòtesi:** ja les he formulat al principi: comparo el rendiment (%) i el temps fins que s'estabilitza, entre hidrodestil·lació convencional i UAHD, amb la hipòtesi que la UAHD dona més rendiment en menys temps.

### 10.1 Variables

| Tipus | Descripció |
|---|---|
| Independent | Mètode d'extracció (convencional / UAHD) |
| Dependent (principal) | Rendiment (%) = m(oli) / m(pètals frescos) x 100 |
| Dependent (secundària) | Temps (min) fins a l'estabilització |
| Controlada | Espècie i part de la planta, massa inicial, volum d'aigua, mida dels pètals, temperatura de destil·lació, **temperatura i durada del pretractament en aigua (igual a les dues condicions)**, procedència i edat del material |
| Específica UAHD | Potència del bany (110 W, fixa), freqüència de l'equip, temps de sonicació (30 min) |
| Control positiu | Un assaig de cada condició amb pell de cítric, per comprovar que el muntatge detecta l'efecte |

[FIGURA: fig_experiment_design.png|Esquema general del disseny experimental: les dues condicions parteixen de la mateixa massa de pètals i acaben comparant-se pel rendiment i el temps.|Elaboració pròpia.]

### 10.2 Materials
- Aparell de Clevenger complet.
- Font de calor amb control de temperatura.
- Bany d'ultrasons domèstic de 110 W.
- Balança de precisió (encara no sé exactament la resolució).
- Termòmetre, tant per a la destil·lació com per controlar la temperatura del bany.
- Pètals frescos de rosa, d'un proveïdor floral.
- Pell de cítric per al control positiu.
- Guants i ulleres de protecció.

### 10.2.1 Quanta rosa necessito, i per què això és el punt crític

Abans de res he hagut de fer un càlcul que canvia tota la logística de l'experiment. El rendiment d'oli essencial de rosa és molt baix: de l'ordre del 0,02-0,05% del pes de pètals frescos, molt lluny del 0,5-2% de la pell de cítric dels articles de referència. Traduït a quantitats reals:

| Pètals per assaig | Oli esperat | Volum a la trampa |
|---|---|---|
| 200 g | 40-100 mg | 0,04-0,1 mL |
| 500 g | 100-250 mg | 0,1-0,25 mL |
| 1 kg | 200-500 mg | 0,2-0,5 mL |

La trampa graduada d'un Clevenger per a olis lleugers es llegeix en divisions de 0,01 mL. Amb 200 g de pètals estaria llegint entre 4 i 10 divisions: una gota que quedi enganxada al vidre o un error de lectura ja es menjaria bona part de la diferència entre els dos mètodes, i el resultat no voldria dir res. Amb 500 g o 1 kg per assaig llegeixo entre 10 i 50 divisions, i llavors sí que una diferència del tipus de la que descriu Cadena-Cadena (aproximadament el doble) seria visible per damunt de l'error de mesura.

Per tant fixo el mínim en **500 g de pètals frescos per assaig**. Com que són 3 repeticions per cada una de les dues condicions, necessito entre 3 i 6 kg de pètals en total. Comprar-los com a flor de tall seria inviable per preu; els demanaré a la floristeria com a residu —pètals de flors que ja no es poden vendre—, cosa que a més encaixa amb la idea de valorització de residus que apareix a la literatura sobre extracció d'oli de rosa.

Aquesta és, honestament, la limitació més gran del disseny després de la potència de l'equip: si al final no aconsegueixo prou quantitat de pètals, el que puc mesurar deixa de ser el rendiment i passa a ser només el temps fins a les primeres gotes.

**Sobre la varietat.** Encara no tinc confirmat quin tipus de rosa podré fer servir. La referència de la literatura és *Rosa damascena*, que és la rosa d'oli per excel·lència, però el més probable és que una floristeria em pugui donar roses de tall comercials (híbrids de te, *Rosa × hybrida*), que donen menys oli i amb una composició diferent. Si acaba sent així ho diré explícitament al treball i no ho presentaré com si fos *Rosa damascena*: el mètode de comparació segueix sent vàlid igualment, perquè comparo dos mètodes sobre el mateix material, però el rendiment absolut no serà comparable amb el de la bibliografia.

### 10.3 Com ho pensava fer

**Condició A (control):**
1. Peso una massa fixa de pètals i els poso en el volum d'aigua de treball.
2. **Els deixo en repòs 30 minuts a la mateixa temperatura que assoleix el bany d'ultrasons** (mesurada amb termòmetre), sense encendre els ultrasons.
3. Passo la mescla al matràs del Clevenger, escalfo fins a ebullició i mantinc la temperatura constant.
4. Vaig llegint el volum d'oli a la trampa cada 15 minuts, fins que deixa d'augmentar en dues lectures seguides.
5. Anoto el temps total i el volum final.

**Condició B (UAHD):**
1. Peso la mateixa massa fixa de pètals.
2. **Els sonico 30 minuts** en el mateix volum d'aigua, amb el bany de 110 W.
3. Passo la mescla al mateix aparell de Clevenger i continuo igual que a la condició A.

**Per què el pas 2 de la condició A.** Un bany d'ultrasons no només vibra: també escalfa l'aigua, i en mitja hora pot pujar fins als 40–50 °C. Si la condició A comencés amb els pètals en aigua freda, no estaria comparant «amb ultrasons» contra «sense ultrasons», sinó «ultrasons més escalfament previ» contra «res». Per això el control fa la mateixa espera a la mateixa temperatura, i la temperatura del bany s'anota a cada assaig com una variable controlada més.

**Per què 30 minuts.** Cadena-Cadena et al. van sonicar 20 minuts amb una sonda de 750 W. El meu bany és de 110 W i, a més, reparteix l'energia per tot el volum en comptes de concentrar-la, de manera que l'energia que arriba al material és clarament menor. Alargar la sonicació fins a 30 minuts és la manera més senzilla de compensar-ho en part sense escalfar l'aigua més del compte. És una elecció argumentada, no òptima: amb més temps i material, el següent pas natural seria provar diversos temps de sonicació i veure a partir de quin deixa de millorar.

**Ordre dels assaigs.** Faré les repeticions alternades (A, B, A, B, A, B) i no totes les d'una condició seguides. Si les fes seguides, l'efecte del mètode quedaria barrejat amb l'envelliment dels pètals: el material del tercer dia no és el mateix que el del primer.

**Material i conservació.** Els 3–6 kg de pètals no arribaran el mateix dia. Cada assaig fa servir pètals de la mateixa procedència i amb el mateix tractament previ: processats el mateix dia que arriben o, si no pot ser, conservats en fred exactament el mateix temps per a totes dues condicions. Anoto la data de recepció i la de l'assaig per a cada repetició.

Repetiré cada condició com a mínim 3 vegades, amb mostres independents, per poder calcular mitjana i desviació estàndard.

### 10.3.1 Control positiu amb pell de cítric

Hi ha un risc real que tot l'experiment acabi en un empat dins del marge d'error: la rosa dona molt poc oli, el meu equip és modest, i pot passar que les dues condicions donin xifres tan petites que no es puguin distingir. En aquest cas, ¿com sabria si és que els ultrasons no fan res, o que la meva instal·lació no és capaç de detectar-ho?

Per resoldre-ho faré un assaig addicional, un de cada condició, amb pell de cítric en lloc de pètals de rosa. La pell de cítric rendeix entre el 0,5 i el 2%, entre vint i cinquanta vegades més que la rosa, i és exactament el material dels dos estudis de referència. Serveix com a control positiu:

- Si amb cítric sí que es veu diferència entre A i B, vol dir que el muntatge i el bany funcionen. Aleshores, si amb rosa no se'n veu, la conclusió no és «l'experiment ha fallat», sinó que l'efecte, si existeix, queda per sota del que puc mesurar amb aquest rendiment i aquesta potència. Això és un resultat, i es pot defensar.
- Si amb cítric tampoc es veu cap diferència, el problema apunta al bany —potència repartida, no concentrada— i no al material. També és una conclusió honesta i explicable.

La rosa continua sent el material principal del treball; el cítric només serveix per comprovar que l'instrument mesura el que ha de mesurar.

### 10.4 Com pensava analitzar les dades

**Del volum a la massa.** A la trampa del Clevenger llegeixo un volum, però el rendiment el defineixo en massa. Per passar d'una cosa a l'altra faig servir la densitat de l'oli de rosa, que està al voltant de 0,86 g/mL:

**m(oli) = V(oli) × 0,86 g/mL**, i d'aquí **rendiment (%) = m(oli) / m(pètals) × 100**

Si la balança em permet pesar l'oli recollit directament amb prou precisió, ho faré així i deixaré la conversió només com a comprovació, perquè pesar és més fiable que assumir una densitat.

Per a cada condició calcularé la mitjana i la desviació estàndard del rendiment:

**s = √[ Σ(xᵢ − x̄)² / (n − 1) ]**

Amb un mínim de 3 repeticions podré representar el rendiment mitjà amb barres d'error, per veure si la diferència entre mètodes és gran comparada amb la variabilitat interna de cada grup. No n'hi ha prou de mirar si la mitjana d'un grup és més alta: si la variabilitat dins de cada grup és gran, una diferència que sembla important podria no voler dir gaire. Si tinc prou repeticions, m'agradaria complementar-ho amb una prova t de Student per veure si la diferència és estadísticament significativa.

**Plantilla de dades:**

| Condició | Repetició | Massa pètals (g) | Volum d'oli (mL) | Temps (min) | Rendiment (%) |
|---|---|---|---|---|---|
| Convencional | 1 | | | | |
| Convencional | 2 | | | | |
| Convencional | 3 | | | | |
| UAHD | 1 | | | | |
| UAHD | 2 | | | | |
| UAHD | 3 | | | | |

Tres repeticions és el mínim que em permet calcular una desviació estàndard amb sentit. Si tinc temps i material, m'agradaria fer-ne 5 o 6 per tenir una estimació més sòlida.

### 10.5 Seguretat
- Vapor i superfícies calentes → cremades. Guants i ulleres sempre.
- Vidre del Clevenger → fràgil, evitar cops tèrmics.
- Bany d'ultrasons → no ficar-hi les mans en funcionament.
- Espai ben ventilat.

### 10.6 Errors que ja preveig

Sistemàtics: la potència d'ultrasons és molt inferior a la dels estudis de referència, així que potser l'efecte que vegi sigui més petit del que diu la literatura; balança i termòmetre casolans, possiblement menys precisos que l'equip professional; sense GC-MS, només puc comparar rendiment global, no la composició exacta.

Aleatoris: variabilitat natural del material (procedència, frescor); petites variacions de temperatura ambiental al meu "laboratori" casolà.

### 10.7 Calendari

Les dates són les del calendari oficial del centre (document «TEMPORITZACIÓ TdR 25-27»):

| Fita | Data |
|---|---|
| Confirmació de la varietat de rosa i arribada del material | Pendent |
| **2a ENTREGA** — teoria acabada i 75% de la part pràctica | **25 de setembre de 2026** |
| Avaluació de la 2a entrega | 1 d'octubre de 2026 |
| Realització i tancament dels assaigs | Setembre–octubre de 2026 |
| **ENTREGA FINAL** | **23 d'octubre de 2026** |
| **EXPOSICIÓ ORAL** | **3 de novembre de 2026** |
| Avaluació final | 5 de novembre de 2026 |

La ponderació de la nota, segons el mateix document: seguiment 25% (1a entrega 10%, 2a entrega 15%), document 45% (teoria 15%, pràctica 30%) i exposició oral 30%.

## 11. Conclusions previstes

Com que encara no he fet l'experiment, aquest capítol no és un resum de resultats, sinó una reflexió sobre què esperaria trobar.

Si la hipòtesi es confirma, voldrà dir que la cavitació és prou general com per funcionar tant amb monoterpens no oxigenats com amb alcohols terpènics oxigenats, fins i tot amb un equip molt més fluix que el professional. Si no es confirma —o només en part—, no crec que això invalidi el mecanisme; més aviat apuntaria cap a la limitació de potència del meu equip. De fet, això també seria interessant: diria alguna cosa sobre els límits pràctics d'aplicar un protocol de laboratori amb equipament casolà.

Com a línies de futur, m'agradaria repetir l'experiment amb un equip més potent, fer una anàlisi per GC-MS per comparar la composició exacta, i provar-ho amb altres espècies florals.

Rellegint tot el que he escrit, m'adono que aquest treball m'ha canviat una mica la manera de mirar coses tan quotidianes com l'olor d'una flor o d'una taronja pelada. Abans de començar, això m'hauria semblat una qüestió purament estètica; ara hi veig una cadena sencera de fenòmens físics i químics que expliquen per què passa. Sigui quin sigui el resultat final de l'experiment, crec que això ja és, per a mi, un resultat en si mateix.

## 12. Bibliografia

**Fonts citades directament al text:**

- Buck, L.M.; Axel, R. (1991). *A novel multigene family may encode odorant receptors: a molecular basis for odor recognition*. Cell, 65(1), 175–187. DOI: 10.1016/0092-8674(91)90418-x
- Cadena-Cadena, F. et al. (2025). *Effect of Ultrasonic Pretreatment on the Extraction Process of Essential Oils from Grapefruit (Citrus paradisi) By-Products*. BioTech (Basel), 14(3), 59. DOI: 10.3390/biotech14030059

**Altres fonts consultades (no citades literalment al text, però utilitzades per informar-me):**

- Malnic, B.; Godfrey, P.A.; Buck, L.B. (2004). *The human olfactory receptor gene family*. PNAS, 101(8), 2584–2589.
- Dudareva, N. et al. (2005). *The nonmevalonate pathway supports both monoterpene and sesquiterpene formation in snapdragon flowers*. PNAS, 102(3), 933–938.
- Thilakarathna, R.C.N. et al. (2022). *A review on application of ultrasound and ultrasound assisted technology for seed oil extraction*. Journal of Food Science and Technology, 60(4), 1222–1236.
- Anastas, P.T.; Warner, J.C. (1998). *Green Chemistry: Theory and Practice*. Oxford University Press.
- PubChem, National Library of Medicine (NIH): Limonene (CID 22311/439250), Geraniol (CID 637566), Citronellol (CID 8842).
- Abdel Samad, R.; El Darra, N.; Al Khatib, A.; Abou Chacra, H.; Jammoul, A.; Raafat, K. (2023). *Novel dual-function GC/MS aided ultrasound-assisted hydrodistillation for the valorization of Citrus sinensis by-products*. Scientific Reports, 13, 12547. DOI: 10.1038/s41598-023-38130-9. (He llegit l'article original: la xifra de «2514 vegades» hi és, però surt d'un control que va donar 0,35 μL en 6 h, molt per sota del que s'espera d'una hidrodestil·lació normal. Per això només en faig servir la conclusió qualitativa —vegeu 6.7.3.)
- Singh, S.; Wikaputri, A.; Bhoi, R. et al. (2025). *A Sustainable Green Approach for Enhanced Rose-Oil Extraction from Waste Rose Petals through Ultrasound-Assisted Technique*. Waste and Biomass Valorization, 16, 4567–4581. DOI: 10.1007/s12649-025-02885-1.
- International Fragrance Association — https://ifrafragrance.org
- Royal Society of Chemistry — https://www.rsc.org

**Imatges i vídeos:**

- Avicenna - Canon of Medicine (coberta de manuscrit). Autor: Toxicotravail. Domini públic. Wikimedia Commons.
- Distillation by Alembic.PNG. Autor: H Padleckas. CC BY-SA 3.0 / GFDL. Wikimedia Commons.
- Rosa damascena5.jpg. Autor: Kurt Stüber. CC BY-SA 3.0. Wikimedia Commons.
- Hydrodistillation using the Clevenger-type apparatus. Autors: N. Sadgrove i G. Jones (2015), Agriculture, 5(1), 48-102. CC BY 4.0. Wikimedia Commons.
- Ultrasonic cleaner copy.jpg. Autor: William Rafti. Llicència d'atribució. Wikimedia Commons.
- Orange cross section.jpg. Autor: Elkagye. CC BY-SA 3.0. Wikimedia Commons.
- Perfume Bottles.JPG. Autora: Angela Andriot. CC BY-SA 3.0. Wikimedia Commons.
- Estructures moleculars del limonè, geraniol i citronel·lol: PubChem, National Library of Medicine (NIH).
- Vídeo "Essential oil extraction | Clevenger Apparatus | Hydro distillation | Ginger oil content | Experiment". Autor: AGRI LEARN with Anuj. YouTube. https://www.youtube.com/watch?v=s_KuvXXvgX4
- Vídeo "Cavitation - Easily explained!". Autor: IET Institute for Energy Technology. YouTube. https://www.youtube.com/watch?v=U-uUYCFDTrc
- Esquemes propis (línia del temps, procés olfactiu, cavitació, biosíntesi MVA/MEP, piràmide olfactiva, disseny experimental): elaboració pròpia.

## Annex I: Glossari

- Albedo — capa blanca i esponjosa de la pell dels cítrics, sota el flavedo.
- Anòsmia — incapacitat de detectar olors.
- Cavitació acústica — formació, creixement i col·lapse de microbombolles en un líquid amb ultrasons.
- COV — compost orgànic volàtil.
- Desviació estàndard — mesura de com de dispersos estan els valors respecte a la mitjana.
- Enantiòmer — cadascuna de les dues formes especulars d'una molècula.
- Epiteli olfactiu — teixit a la part alta del nas amb les neurones de l'olfacte.
- Flavedo — capa exterior i acolorida de la pell dels cítrics.
- GC-MS — cromatografia de gasos amb espectrometria de masses.
- Hidrolat — fase aquosa subproducte de la hidrodestil·lació.
- Monoterpè — terpè de dues unitats d'isoprè.
- Rendiment (d'extracció) — % en massa d'oli obtingut respecte al material vegetal de partida.
- UAHD — hidrodestil·lació assistida per ultrasons.

## Annex II: Plantilla de recollida de dades

| Data | Condició | Repetició | Massa pètals (g) | Volum d'aigua (mL) | Temp. sonicació (min) | Temp. destil·lació (°C) | Vol. oli t=15min | t=30min | t=45min | t=60min | Vol. final (mL) | Temps total (min) | Rendiment (%) | Observacions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | |

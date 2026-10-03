/** Stabile Unsplash-URL (Parameter unterscheiden React-Keys bei gleichem Motiv). */
import { INSPIRATION_COPY_EN } from "@/lib/inspirationDestinations.en";
import { INSPIRATION_COPY_ES } from "@/lib/inspirationDestinations.es";
import type { InspirationCopy } from "@/lib/inspirationCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";

export type { InspirationCopy };

export function inspirationPhoto(photoId: string, w: number): string {
 return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&q=82`;
}

export type InspirationDestination = {
 slug: string;
 name: string;
 img: string;
 /** Kurzer Teaser / Stimmung */
 story: string[];
 /** Weitere Bilder (URLs geprüft bzw. erneuert gegen 404) */
 gallery: string[];
 /** Genau 10 konkrete Must-sees */
 mustSee: string[];
 /** Faktenreich: Epochen, politische Zusammenhänge, datierbare Ereignisse */
 history: string[];
};

export const INSPIRATION_DESTINATIONS: InspirationDestination[] = [
 {
 slug: "santorini",
 name: "Santorini",
 img: inspirationPhoto("1570077188670-e3a8d69ac5ff", 400),
 story: [
 "Weiße Häuser, blaue Kuppeln und der Blick auf die Caldera – Santorini wirkt wie ein Postkartenmotiv, das zum Leben erwacht ist.",
 "Abende in Oia, wenn die Sonne ins Meer sinkt, bleiben lange in Erinnerung. Tagsüber locken Weinbau, kleine Buchten und die Geschichte der Vulkaninsel.",
 ],
 gallery: [
 inspirationPhoto("1570077188670-e3a8d69ac5ff", 1600),
 inspirationPhoto("1578662996442-48f60103fc96", 1200),
 inspirationPhoto("1533441865127-f4806aaa12cc", 1200),
 ],
 mustSee: [
 "Akrotiri: minoische Stadt, verschüttet nach dem Bronzezeit-Ausbruch (Ausgrabung, feste Öffnungszeiten).",
 "Caldera-Blick von Fira oder Imerovigli, besonders bei abnehmendem Tageslicht.",
 "Oia am Abend: Sonnenuntergang von der Burgruine Agios Nikolaos aus einplanen.",
 "Archäologisches Museum Fira: Fresken und Funde aus Akrotiri im Überblick.",
 "Museum der Vorgeschichtlichen Thera: Kontext zu Geologie und Siedlungsgeschichte.",
 "Weinverkostung in Pyrgos oder Megalochori (Sorten Assyrtiko, Aidani).",
 "Vulkaninsel Nea Kameni: organisierte Bootsfahrt mit kurzer Wanderung auf den Krater.",
 "Strand Amoudi Bay unterhalb Oias: steiler Abstieg, Fischtavernen am Wasser.",
 "Prophet-Elias-Kloster (höchster Punkt): Rundblick über die Kykladen.",
 "Ancient Thera auf dem Mesa Vouno: klassische-römische Ruinen über dem Meer.",
 ],
 history: [
 "In der Spätbronzezeit bestand auf Thera eine minoisch geprägte Stadt (Akrotiri); der gewaltige Vulkanausbruch in der 2. Hälfte des 2. Jahrtausends v. Chr. verschüttete die Siedlung unter Bims und Asche und prägte das heutige Caldera-Relief.",
 "Antik hieß die Insel Thera; im Mittelalter siedelten Venezianer und prägten u. a. die kastellartige Anlage von Pyrgos. Von 1566 bis 1821 gehörte die Kykladeninsel zum Osmanischen Reich.",
 "1830 wurde Thera Teil des unabhängigen griechischen Staats; der heutige Tourismus setzte im 20. Jahrhundert stark ein, zuletzt mit Diskussionen zu Tragfähigkeit, Wasser und Denkmalschutz.",
 ],
 },
 {
 slug: "nordlichter",
 name: "Nordlichter",
 img: inspirationPhoto("1531366936337-7c912a4589a7", 400),
 story: [
 "Grün-violette Bänder am Nachthimmel: Polarlichter sind ein Naturerlebnis, das viele Reisende einmal erleben wollen.",
 "Gute Chancen gibt es unter dem Polarkreis in der dunklen Jahreszeit – mit etwas Geduld, warmer Kleidung und einer flexiblen Route.",
 ],
 gallery: [
 inspirationPhoto("1483347756197-71ef80e95f73", 1600),
 inspirationPhoto("1531366936337-7c912a4589a7", 1200),
 inspirationPhoto("1501785888041-af3ef285b470", 1200),
 ],
 mustSee: [
 "Tromsø (Norwegen): Polarlicht-Saison September–März, viele geführte Touren ins Hinterland.",
 "Abisko (Schweden): statistisch oft klare Nächte durch Föhn vom Gebirge.",
 "Rovaniemi-Region (Finnland): Kombination aus Rentierfarmen und Nordlicht-Jagd.",
 "Lofoten: Motive mit Fjorden und Fischerdörfern vor Aurora (wetterabhängig).",
 "Senja: weniger frequentiert als Tromsø, steile Küste.",
 "Kiruna & Icehotel-Gegend: lange Polarnächte, gute Infrastruktur.",
 "Island (Þingvellir, Südküste): Polarlicht neben Geysiren und Gletschern (kein Garant).",
 "Fairbanks (Alaska): kontinental-kaltes Klima, klare Winternächte.",
 "Yellowknife (Kanada): etablierte Nordlicht-Tourismus-Infrastruktur.",
 "Online-Vorhersage nutzen (z. B. NOAA OVATION, lokale Apps) statt nur Wetter-App.",
 ],
 history: [
 "Nordische Quellen (Snorri Sturluson, 13. Jh.) deuten Aurora mit mythologischen Figuren; mittelalterliche europäische Chronisten interpretierten rote Polarlichter oft als unheilsame Zeichen.",
 "Ab dem 17. Jahrhundert ordneten Naturforscher Erscheinungen dem Erdmagnetfeld zu; Kristian Birkeland (um 1900) modellierte geladene Teilchen aus der Sonne, die an Feldlinien in die Polaratmosphäre eintreten und Gas anregen (Grün bei Sauerstoff typisch).",
 "Moderne Weltraumwetter-Satelliten messen Sonnenwind und CMEs; Reiseangebote konzentrieren sich auf geomagnetische Breiten 65–75° N in der Äquinoktial-Wintersaison.",
 ],
 },
 {
 slug: "venedig",
 name: "Venedig",
 img: inspirationPhoto("1523906834658-6e24ef2386f9", 400),
 story: [
 "Gondeln, enge Gassen und Platz-Serenaden: Venedig ist ein Labyrinth aus Wasser und Stein.",
 "Neben Rialto und Markusplatz lohnt sich das Driftieren durchs Cannaregio – weniger Trubel, mehr Alltag.",
 ],
 gallery: [
 inspirationPhoto("1514890547357-a9ee288728e0", 1600),
 inspirationPhoto("1523906834658-6e24ef2386f9", 1200),
 inspirationPhoto("1660801576025-c87d2e5ff9c4", 1200),
 ],
 mustSee: [
 "Markusdom und Campanile (Tickets/Queues einplanen).",
 "Dogenpalast über die Seufzerbrücke zum Gefängnis.",
 "Rialtobrücke und Mercato di Rialto am Morgen.",
 "Accademia-Brücke: klassischer Blick auf den Canal Grande.",
 "Basilika Santa Maria della Salute (Pestvotivkirche, 1631–1687).",
 "Ghetto Nuovo: erste dokumentierte jüdische Einheitswohnsiedlung Europas (1516).",
 "Scuola Grande di San Rocco: Tintoretto-Zyklen.",
 "Biennale-Gärten (Giardini) und Arsenale bei Kunst-Biennale-Jahren.",
 "Vaporetto-Linie 1: gesamter Canal Grande als Fahrt.",
 "Insel Murano (Glas) und Burano (Spitzen, Farben) per Wasserbus.",
 ],
 history: [
 "Hundsinseln in der Lagune wurden seit der Spätantike besiedelt; nach langobardischen und byzantinischen Einflüssen wählte die Gemeinde 697 (traditionelles Datum) den ersten Doge und entwickelte sich zur Seerepublik.",
 "Im Hochmittelalter und in der Frühen Neuzeit kontrollierte Venedig Handelsrouten ins östliche Mittelmeer; der vierte Kreuzzug 1204 endete mit der Eroberung Konstantinopels unter venetianisch-französischer Führung.",
 "1797 kapitulierte die Republik vor Napoleon (Vertrag von Campo Formio); danach österreichische Herrschaft, ab 1866 Anschluss an das Königreich Italien. Der MOSE-Hochwasserschutz an den Laguneneinläufen ging 2020 in Betrieb.",
 ],
 },
 {
 slug: "malediven",
 name: "Malediven",
 img: inspirationPhoto("1514282401047-d79a71a590e8", 400),
 story: [
 "Türkisfarbenes Wasser, feiner Sand und Atolle – die Malediven stehen für Ruhe und Unterwasserwelten.",
 "Schnorcheln und Tauchen direkt vom Bungalow aus machen viele Aufenthalte unvergesslich.",
 ],
 gallery: [
 inspirationPhoto("1514282401047-d79a71a590e8", 1600),
 inspirationPhoto("1590523277543-a94d2e4eb00b", 1200),
 inspirationPhoto("1547528114-f4daa226e256", 1200),
 ],
 mustSee: [
 "Haus-Riff Schnorcheln (Haie/Rochen nur mit Guide und Regeln).",
 "Biolumineszenz-Strände (Vaadhoo u. a., monds-/planktonabhängig).",
 "Maledivisches Kulturzentrum Malé: Einblick in Bootsbau und Alltag.",
 "Hukuru Miskiiy (Freitagsmoschee, 1656) in Malé mit Korallenstein-Schnitzwerk.",
 "Tauchspots: Banana Reef, Manta Point (Saison prüfen).",
 "Insel-Hopping per Speedboat oder Inlandsflug + Wasserflugzeug.",
 "Sandbänke bei Ebbe fotografisch, Strömung beachten.",
 "Thoddoo: Agrarinsel mit Melonenanbau (Gast-Insel-Touren).",
 "Addu-Atoll: historische britische Radaranlage, Fahrradtouren.",
 "Nachhaltigkeit prüfen (Solar, Desalination, Abfallmanagement der Unterkunft).",
 ],
 history: [
 "Buddhistische Epoche ab ca. 5. Jh. n. Chr. ist archäologisch belegt; der Übergang zum Islam wird auf 1153 datiert (Überlieferung zum ersten muslimischen Sultan).",
 "1558 kurze portugiesische Präsenz, danach niederländisch-indirekter Einfluss; 1887 britisches Protektorat über den Sultan. Unabhängigkeit am 26. Juli 1965, Republik 1968.",
 "2004 verwüstete der Tsunami zahlreiche niedrige Inseln; seither viele Aufschüttungen und Tourismus-Inseln mit strenger Zonierung.",
 ],
 },
 {
 slug: "paris",
 name: "Paris",
 img: inspirationPhoto("1553455427-c38fa28dc586", 400),
 story: [
 "Stadt der Lichter, Museen und Cafés: Paris verbindet Ikonen wie Eiffelturm und Louvre mit quartiernahem Charme.",
 "Ein Spaziergang entlang der Seine oder durch Le Marais bringt oft die besten zufälligen Momente.",
 ],
 gallery: [
 inspirationPhoto("1553455427-c38fa28dc586", 1600),
 inspirationPhoto("1499856871958-5b9627545d1a", 1200),
 inspirationPhoto("1502602898657-3e91760cbb34", 1200),
 ],
 mustSee: [
 "Louvre (Zeitslot buchen) und Tuileriengarten.",
 "Musée d'Orsay in der ehemaligen Bahnhofshalle (Impressionismus).",
 "Notre-Dame (Aussenbereich und Westfassade nach dem Brand 2019 wieder zugänglich, Innenraum je nach Phase).",
 "Sainte-Chapelle: gotische Glasfenster auf der Île de la Cité.",
 "Versailles per RER C (Schloss + Gärten, mindestens halber Tag).",
 "Montmartre: Sacré-Cœur und Platz du Tertre.",
 "Marais: Place des Vosges und jüdisches Viertel um die Rue des Rosiers.",
 "Promenade Plantée / Coulée Verte als linearer Park auf Viadukt.",
 "Katakomben (eng, Tickets im Voraus).",
 "Seine-Ufer UNESCO-Welterbe zwischen Pont de Sully und Pont d'Iéna erlaufen.",
 ],
 history: [
 "Keltenische Parisii siedelten an der Seine-Insel; römisches Lutetia ab 1. Jh. n. Chr. mit Forum und Thermen. Karl der Grosse ließ 798 den ersten Reichstag in der Palastkapelle tagen.",
 "Kapetingische Könige machten Paris zur Residenz; 1789 stürmte das Volk die Bastille. Baron Haussmann baute Mitte des 19. Jh. Boulevards und Kanalisation unter Napoleon III.",
 "Belagerungen 1870/1871 und Pariser Kommune prägten die Dritten Republik; Stadt und Vororte wuchsen administrativ (Grand Paris seit 2016).",
 ],
 },
 {
 slug: "barcelona",
 name: "Barcelona",
 img: inspirationPhoto("1722863380905-539ae092fc5f", 400),
 story: [
 "Gaudí, Strand und katalanische Küche: Barcelona mischt Großstadt mit Mittelmeerflair.",
 "Vom Park Güell bis zum Barri Gòtic ist die Stadt gut mit öffentlichen Verkehrsmitteln und zu Fuss zu erkunden.",
 ],
 gallery: [
 inspirationPhoto("1722863380905-539ae092fc5f", 1600),
 inspirationPhoto("1583422409516-2895a77efded", 1200),
 inspirationPhoto("1562861844-763c4ae2e696", 1200),
 ],
 mustSee: [
 "Sagrada Família (Online-Ticket Pflicht).",
 "Park Güell (besuchte Zone ticketpflichtig).",
 "Casa Batlló und Casa Milà (La Pedrera) am Passeig de Gràcia.",
 "Barri Gòtic: Kathedrale, Plaça del Rei mit mittelalterlichen Palästen.",
 "Museu Picasso im El Born.",
 "Palau de la Música Catalana (Modernisme, Führungen).",
 "Montjuïc: Fundació Joan Miró, Olympiastadion, Magic Fountain Show (Zeiten).",
 "Strand Barceloneta und Hafenpromenade.",
 "Camp Nou / Spotify Camp Nou (Stadionführung je nach Umbau).",
 "Mercat de la Boquería oder Santa Caterina für Marktfrühstück.",
 ],
 history: [
 "Römische Colonia Iulia Augusta Faventia Paterna Barcino entstand unter Augustus; mittelalterlich war Barcelona Hauptstadt der Grafschaft Barcelona in der Krone Aragoniens.",
 "Nach der Union Aragon-Kastilien blieb Katalonien wirtschaftlich stark; im Spanischen Erbfolgekrieg 1714 fiel die Stadt nach Belagerung an bourbonische Truppen (Nationalfeiertag Diada).",
 "Industrielle Expansion im 19. Jh. finanzierte den Modernisme (Gaudí u. a.); die Olympischen Spiele 1992 trieben Küsten- und Infrastrukturprojekte voran.",
 ],
 },
 {
 slug: "amalfi",
 name: "Amalfi",
 img: inspirationPhoto("1581416271259-abec87515f51", 400),
 story: [
 "Steile Küste, Zitronenhaine und bunte Orte: die Amalfiküste ist Italiens Klassiker für Roadtrip-Feeling mit Meerblick.",
 "Zwischen Positano und Vietri sul Mare wartet jede Kurve auf ein neues Panorama – ideal, um Route und Stopps im Voraus grob zu skizzieren.",
 ],
 gallery: [
 inspirationPhoto("1581416271259-abec87515f51", 1600),
 inspirationPhoto("1614591184338-bd97fac10e22", 1200),
 inspirationPhoto("1504360222828-18cad26d38ba", 1200),
 ],
 mustSee: [
 "Positano: Chiesa di Santa Maria Assunta mit Kuppel aus Majoliken.",
 "Pfad der Götter (Sentiero degli Dei): Wanderung Bomerano–Nocelle (Buslogistik).",
 "Amalfi: Dom Sant'Andrea mit Cloister of Paradise.",
 "Ravello: Villa Rufolo und Villa Cimbrone (Terrassengärten).",
 "Maiori / Minori: römische Villa-Maritime-Spuren, weniger überlaufen.",
 "Vietri sul Mare: Keramikwerkstätten.",
 "Boot von Salerno nach Amalfi/Positano (Sommerfahrplan).",
 "Fiordo di Furore: enge Schlucht mit Brücke an der SS163 (Foto-Stopp, Verkehr beachten).",
 "Strada Statale 163: Busfahrer-Pros, Autofahrer-Stress – Zeitpuffer.",
 "Limoncello-Produktion in Minori oder Tramonti besichtigen (Reservierung).",
 ],
 history: [
 "Im Frühmittelalter entwickelte sich Amalfi zu einer maritimen Handelsrepublik (de facto 9.–11. Jh.) mit Handelsniederlassungen im östlichen Mittelmeer; die Amalfitan Tables (mittelalterliche Seerechtsfragmente, überliefert u. a. in Pisa und Ravenna) werden mit Amalfi in Verbindung gebracht.",
 "Normannische Eroberung Süditaliens (11. Jh.) und später die Seeschlacht von Melori (1284) schwächten die Flotte; Pestwellen im 14. Jahrhundert reduzierten die Bevölkerung.",
 "1997 nahm UNESCO die Amalfiküste als Kulturlandschaft in die Welterbeliste auf (terassierte Obstgärten, Siedlungsstruktur an Steilhängen).",
 ],
 },
 {
 slug: "hallstatt",
 name: "Hallstatt",
 img: inspirationPhoto("1605853010259-412015b0ab6a", 400),
 story: [
 "Spiegelungen im See, Salzwelten und alpine Kulisse: Hallstatt zieht mit seiner Postkartenidylle.",
 "Früh oder spät kommen lohnt sich, wenn man die Ruhe geniessen will – der Ort ist klein, die Aussicht gross.",
 ],
 gallery: [
 inspirationPhoto("1605853010259-412015b0ab6a", 1600),
 inspirationPhoto("1485081669829-bacb8c7bb1f3", 1200),
 inspirationPhoto("1565841449778-e06ca37068c8", 1200),
 ],
 mustSee: [
 "Welterbeblick (Postcard viewpoint) früh morgens oder abends.",
 "Salzwelten Hallstatt: Schachtfahrt mit Grubenbahn (Tickets).",
 "Pfahlbauten-Museum am See (UNESCO-Thema Pfahlbauten Alpen).",
 "Beinhaus St. Michael mit knöchernem Stapel (Öffnungszeiten).",
 "Marktplatz mit Holzfassaden und evangelischer Christuskirche.",
 "Seepromenade Richtung Lahn (weniger Trubel als Ortskern).",
 "Dachstein-Krippenstein: Five Fingers Aussichtsplattform (Bus/Bahn).",
 "Gosausee als Tagesausflug (Auto oder Bus).",
 "Bad Aussee oder Altaussee für Salzkammergut-Kulisse nebenan.",
 "Schiffsrundfahrt Hallstätter See (Saison).",
 ],
 history: [
 "Salzabbau am Hallstätter Salzberg ist für die ältere Urnenfelderkultur archäologisch belegt; der Begriff „Hallstattzeit“ (ca. 800–450 v. Chr.) leitet sich von diesem Fundort ab.",
 "Kelten und später Römer nutzten die Lagerstätte; im Mittelalter gehörte der Abbau den Habsburgern. 1595 brannte fast der gesamte Ort ab und wurde am heutigen Ufer wiederaufgebaut.",
 "1997 nahm UNESCO das Hallstatt-Dachstein-Salzkammergut als Kulturlandschaft auf; seit den 2010er Jahren diskutiert die Gemeinde Über­tourismus und Buslimits.",
 ],
 },
 {
 slug: "dubrovnik",
 name: "Dubrovnik",
 img: inspirationPhoto("1568301235858-f41588681345", 400),
 story: [
 "Mauern, Adria und Kopfsteinpflaster: Dubrovnik verbindet Geschichte mit mediterranem Flair.",
 "Die Altstadt ist kompakt – perfekt, um einen Tag ohne Eile zu verbringen und danach die Küste weiterzuplanen.",
 ],
 gallery: [
 inspirationPhoto("1568301235858-f41588681345", 1600),
 inspirationPhoto("1555990793-da11153b2473", 1200),
 inspirationPhoto("1555881400-74d7acaacd8b", 1200),
 ],
 mustSee: [
 "Stadtmauern-Rundgang (ein Ticket, feste Öffnungszeiten).",
 "Stradun (Placa) als Hauptachse.",
 "Rector's Palace (Kulturhistorisches Museum).",
 "Franziskanerkloster mit einer der ältesten noch genutzten Apotheken Europas.",
 "Sponza-Palast (Archiv/Memorial Raum 1991–1995).",
 "Fort Lovrijenac westlich der Altstadt (Festungsblick).",
 "Seilbahn Srđ: Panorama über die Dächer.",
 "Insel Lokrum (Botanischer Garten, „Eiserner Thron“-Replik).",
 "Banje-Strand oder Kayak unter den Mauern.",
 "Game-of-Thrones-Locations optional mit frühem Slot (weniger Gruppen).",
 ],
 history: [
 "Als Ragusa verwaltete die Stadtrepublik ab dem 14. Jh. weitreichenden Seehandel; 1416 wurde der Sklavenhandel verboten – früh für mediterrane Städte.",
 "1667 zerstörte ein Erdbeben weite Teile; die barocke Silhouette entstand beim Wiederaufbau. 1808 endete die Eigenständigkeit; 1815 kam Ragusa an Österreich, 1918 an Jugoslawien.",
 "1991 beschoss die JNA die Altstadt (UNESCO-Welterbe seit 1979); nach dem Kroatienkrieg folgte sorgfältige Steinrestaurierung. 2023 nahm die Stadt die Euro-Einführung vor.",
 ],
 },
 {
 slug: "cinque-terre",
 name: "Cinque Terre",
 img: inspirationPhoto("1729710448593-7a361fe6323f", 400),
 story: [
 "Fünf bunte Dörfer zwischen Steilhang und Ligurischem Meer: Cinque Terre sind Wander- und Bahnklassiker.",
 "Wege wie der Blue Trail verbinden die Orte – gutes Schuhwerk und Tickets im Voraus sparen Stress.",
 ],
 gallery: [
 inspirationPhoto("1729710442373-a4eebca181ef", 1600),
 inspirationPhoto("1527067903716-ffb864c35a02", 1200),
 inspirationPhoto("1536686830189-5481fa27bc5a", 1200),
 ],
 mustSee: [
 "Monterosso al Mare: einziger Sandstrand, Zuganbindung.",
 "Vernazza: Hafenbucht mit Turmruine Castello Doria.",
 "Corniglia: über 380 Stufen „Lardarina“ vom Bahnhof.",
 "Manarola: postcard viewpoint über dem Weinberg.",
 "Riomaggiore: Via dell'Amore (Teilstrecken je nach Sanierung).",
 "Wanderpass Cinque Terre Card für Wege und Züge prüfen.",
 "Sentiero Monterosso–Vernazza (mittelschwer, Aussicht).",
 "Weinprobe Sciacchetrà in kleinen Cantinen (Termin).",
 "Portovenere als Tagesausflug (UNESCO gemeinsam mit Cinque Terre).",
 "Morgensonne in den Dörfern vor Tagestouristen nutzen.",
 ],
 history: [
 "Weinterrassen am ligurischen Steilhang sind seit der Römerzeit belegt; die heutigen Orte wuchsen im Hochmittelalter unter Genueser Oberhoheit.",
 "1874 eröffnete die Bahnlinie Genua–La Spezia und ersetzte teils den mühsamen Transport auf dem Seeweg; Wanderwege wurden formalisiert (Nationalpark seit 1999).",
 "1997 listete UNESCO Kulturlandschaft Cinque Terre und Küste; Hochwasser 2011 zerstörte Wege und wurde Anlass für Renaturierung und Besucherlenkung.",
 ],
 },
 {
 slug: "cote-dazur",
 name: "Côte d'Azur",
 img: inspirationPhoto("1643914729809-4aa59fdc4c17", 400),
 story: [
 "Fünf Nächte gestaffelt: Nizza, Mougins oder Cannes, dann Region Saint-Tropez – mit Plage Keller am Cap d'Antibes.",
 "Grimaud, Port Grimaud und Ramatuelle statt nur Hafen-Hetze; Anreise mit Auto aus Italien oder Flug Nizza.",
 ],
 gallery: [
 inspirationPhoto("1643914729809-4aa59fdc4c17", 1600),
 inspirationPhoto("1624184780131-189b96898b84", 1200),
 inspirationPhoto("1602419701915-77b7de4628b2", 1200),
 ],
 mustSee: [
 "1 Nacht nahe Nizza nach Anreise.",
 "Plage Keller: Mittagessen am Cap d'Antibes.",
 "Küstenstrasse Cannes–Antibes langsam fahren.",
 "Picasso: Musée Antibes und Vallauris.",
 "2 Nächte Hotel de Mougins oder Cannes.",
 "Saint-Tropez Hafen nur früh.",
 "Port Grimaud: Kanäle zu Fuss.",
 "Grimaud: Burgdorf über dem Golf.",
 "Ramatuelle: Dorf und Strand.",
 "2 Nächte Region Saint-Tropez – danach passt unsere Provence-Route.",
 ],
 history: [
 "Die Riviera wurde im 18./19. Jahrhundert Winterquartier britischer und russischer Aristokratie; die Promenade des Anglais in Nizza trägt diesen Namen.",
 "Picasso lebte und arbeitete in der Region (Antibes, Vallauris, später Mougins) und prägte die lokale Kunstszene.",
 "Heute verbindet die Côte d'Azur Küstenstrasse, Yachttourismus und Hinterland-Dörfer – Hochsaison und Festivalwochen verlangen frühe Buchung.",
 ],
 },
 {
 slug: "provence",
 name: "Provence",
 img: inspirationPhoto("1499002238440-d264edd596ec", 400),
 story: [
 "Avignon, Ocker im Luberon, Märkte in Aix und der Verdon: Die Provence funktioniert am besten mit wenigen Basen.",
 "Unsere 6-Tage-Route plant fünf Nächte und behandelt Lavendel ehrlich als saisonalen Zusatz.",
 ],
 gallery: [
 inspirationPhoto("1499002238440-d264edd596ec", 1600),
 inspirationPhoto("1673423050661-134515109330", 1200),
 inspirationPhoto("1726216831313-766f021650c0", 1200),
 ],
 mustSee: [
 "Avignon: Papstpalast und Altstadt als kompakter Auftakt.",
 "Gordes: Aussicht und zwei Nächte als Luberon-Basis.",
 "Roussillon: Ockerweg früh am Tag.",
 "Lourmarin: ruhiger Zusatz südlich des Luberon.",
 "Aix-en-Provence: Markt, Plätze und ein autofreier Stadttag.",
 "Valensole: nur saisonal als Lavendelstopp einplanen.",
 "Moustiers-Sainte-Marie: Basis vor dem Verdon.",
 "Pont du Galetas: Zugang zur Verdonschlucht je nach Wetter.",
 "Vier Hotelbasen statt täglichem Kofferwechsel.",
 "Hitze, Waldbrand- und Strassenhinweise kurzfristig prüfen.",
 ],
 history: [
 "Avignon war von 1309 bis 1377 Sitz der Päpste; der Papstpalast prägt die ummauerte Altstadt bis heute.",
 "Der Luberon verbindet historische Dörfer mit einer über Jahrhunderte landwirtschaftlich geprägten Kulturlandschaft; Ockerabbau formte Orte wie Roussillon.",
 "Aix-en-Provence war Hauptstadt der historischen Provence. Heute treffen römische Spuren, Märkte und das mit Paul Cézanne verbundene Kulturerbe auf eine moderne Universitätsstadt.",
 ],
 },
 {
 slug: "grandes-alpes",
 name: "Route des Grandes Alpes",
 img: inspirationPhoto("1519904981063-b0cf448d479e", 400),
 story: [
 "Sieben Nächte von Genf nach Cannes: ein Tal pro Abend, Iseran und Bonette als eigene Tage.",
 "Pässe statt Autobahn – Cannes erst, wenn die Berge hinter euch liegen.",
 ],
 gallery: [
 inspirationPhoto("1519904981063-b0cf448d479e", 1600),
 inspirationPhoto("1464822759023-fed622ff2c3b", 1200),
 inspirationPhoto("1677182302564-ffc6bb3252cd", 1200),
 ],
 mustSee: [
 "Col des Aravis oder Colombière nach Genf.",
 "1 Nacht Megève oder Grand-Bornand.",
 "Cormet de Roselend mit Stopp am See.",
 "1 Nacht Val-d'Isère oder Séez – Iseran erst am nächsten Morgen.",
 "Col de l'Iseran und Col du Galibier an einem Tag.",
 "Briançon: Vauban-Altstadt zu Fuss.",
 "Col d'Izoard und Casse Déserte als kurze Etappe.",
 "Cime de la Bonette inklusive Kamm-Schleife.",
 "1 Nacht Saint-Martin-Vésubie vor dem Meer.",
 "Cannes: Suquet, nicht Croisette-Hetze.",
 ],
 history: [
 "Die Route des Grandes Alpes wurde ab 1911 als touristische Nord-Süd-Verbindung über die französischen Alpen ausgebaut; viele Pässe waren zuvor Saumwege oder Militärstrassen.",
 "Col de l'Iseran (1937 für den Verkehr geöffnet) bleibt der höchste asphaltierte Alpenpass; die Cime de la Bonette ergänzt die Kette im Süden als höchste asphaltierte Strasse Europas.",
 "Heute ist die Strecke ein Saisonprodukt (oft Juni–September) und Teil des Tour-de-France-Mythos – Sperrungen und Motorradverkehr gehören zum Alltag der Passsaison.",
 ],
 },
];

export function getInspirationDestinations(locale = "de"): InspirationDestination[] {
  return INSPIRATION_DESTINATIONS.map((d) => localizeInspiration(d, locale));
}

export function getInspirationBySlug(
  slug: string,
  locale = "de",
): InspirationDestination | undefined {
  const d = INSPIRATION_DESTINATIONS.find((item) => item.slug === slug);
  return d ? localizeInspiration(d, locale) : undefined;
}

function localizeInspiration(
  d: InspirationDestination,
  locale: string,
): InspirationDestination {
  const copy = pickLocaleCopy(locale, {
    en: INSPIRATION_COPY_EN,
    es: INSPIRATION_COPY_ES,
  })?.[d.slug];
  if (!copy) return d;
  return {
    ...d,
    name: copy.name,
    story: [...copy.story],
    mustSee: [...copy.mustSee],
    history: [...copy.history],
  };
}

/** Booking.com-Suchziel (Stadt/Region statt poetischem Titel). */
const BOOKING_DESTINATION_BY_SLUG: Record<string, string> = {
  nordlichter: "Tromso, Norway",
  santorini: "Santorini, Greece",
  venedig: "Venice, Italy",
  malediven: "Maldives",
  paris: "Paris, France",
  barcelona: "Barcelona, Spain",
  amalfi: "Amalfi, Italy",
  hallstatt: "Hallstatt, Austria",
  dubrovnik: "Dubrovnik, Croatia",
  "cinque-terre": "Cinque Terre, Italy",
  "cote-dazur": "Nice, France",
  provence: "Provence, France",
  "grandes-alpes": "Megeve, France",
};

export function getInspirationBookingDestination(d: InspirationDestination): string {
  return BOOKING_DESTINATION_BY_SLUG[d.slug] ?? d.name;
}

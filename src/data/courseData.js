// courseData.js – Golfclub Velbert · Gut Kuhlendahl
// Alle Daten aus dem Birdiebook (Pfaff Marketing GmbH) und der Club-Website.
// GPS-Koordinaten sind Naeherungswerte – bitte vor Ort kalibrieren.

export const course = {
  clubName: "Golfclub Velbert – Gut Kuhlendahl",
  courseName: "18-Loch Platz",
  parTotal: 70,
  menTotal: 5608,
  womenTotal: 4930,
  slope: { men: 137, women: 131 },
  cr: { men: 71.8, women: 73.4 },
  gps: { lat: 51.3428, lng: 7.0645, zoom: 15 },
  siteUrl: "https://golfclub-velbert.de",

  holes: [
    {
      n: 1, par: 4, hcp: 5,
      men: 306, women: 274,
      green: { breite: 25, tiefe: 36 },
      layups: [
        { men: 208, women: 176, label: "A" },
        { men: 199, women: 167, label: "B" },
        { men: 191, women: 159, label: "C" },
        { men: 149, women: 117, label: "D" }
      ],
      gps: { lat: 51.3443, lng: 7.0652, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-01.jpeg",
      risk: "Bunker beidseitig Fairway · Wasser links seitlich · 2 Bunker am Gruen",
      tip: "Drive-Praezision wichtiger als Laenge. 40m Hoehenunterschied beachten.",
      description: "Mit 306m relativ kurze Auftaktbahn, die sich durch 40m Hoehenunterschied wesentlich laenger praesentiert. Links droht seitliches Wasser und ein Fairwaybunker, rechts Rough und Bunker. Drei Baeume engen den optimalen Drivepunkt ein. Das leicht gewellte Gruen wird durch zwei tiefe Bunker verteidigt.",
      svgShape: "straight",
      svgTee: [100, 455],
      svgPath: "M100 455 C101 372, 99 278, 100 180 C100 114, 99 73, 97 42",
      svgGreen: [97, 42],
      svgHazards: [
        { type: "water", cx: 60, cy: 358, rx: 15, ry: 38, label: "Wasser" },
        { type: "bunker", cx: 130, cy: 215, rx: 18, ry: 9 },
        { type: "bunker", cx: 72, cy: 225, rx: 16, ry: 9 },
        { type: "bunker", cx: 75, cy: 55, rx: 14, ry: 7 },
        { type: "bunker", cx: 118, cy: 50, rx: 14, ry: 7 }
      ]
    },
    {
      n: 2, par: 4, hcp: 1,
      men: 376, women: 333,
      green: { breite: 25, tiefe: 25 },
      layups: [
        { men: 228, women: 185, label: "A" },
        { men: 209, women: 166, label: "B" },
        { men: 191, women: 148, label: "C" },
        { men: 156, women: 113, label: "D" }
      ],
      gps: { lat: 51.3455, lng: 7.0665, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-02.jpeg",
      risk: "Grosses Wasserhindernis links Mitte",
      tip: "Schwerste Bahn (HCP 1). Kein Driver-Zwang. Layup rechts des Wassers.",
      description: "HCP 1 – die schwierigste Bahn. Ein grosses Wasserhindernis auf der linken Seite zwingt zur Entscheidung: ueber das Wasser riskieren oder konservativer Layup rechts. Das Gruen ist von Baeumen umgeben und erfordert einen praezisen Approach.",
      svgShape: "dogleg-left",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 85 275, 64 192 C51 130, 68 82, 82 42",
      svgGreen: [82, 42],
      svgHazards: [
        { type: "water", cx: 44, cy: 198, rx: 28, ry: 68 }
      ]
    },
    {
      n: 3, par: 3, hcp: 13,
      men: 189, women: 166,
      green: { breite: 26, tiefe: 25 },
      layups: [],
      gps: { lat: 51.3465, lng: 7.0678, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-03.jpeg",
      risk: "Grosses Wasserhindernis links · Wasser kurz vor Gruen",
      tip: "Laenge sauber waehlen. Kurz heisst Wasser und Strafschlag.",
      description: "Par-3 mit markanten Wasserhindernissen links und kurz vor dem Gruen. Die exakte Schlaegelwahl entscheidet. Gruenmitte ist das einzige sichere Ziel. Ein zu kurzer Schlag lands direkt im Wasser.",
      svgShape: "par3",
      svgTee: [100, 400],
      svgPath: "M100 400 C100 332, 100 252, 100 168 C100 108, 100 70, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "water", cx: 40, cy: 218, rx: 32, ry: 116 }
      ]
    },
    {
      n: 4, par: 4, hcp: 17,
      men: 330, women: 291,
      green: { breite: 31, tiefe: 17 },
      layups: [
        { men: 220, women: 181, label: "A" },
        { men: 211, women: 172, label: "B" },
        { men: 195, women: 156, label: "C" },
        { men: 182, women: 143, label: "D" }
      ],
      gps: { lat: 51.3472, lng: 7.0662, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-04.jpeg",
      risk: "Teich links vor Gruen",
      tip: "Approach konservativ. Gruen breit (31m) aber nur 17m tief.",
      description: "Einfachste Par-4-Bahn (HCP 17) mit tueckischem Teich vor dem Gruen. Der Approach muss stimmen – zu kurz bedeutet Wasser. Das breite aber sehr flache Gruen (31 x 17m) verzeiht keine Ueberlaenge.",
      svgShape: "straight",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 100 278, 100 180 C100 114, 100 73, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "water", cx: 68, cy: 57, rx: 25, ry: 20 },
        { type: "bunker", cx: 134, cy: 162, rx: 15, ry: 8 }
      ]
    },
    {
      n: 5, par: 4, hcp: 11,
      men: 367, women: 324,
      green: { breite: 23, tiefe: 25 },
      layups: [
        { men: 229, women: 186, label: "A" },
        { men: 166, women: 123, label: "B" },
        { men: 137, women: 94, label: "C" }
      ],
      gps: { lat: 51.3480, lng: 7.0648, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-05.jpeg",
      risk: "Enger Abschlags-Korridor · Baeume beidseitig",
      tip: "Fairwaytreffer schlaegt Laenge. Praezision ist alles.",
      description: "Enger Abschlags-Korridor durch dichten Baumbestand auf beiden Seiten. Wer zu weit schlaegt, landet im Rough. Fairwaytreffer ist das einzige Ziel vom Tee – danach kurzes Eisen aufs mittelgrosse Gruen.",
      svgShape: "narrow",
      svgTee: [100, 455],
      svgPath: "M100 455 C99 372, 93 275, 89 182 C86 120, 91 78, 93 42",
      svgGreen: [93, 42],
      svgHazards: []
    },
    {
      n: 6, par: 5, hcp: 7,
      men: 445, women: 391,
      green: { breite: 27, tiefe: 35 },
      layups: [
        { men: 262, women: 205, label: "A" },
        { men: 225, women: 171, label: "B" },
        { men: 203, women: 149, label: "C" },
        { men: 182, women: 128, label: "D" },
        { men: 144, women: 90,  label: "E" }
      ],
      gps: { lat: 51.3487, lng: 7.0628, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-06.jpeg",
      risk: "Grosser See links im 2. Drittel",
      tip: "Konsequent 3-Schlag-Loch planen. Layup rechtsseitig vor dem See.",
      description: "Langes Par-5 mit grossem See auf der linken Seite im zweiten Drittel. Wer den zweiten Schlag ueber den See riskiert, spielt Gluecksspiel. Sicherer Layup rechts des Wassers, dann kurzes Eisen aufs tiefe Gruen (27 x 35m).",
      svgShape: "par5-water-left",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 100 278, 102 188 C103 124, 101 78, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "water", cx: 44, cy: 198, rx: 34, ry: 84 }
      ]
    },
    {
      n: 7, par: 4, hcp: 9,
      men: 339, women: 300,
      green: { breite: 26, tiefe: 38 },
      layups: [
        { men: 210, women: 171, label: "A" },
        { men: 207, women: 168, label: "B" }
      ],
      gps: { lat: 51.3474, lng: 7.0610, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-07.jpeg",
      risk: "Interne Ausgrenze links",
      tip: "Risikolinie links klar meiden. Rechte Fairwayhaelfte sicherer.",
      description: "Interne Ausgrenze auf der linken Seite macht jede Linksverfehlung teuer. Der Drive muss in die rechte Fairwayhaelfte. Das tiefe Gruen (38m) erlaubt etwas Toleranz bei der Laenge.",
      svgShape: "straight",
      svgTee: [100, 455],
      svgPath: "M100 455 C101 372, 100 278, 100 180 C100 114, 100 73, 102 42",
      svgGreen: [102, 42],
      svgHazards: [
        { type: "ob-line", side: "left" }
      ]
    },
    {
      n: 8, par: 3, hcp: 15,
      men: 150, women: 133,
      green: { breite: 29, tiefe: 27 },
      layups: [
        { men: 139, women: 122, label: "A" }
      ],
      gps: { lat: 51.3460, lng: 7.0600, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-08.jpeg",
      risk: "Bunker beidseitig am Gruen",
      tip: "Gruenmitte reicht. Keine Risikoschlaege noetig.",
      description: "Kurzes Par-3 mit dichtem Baumbestand. Bunker schuetzen das Gruen auf beiden Seiten. Exakte Schlaegelwahl und Gruenmitte als Ziel. Das Gruen ist mit 29 x 27m angenehm gross.",
      svgShape: "par3",
      svgTee: [100, 400],
      svgPath: "M100 400 C100 332, 100 252, 100 168 C100 108, 100 70, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "bunker", cx: 74, cy: 55, rx: 14, ry: 8 },
        { type: "bunker", cx: 126, cy: 51, rx: 14, ry: 8 }
      ]
    },
    {
      n: 9, par: 4, hcp: 3,
      men: 343, women: 303,
      green: { breite: 29, tiefe: 22 },
      layups: [
        { men: 253, women: 213, label: "A" },
        { men: 240, women: 200, label: "B" },
        { men: 221, women: 181, label: "C" },
        { men: 202, women: 152, label: "D" },
        { men: 158, women: 118, label: "E" },
        { men: 108, women: 68,  label: "F" }
      ],
      gps: { lat: 51.3448, lng: 7.0610, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-09.jpeg",
      risk: "Wasser direkt am Abschlag",
      tip: "Drive nicht zu aggressiv. Wasser liegt direkt vor dem Tee.",
      description: "HCP 3 – zweitschwierigste Bahn. Wasser direkt am Abschlag zwingt zur Entscheidung ueber die Risikolinie. Wer sicher spielt, hat einen langen zweiten Schlag. Sechs Layup-Zonen markieren den kompletten Korridor.",
      svgShape: "water-at-tee",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 370, 95 270, 90 178 C87 116, 93 76, 97 42",
      svgGreen: [97, 42],
      svgHazards: [
        { type: "water", cx: 100, cy: 442, rx: 58, ry: 18 }
      ]
    },
    {
      n: 10, par: 4, hcp: 2,
      men: 370, women: 327,
      green: { breite: 28, tiefe: 37 },
      layups: [
        { men: 249, women: 205, label: "A" },
        { men: 201, women: 158, label: "B" },
        { men: 172, women: 120, label: "C" },
        { men: 159, women: 115, label: "D" }
      ],
      gps: { lat: 51.3435, lng: 7.0620, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-10.jpeg",
      risk: "HCP 2 – schwere Bahn mit langem zweiten Schlag",
      tip: "Bogey ist hier ein sehr gutes Ergebnis.",
      description: "Die zweitschwierigste Bahn der hinteren Neun (HCP 2). Langes Par-4 mit anspruchsvollem, tiefem Gruen. Jedes Bogey zaehlt hier als Erfolg. Kein Risiko beim Drive eingehen.",
      svgShape: "dogleg-left-slight",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 94 275, 88 188 C83 124, 90 80, 95 42",
      svgGreen: [95, 42],
      svgHazards: []
    },
    {
      n: 11, par: 3, hcp: 8,
      men: 164, women: 148,
      green: { breite: 39, tiefe: 25 },
      layups: [],
      gps: { lat: 51.3425, lng: 7.0635, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-11.jpeg",
      risk: "Bunker beidseitig",
      tip: "Breites Gruen (39m) nutzen. Fahne erst zweite Prioritaet.",
      description: "Par-3 mit dem breitesten Gruen auf dem Platz (39m). Bunker auf beiden Seiten. Gruenmitte ansteuern – die Breite ist ein Geschenk, das man nutzen sollte. Kein Risiko auf die Fahne.",
      svgShape: "par3-wide",
      svgTee: [100, 395],
      svgPath: "M100 395 C100 325, 100 248, 100 165 C100 105, 100 68, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "bunker", cx: 68, cy: 55, rx: 20, ry: 9 },
        { type: "bunker", cx: 132, cy: 51, rx: 20, ry: 9 }
      ]
    },
    {
      n: 12, par: 4, hcp: 6,
      men: 321, women: 283,
      green: { breite: 26, tiefe: 25 },
      layups: [
        { men: 216, women: 178, label: "A" },
        { men: 205, women: 167, label: "B" },
        { men: 192, women: 154, label: "C" }
      ],
      gps: { lat: 51.3415, lng: 7.0648, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-12.jpeg",
      risk: "Wasserhindernis rechts",
      tip: "Linke Fairwayhaelfte bevorzugen. Rechts ist teuer.",
      description: "Wasser auf der rechten Seite bestraft ungenaue Schlaege. Linke Fairwayhaelfte ist der sichere Weg. Danach kurzes Eisen aufs mittelgrosse Gruen.",
      svgShape: "water-right",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 99 275, 97 182 C96 118, 97 78, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "water", cx: 152, cy: 192, rx: 26, ry: 64 }
      ]
    },
    {
      n: 13, par: 5, hcp: 14,
      men: 462, women: 409,
      green: { breite: 25, tiefe: 38 },
      layups: [
        { men: 230, women: 177, label: "A" },
        { men: 203, women: 150, label: "B" },
        { men: 185, women: 132, label: "C" }
      ],
      gps: { lat: 51.3402, lng: 7.0660, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-13.jpeg",
      risk: "Interne Ausgrenze",
      tip: "Geduldiges Spiel. Drei solide Schlaege statt Heldenaktion.",
      description: "Langes Par-5 mit interner Ausgrenze. Wer versucht, das Gruen in zwei zu erreichen, riskiert OB. Drei solide Schlaege sind die zuverlaessigere Strategie. Das tiefe Gruen (38m) belohnt einen guten Approach.",
      svgShape: "par5-dogleg-right",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 108 272, 118 190 C125 128, 120 82, 112 42",
      svgGreen: [112, 42],
      svgHazards: [
        { type: "ob-line", side: "right" }
      ]
    },
    {
      n: 14, par: 3, hcp: 18,
      men: 127, women: 109,
      green: { breite: 21, tiefe: 30 },
      layups: [],
      gps: { lat: 51.3393, lng: 7.0645, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-14.jpeg",
      risk: "Bunker",
      tip: "Kuerzesters Loch. Exakte Schlaegelwahl. Kein Sandwedge noetig.",
      description: "Das kuerzeste Loch des Platzes (127m). Trotz der geringen Distanz muss die Schlaegelwahl stimmen. Bunker schuetzen das Gruen. Kein Unterschlag – das tiefe Gruen (30m) erlaubt Praezision.",
      svgShape: "par3-short",
      svgTee: [100, 375],
      svgPath: "M100 375 C100 312, 100 248, 100 168 C100 108, 100 72, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "bunker", cx: 100, cy: 64, rx: 23, ry: 10 }
      ]
    },
    {
      n: 15, par: 4, hcp: 4,
      men: 378, women: 310,
      green: { breite: 24, tiefe: 8 },
      layups: [
        { men: 257, women: 189, label: "A" },
        { men: 225, women: 157, label: "B" },
        { men: 206, women: 138, label: "C" }
      ],
      gps: { lat: 51.3404, lng: 7.0628, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-15.jpeg",
      risk: "Bunker links · EXTREM flaches Gruen (nur 8m tief!)",
      tip: "ACHTUNG: Gruen nur 8m tief. Approach-Laenge ist entscheidend.",
      description: "HCP 4 mit dem flachsten Gruen auf dem Platz (nur 8m tief!). Ueberspielen wird hart bestraft. Die prazise Approach-Laenge entscheidet zwischen Birdie-Chance und Doppelbogey. Bunker links sichern die Flanke.",
      svgShape: "dogleg-left",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 93 272, 87 185 C82 124, 88 80, 92 42",
      svgGreen: [92, 42],
      svgHazards: [
        { type: "bunker", cx: 72, cy: 328, rx: 17, ry: 10 },
        { type: "bunker", cx: 70, cy: 258, rx: 17, ry: 9 }
      ]
    },
    {
      n: 16, par: 3, hcp: 16,
      men: 148, women: 131,
      green: { breite: 27, tiefe: 27 },
      layups: [],
      gps: { lat: 51.3415, lng: 7.0610, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-16.jpeg",
      risk: "Dichter Wald links",
      tip: "Miss links brutal bestraft. Fehler nach rechts machen – mehr Platz.",
      description: "Par-3 mit dichtem Wald auf der linken Seite. Wer links verfehlt, kaempft im Gestruepp. Rechts ist mehr Platz – der Fehler nach rechts ist der bessere Fehler. Quadratisches Gruen (27x27m).",
      svgShape: "par3-forest-left",
      svgTee: [100, 395],
      svgPath: "M100 395 C100 322, 100 242, 100 158 C100 98, 100 65, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "trees", cx: 33, cy: 225, rx: 28, ry: 128 }
      ]
    },
    {
      n: 17, par: 4, hcp: 10,
      men: 316, women: 279,
      green: { breite: 27, tiefe: 21 },
      layups: [
        { men: 192, women: 134, label: "A" },
        { men: 181, women: 144, label: "B" },
        { men: 151, women: 114, label: "C" }
      ],
      gps: { lat: 51.3428, lng: 7.0598, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-17.jpeg",
      risk: "Fairwaybunker Mitte",
      tip: "Platzierung schlaegt Laenge. Mittelbunker ist die Falle.",
      description: "Ein Fairwaybunker in Mitteldistanz bestraft zu weite Drives. Wer gezielt layup spielt, hat einen freien Approach aufs Gruen. Kuerzere aber genauere Option vom Tee waehlen.",
      svgShape: "straight",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 100 278, 100 182 C100 118, 100 78, 100 42",
      svgGreen: [100, 42],
      svgHazards: [
        { type: "bunker", cx: 100, cy: 235, rx: 20, ry: 11 }
      ]
    },
    {
      n: 18, par: 5, hcp: 12,
      men: 477, women: 419,
      green: { breite: 30, tiefe: 21 },
      layups: [
        { men: 271, women: 213, label: "A" },
        { men: 219, women: 161, label: "B" }
      ],
      gps: { lat: 51.3438, lng: 7.0608, zoom: 17 },
      photo: "https://golfclub-velbert.de/wp-content/uploads/2021/09/bahn-18.jpeg",
      risk: "Anstieg zum Gruen · Baeume rechts",
      tip: "Mehr Schlaeger als Distanz zeigt! Uphill-Effekt einkalkulieren.",
      description: "Die Schlussbahn steigt zum Clubhaus hin an – der Anstieg kostet mindestens eine Schlaegerlaenge. Ein wuerdiger Abschluss. Layup ist immer die richtige Option. Das breite Gruen (30m) gibt etwas Sicherheit.",
      svgShape: "par5-uphill",
      svgTee: [100, 455],
      svgPath: "M100 455 C100 372, 100 278, 100 182 C100 118, 100 78, 100 42",
      svgGreen: [100, 42],
      svgHazards: []
    }
  ]
};

export const defaultPlayer = {
  name: "Christian",
  height: "182",
  gender: "Herren",
  handicap: "18.4",
  preferredTee: "Gelb",
  bag: [
    { id: "driver",  club: "Driver",   carry: 220, total: 235 },
    { id: "3w",      club: "3W",       carry: 195, total: 210 },
    { id: "hybrid",  club: "Hybrid",   carry: 180, total: 190 },
    { id: "5i",      club: "5 Eisen",  carry: 165, total: 172 },
    { id: "7i",      club: "7 Eisen",  carry: 145, total: 150 },
    { id: "9i",      club: "9 Eisen",  carry: 125, total: 130 },
    { id: "pw",      club: "PW",       carry: 110, total: 115 },
    { id: "sw",      club: "SW",       carry: 85,  total: 88  }
  ]
};

export const course = {
  clubName: "Golfclub Velbert - Gut Kuhlendahl",
  courseName: "Bahnen 1-18",
  parTotal: 70,
  menTotal: 5608,
  womenTotal: 4930,
  par3Total: 2900,
  holes: [
    { n: 1, par: 4, hcp: 5, men: 306, women: 274, par3: 168, risk: "Bunker rechts", tip: "Sicherer Auftakt. Mitte Fairway priorisieren." },
    { n: 2, par: 4, hcp: 1, men: 376, women: 333, par3: 189, risk: "Wasser links", tip: "Schwerste Bahn. Kein Zwang zum Driver." },
    { n: 3, par: 3, hcp: 13, men: 189, women: 166, par3: 189, risk: "Wasser kurz", tip: "Laenge sauber waehlen. Kurz ist teuer." },
    { n: 4, par: 4, hcp: 17, men: 330, women: 291, par3: 111, risk: "Teich am Gruen", tip: "Approach eher konservativ." },
    { n: 5, par: 4, hcp: 11, men: 367, women: 324, par3: 192, risk: "Enger Abschlag", tip: "Fairwaytreffer wichtiger als maximale Laenge." },
    { n: 6, par: 5, hcp: 7, men: 445, women: 391, par3: 165, risk: "Wasser links", tip: "Als 3-Schlag-Loch planen. Layup vor Risiko." },
    { n: 7, par: 4, hcp: 9, men: 339, women: 300, par3: 142, risk: "Interne Ausgrenze", tip: "Risikolinie vermeiden. Zielzone klar festlegen." },
    { n: 8, par: 3, hcp: 15, men: 150, women: 133, par3: 150, risk: "Bunker am Gruen", tip: "Mitte Gruen reicht." },
    { n: 9, par: 4, hcp: 3, men: 343, women: 303, par3: 172, risk: "Wasser am Tee", tip: "Vom Tee nicht zu aggressiv starten." },
    { n: 10, par: 4, hcp: 2, men: 370, women: 327, par3: 140, risk: "Schweres HCP", tip: "Bogey kann ein gutes Ergebnis sein." },
    { n: 11, par: 3, hcp: 8, men: 164, women: 148, par3: 164, risk: "Bunker beidseitig", tip: "Gruenmitte statt Fahne." },
    { n: 12, par: 4, hcp: 6, men: 321, women: 283, par3: 190, risk: "Wasser rechts", tip: "Rechtes Risiko respektieren." },
    { n: 13, par: 5, hcp: 14, men: 462, women: 409, par3: 115, risk: "Internes Aus", tip: "Geduldig spielen, keine Heldenschlaege." },
    { n: 14, par: 3, hcp: 18, men: 127, women: 109, par3: 151, risk: "Bunker", tip: "Kurzes Loch, klare Distanzentscheidung." },
    { n: 15, par: 4, hcp: 4, men: 378, women: 310, par3: 165, risk: "Bunker links", tip: "Abschlag auf sichere Seite planen." },
    { n: 16, par: 3, hcp: 16, men: 148, women: 131, par3: 157, risk: "Wald links", tip: "Miss links vermeiden." },
    { n: 17, par: 4, hcp: 10, men: 316, women: 279, par3: 186, risk: "Bunker Mitte", tip: "Platzierung wichtiger als Laenge." },
    { n: 18, par: 5, hcp: 12, men: 477, women: 419, par3: 154, risk: "Anstieg zum Gruen", tip: "Runde sauber beenden. Layup ist ok." }
  ]
};

export const defaultPlayer = {
  name: "Christian",
  height: "182",
  gender: "Herren",
  handicap: "18.4",
  preferredTee: "Gelb",
  bag: [
    { id: "driver", club: "Driver", carry: 220, total: 235 },
    { id: "3w", club: "3W", carry: 195, total: 210 },
    { id: "hybrid", club: "Hybrid", carry: 180, total: 190 },
    { id: "7i", club: "7 Eisen", carry: 145, total: 150 },
    { id: "pw", club: "PW", carry: 110, total: 115 }
  ]
};

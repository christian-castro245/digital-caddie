# Kuhlendahl Proberunde MVP

Erste testbare Webapp fuer eine digitale Proberunde / Live-Notizen App auf Basis von Golfclub Velbert - Gut Kuhlendahl.

## Ziel

Kein Hard Testing, kein Backend, keine Datenbank. Die App dient dazu, ein Gefuehl fuer Produktlogik, Screens und Datenerfassung zu bekommen.

## Funktionen

- Spielerprofil mit Bag-Distanzen
- Platzuebersicht mit 18 Bahnen
- Bahnstrategie / virtuelle Proberunde
- Live-Notizen pro Bahn
- Lokale Speicherung im Browser per `localStorage`
- Export und Import der lokalen Daten als JSON
- Reset der lokalen Daten

## Lokal starten

```bash
npm install
npm run dev
```

Danach die lokale URL oeffnen, meistens:

```text
http://localhost:5173
```

## Deployment auf Vercel

1. Repository auf GitHub erstellen
2. Dateien aus diesem Ordner hochladen/pushen
3. Auf vercel.com neues Projekt importieren
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`

## Wichtig

Die Daten werden nur im Browser gespeichert. Wenn du den Browser-Speicher loeschst oder ein anderes Geraet nutzt, sind die Daten dort nicht vorhanden. Fuer Ideenfindung ist das gewollt. Fuer eine spaetere echte Version waere der naechste Schritt Supabase/Firebase/Backend.

## Datenbasis

Die Scorecard-Daten sind als statischer Datensatz in `src/data/courseData.js` hinterlegt. Die Bahnvisualisierungen sind schematische Mock-Grafiken, nicht aus dem Birdiebook kopiert.

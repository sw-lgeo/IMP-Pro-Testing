# HPform – LuxEeB Intake (React + Vite)

Dieses Projekt erstellt ein Intake-Tool für Wärmepumpen-Vorprüfung und LuxEeB-Eingaben. Es nutzt React, TypeScript, TailwindCSS, react-hook-form und zod. Die Ausgabe erfolgt ausschließlich mit deutschen Schlüsseln, während Hilfetexte auf Englisch sind.

## Features
- 12-stufiger Wizard mit Simple/Advanced-Modus
- Zod-Schema als einzige Datenquelle für Labels/Einheiten
- Autosave in LocalStorage, JSON-Import/Export und CSV-Bundle-Download
- LuxEeB-Eingabepaket-Kopie in die Zwischenablage (JSON)
- Beispiel-Datensatz für Bestands-EFH
- Fehlende-Angaben-Checkliste und Eingabe-Übersicht

## Entwicklung

```bash
npm install
npm run dev
```

Die App läuft anschließend unter `http://localhost:5173`.

## Tests / Lint

```bash
npm run build
```

> Hinweis: Es gibt keinen Backend-Teil; alle Daten bleiben lokal im Browser.

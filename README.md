# Task Companion

Deutschsprachige, responsive Aufgaben-PWA mit getrennter Planung und Deadline, wöchentlichen Routinen, Undo und lokaler Speicherung.

## Direkt ausprobieren

    npm install
    npm run dev

Danach die angezeigte lokale URL öffnen. Produktionsnah: npm run build und npm run preview.

## Funktionen in v0.1

- Eingang, Heute, Anstehend (7 Tage) und eigene Projekte
- Aufgaben erstellen, bearbeiten, löschen, priorisieren, planen und mit unabhängiger Deadline versehen
- Wöchentliche Wiederholung mit Abschlussverlauf und unmittelbarem Undo
- Versionierte Speicherung sowie validierter JSON-Export/-Import
- Schnellerfassung mit Q, Speichern mit Enter, Abbrechen mit Escape
- Installierbare PWA und Offline-App-Shell

Wichtig: Daten liegen nur im jeweiligen Browser. Es gibt noch keinen Geräte-Sync, keine Cloud-Sicherung und keine zuverlässigen Erinnerungen.

## Qualität

    npm run typecheck
    npm test
    npm run build

## GitHub Pages

Der Workflow in .github/workflows/ci.yml baut, testet und veröffentlicht main. Einmalig unter **Settings → Pages → Build and deployment → Source** „GitHub Actions“ wählen. Danach liegt die App unter:

https://ttratkb.github.io/task-companion/

Wenn Pages für das Repository oder Konto nicht freigeschaltet ist, bleibt die lokale Vorschau mit npm run dev ohne weitere Einrichtung nutzbar.

## Grenzen

Bewusst nicht enthalten sind Cloud-Sync, Push-Erinnerungen, Companion-/Life-RPG-Funktionen, KI, Kalender- oder Todoist-Import.

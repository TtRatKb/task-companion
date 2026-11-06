# Task Companion

Deutschsprachige, responsive Aufgaben-PWA mit getrennter Planung und Deadline, wöchentlichen Routinen, Undo und lokaler Speicherung.

## Direkt ausprobieren

    npm install
    npm run dev

Danach die angezeigte lokale URL öffnen. Produktionsnah: npm run build und npm run preview.

## Funktionen in v0.2

- Eingang, Heute, Anstehend (7 Tage) und eigene Projekte
- Aufgaben erstellen, bearbeiten, löschen, priorisieren, planen und mit unabhängiger Deadline versehen
- Flexible Wiederholungen: täglich, Mo–Fr, Wochenende, einzelne oder frei kombinierte Wochentage
- Abschlussverlauf mit Schutz vor Doppelabschluss und unmittelbarem Undo
- Inline-Schnellerfassung mit Live-Vorschau für Planung, Deadline, Priorität und Wiederholung
- Versionierte Speicherung sowie validierter JSON-Export/-Import
- Schnellerfassung mit Q, Speichern mit Enter, Abbrechen mit Escape
- Installierbare PWA und Offline-App-Shell

Wichtig: Daten liegen nur im jeweiligen Browser. Es gibt noch keinen Geräte-Sync, keine Cloud-Sicherung und keine zuverlässigen Erinnerungen.

### Schnellerfassung

Mit Q oder „Aufgabe hinzufügen“ öffnet sich die Erfassung direkt in der Liste. **Enter speichert die Aufgabe und öffnet sofort das nächste leere, fokussierte Eingabefeld** – so lassen sich beliebig viele Aufgaben ohne Maus hintereinander erfassen. **Escape schließt** die Erfassung. `#P1` bis `#P4` (auch klein geschrieben) steuern die Priorität; die erkannte Priorität ist sofort in der Vorschau zu sehen und wird gespeichert. „Weitere Einstellungen“ öffnet den vollständigen Editor, auch wenn noch kein Titel eingegeben wurde. Beim Abbrechen bleibt die bisherige Schnelleingabe erhalten.

Beispiele:

- WebUntis eintragen jeden Wochentag #P2
- Elternbrief schreiben am Dienstag bis Donnerstag #P2
- Müll rausbringen jedes Wochenende
- Korrektur jeden Dienstag und Freitag

Erkannte Angaben erscheinen vor dem Speichern als editierbare Chips. „Jeden Schultag“ ist lediglich ein Alias für Montag bis Freitag; Ferien und Feiertage werden nicht automatisch berücksichtigt. Eine Deadline bleibt bei wiederkehrenden Aufgaben unverändert.

### Datenmigration

Beim Laden und Importieren werden v1-Daten mit einer alten wöchentlichen Regel automatisch und ohne Änderung von Aufgaben-, Projekt- oder Ereignis-IDs in das v2-Regelmodell überführt. Eine fehlgeschlagene Migration überschreibt den lokalen Speicher nicht. Vor einem Import ist weiterhin eine ausdrückliche Bestätigung erforderlich.

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

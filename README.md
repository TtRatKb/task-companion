# Task Companion

Deutschsprachige, responsive Aufgaben-PWA mit getrennter Planung und Deadline, wöchentlichen Routinen, Undo und lokaler Speicherung.

## Direkt ausprobieren

    npm install
    npm run dev

Danach die angezeigte lokale URL öffnen. Produktionsnah: npm run build und npm run preview.

## Funktionen in v0.6

- Eingang, Heute, Anstehend (7 Tage), **Deadline-Radar** und eigene Projekte
- Neue Heute-Ansicht: **Unbedingt im Blick**, **Für heute geplant**, **Bald fällig** und **Wenn du noch Zeit hast** – ohne doppelte Aufgaben oder automatische Umplanung
- Deadline-Radar mit überfälligen, heutigen, in den nächsten 7 Tagen und langfristigen Fristen, visuellen Countdown-Hinweisen und Warnung bei Planung nach Deadline
- Aufgaben erstellen, bearbeiten, löschen, priorisieren, planen und mit unabhängiger Deadline versehen
- **Unteraufgaben/Checklisten:** Schritte einzeln abhaken, direkt in der Liste aufklappen, Fortschrittsbalken, im Editor ergänzen/ändern/verschieben/entfernen
- **Eigene Aufgabenvorlagen:** neue Vorlagen anlegen, verändern, löschen und beliebig oft neue Aufgaben mit unabhängigen Checklisten erzeugen
- Flexible Wiederholungen: täglich, Mo–Fr, Wochenende, einzelne oder frei kombinierte Wochentage
- Abschlussverlauf mit Schutz vor Doppelabschluss und unmittelbarem Undo
- Inline-Schnellerfassung mit Live-Vorschau für Planung, Deadline, Priorität und Wiederholung
- Versionierte lokale Speicherung sowie validierter JSON-Export/-Import
- Optionale Google-Anmeldung und Cloud-Synchronisation über Firebase (nach einmaliger Einrichtung der Firestore-Regeln); konservativer Revisionsabgleich mit Konfliktwarnung statt stiller Überschreibung
- Schnellerfassung mit Q, Speichern mit Enter, Abbrechen mit Escape
- Installierbare PWA und Offline-App-Shell
- Sichtbare App-Version inklusive automatisch eingeblendeter GitHub-Build-Kennung
- Optionale, gerätespezifische Deadline-Erinnerungen als Browser-Benachrichtigung (7/3/1 Tag vor Termin oder am Termin; Uhrzeit einstellbar), solange die App im Browser ausgeführt wird

**Wichtig:** Die App speichert weiterhin immer lokal. Eine optionale Cloud-Synchronisation ist nach einer einmaligen Firebase-Einrichtung verfügbar. Ohne diese Einrichtung findet noch **kein** Geräte-Sync statt. Es gibt weiterhin **keine serverseitigen Push-Erinnerungen bei vollständig geschlossener App**. Ein Cloud-Sync ersetzt keine unabhängig heruntergeladene JSON-Sicherung.

### Schnellerfassung

Mit Q oder „Aufgabe hinzufügen“ öffnet sich die Erfassung direkt in der Liste. **Enter speichert die Aufgabe und öffnet sofort das nächste leere, fokussierte Eingabefeld** – so lassen sich beliebig viele Aufgaben ohne Maus hintereinander erfassen. **Escape schließt** die Erfassung. `#P1` bis `#P4` (auch klein geschrieben) steuern die Priorität; die erkannte Priorität ist sofort in der Vorschau zu sehen und wird gespeichert. „Weitere Einstellungen“ öffnet den vollständigen Editor, auch wenn noch kein Titel eingegeben wurde. Beim Abbrechen bleibt die bisherige Schnelleingabe erhalten.

Beispiele:

- WebUntis eintragen jeden Wochentag #P2
- Elternbrief schreiben am Dienstag bis Donnerstag #P2
- Müll rausbringen jedes Wochenende
- Korrektur jeden Dienstag und Freitag

Erkannte Angaben erscheinen vor dem Speichern als editierbare Chips. „Jeden Schultag“ ist lediglich ein Alias für Montag bis Freitag; Ferien und Feiertage werden nicht automatisch berücksichtigt. Eine Deadline bleibt bei wiederkehrenden Aufgaben unverändert.

### Unteraufgaben und Vorlagen

Unteraufgaben bearbeitest du im normalen Aufgabenfenster. Danach siehst du unter der Aufgabe den Fortschritt (z. B. **2/6**) und kannst per Pfeil die vollständige Checkliste aufklappen und Schritte direkt abhaken.

Unter **Vorlagen** in der Seitenleiste kannst du eigene Standardabläufe speichern. Du kannst entweder eine neue Vorlage erstellen, eine bearbeitbare Beispielvorlage für „Klassenarbeit vorbereiten“ übernehmen oder über **Als Vorlage** eine vorhandene Aufgabe in einen wiederverwendbaren Ablauf umwandeln. Die ursprüngliche Aufgabe bleibt beim Speichern einer Vorlage unverändert. Wenn du eine Vorlage anwendest, öffnet sich der Aufgaben-Editor: Passe Titel (z. B. Klasse/Fach), Projekt und **Deadline** an, bevor du speicherst. Auch im Eingang und in Projektansichten steht **Aus Vorlage erstellen** bereit, wenn Vorlagen vorhanden sind.

Jede aus einer Vorlage erzeugte Aufgabe bekommt **neue IDs und eine eigene, zunächst unerledigte Checkliste**. Eine spätere Änderung oder Löschung der Vorlage beeinflusst ältere Aufgaben nicht. Bei wiederkehrenden Aufgaben setzt der Abschluss die Unteraufgaben für das nächste Vorkommen zurück; **Rückgängig** stellt ihre vorherigen Häkchen wieder her.

### Datenmigration

Beim Laden und Importieren werden Sicherungen der Versionen **v1 und v2** ohne Verlust der Aufgaben-, Projekt- und Abschluss-IDs nach **Schema v3** migriert. Alte Aufgaben erhalten eine leere Checkliste, Vorlagen werden als eigener Datenbereich hinzugefügt. Ungültige Dateien überschreiben keine gespeicherten Daten. Cloud-Sync und JSON-Backups beinhalten auch die Vorlagen und Checklisten. Nach dem Update sollten **alle Geräte** die aktuelle v0.6 laden, bevor du auf mehreren Geräten weiterarbeitest.

## Versionsanzeige und Benachrichtigungen

Unten links in der Seitenleiste sowie unter **Daten & Einstellungen** steht die aktuell geladene Versionsnummer (z. B. `v0.5.0 · Build 1234abcd`). Bei GitHub-Pages-Veröffentlichungen wird die Build-Kennung direkt aus der Commit-ID generiert; damit lässt sich nach einem Seitenreload erkennen, ob die App tatsächlich aktualisiert wurde. Lokal erscheint `Build lokal`.

In **Daten & Einstellungen → Deadline-Erinnerungen** lassen sich Browser-Benachrichtigungen bewusst einschalten. Standardmäßig sind sie deaktiviert. Es gibt Auswahlen für 7, 3 und 1 Tag(e) vor der Deadline sowie am Deadline-Tag. Die früheste Benachrichtigungszeit gilt nach deutscher Ortszeit. Eine Testbenachrichtigung hilft bei der Browser-Konfiguration. Jede kombinierte Aufgabe/Deadline/Vorwarnstufe wird pro Browser nur einmal angezeigt; mehrere gleichzeitig fällige Hinweise werden gebündelt.

**Grenze:** Die Benachrichtigungsprüfung läuft nur, solange die App im Browser ausgeführt wird (einschließlich des nächsten Aufrufes, soweit der betreffende Erinnerungs-Kalendertag noch aktuell ist). Bei vollständig geschlossener App gibt es keinen garantierten Push. Dafür ist ein Server mit Scheduler und Web-Push/FCM nötig; siehe **[docs/PUSH_NEXT_STEPS.md](docs/PUSH_NEXT_STEPS.md)**. Die Benachrichtigungserlaubnis und Erinnerungszeit sind lokale Einstellungen pro Browser, die Aufgaben selbst werden davon unabhängig synchronisiert.

## Deadline-Radar

Die App unterscheidet ausdrücklich zwischen geplantem Tag und tatsächlich verpflichtender Deadline. Im Menü **Deadline-Radar** werden offene Aufgaben aus **allen Projekten** anhand ihrer Deadline gebündelt: überfällig, heute, nächste 7 Tage und später. Die Heute-Ansicht zeigt zunächst Dringendes, dann bereits für heute geplante Aufgaben, anschließend bevorstehende Deadlines und höchstens drei freiwillige Vorschläge aus ungeplanten Aufgaben. Eine Aufgabe erscheint innerhalb von Heute nur in einer Gruppe; kein Datum wird automatisch geändert. Tageswechsel werden beim Aktivieren der App und im Minutenrhythmus aktualisiert.

Die Anzeige ist **keine Push-Erinnerung**. Du siehst sie, wenn du die App öffnest. Benachrichtigungen außerhalb der App sind für einen späteren Schritt vorgesehen.

## Cloud-Synchronisation

Die technischen Voraussetzungen und die einmalige sichere Einrichtung stehen unter **[docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md)**. Die neue Cloud-Datei liegt im bereits vorhandenen Life-RPG-Firebase-Projekt, **aber in einem völlig getrennten Pfad**. Die Life-RPG-Spielstände werden nicht geändert. Beim ersten Verbinden wird nicht ungefragt eine lokale oder eine Cloud-Aufgabenliste überschrieben. Ein Konflikt bei zwei Geräten wird angezeigt und bleibt bis zu einer bewussten Entscheidung erhalten.

**Vor echten Aufgaben auf zwei Geräten:** Login, Berechtigung, Cloud-Upload, zweite Anmeldung, Offline-Änderung und JSON-Backup praktisch prüfen.

## Qualität

    npm run typecheck
    npm test
    npm run build

## GitHub Pages

Der Workflow in .github/workflows/ci.yml baut, testet und veröffentlicht main. Einmalig unter **Settings → Pages → Build and deployment → Source** „GitHub Actions“ wählen. Danach liegt die App unter:

https://ttratkb.github.io/task-companion/

Wenn Pages für das Repository oder Konto nicht freigeschaltet ist, bleibt die lokale Vorschau mit npm run dev ohne weitere Einrichtung nutzbar.

## Grenzen

Bewusst nicht enthalten sind **Hintergrund-Push bei vollständig geschlossener App**, automatisches Mergen von gleichzeitig geänderten Cloud-Datensätzen, Companion-/Life-RPG-Belohnungsfunktionen, KI, Kalender- oder Todoist-Import. Die Cloud-Synchronisation ist optional und muss einmalig serverseitig eingerichtet werden.

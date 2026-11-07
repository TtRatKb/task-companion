# Task Companion

Deutschsprachige, responsive Aufgaben-PWA mit getrennter Planung und Deadline, wöchentlichen Routinen, Undo und lokaler Speicherung.

## Direkt ausprobieren

    npm install
    npm run dev

Danach die angezeigte lokale URL öffnen. Produktionsnah: npm run build und npm run preview.

## Funktionen in v0.6

- Eingang, Heute, Anstehend (7 Tage), **Deadline-Radar** und eigene Projekte
- **Unteraufgaben/Checklisten** direkt an Aufgaben mit Fortschrittsanzeige, separaten Häkchen und Bearbeiten im Aufgabeneditor
- **Aufgabenvorlagen**: eigene Vorlagen erstellen, bearbeiten, löschen, als Checkliste aus bestehenden Aufgaben speichern und beliebig oft zu frischen Aufgaben machen
- Beispielvorlage für wiederkehrende Klassenarbeitsvorbereitung, zuerst individuell anpassbar
- Neue Heute-Ansicht: **Unbedingt im Blick**, **Für heute geplant**, **Bald fällig** und **Wenn du noch Zeit hast** – ohne doppelte Aufgaben oder automatische Umplanung
- Deadline-Radar mit überfälligen, heutigen, in den nächsten 7 Tagen und langfristigen Fristen, visuellen Countdown-Hinweisen und Warnung bei Planung nach Deadline
- Aufgaben erstellen, bearbeiten, löschen, priorisieren, planen und mit unabhängiger Deadline versehen
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

### Datenmigration

Beim Laden und Importieren werden v1-Daten mit einer alten wöchentlichen Regel automatisch und ohne Änderung von Aufgaben-, Projekt- oder Ereignis-IDs in das v2-Regelmodell überführt. Eine fehlgeschlagene Migration überschreibt den lokalen Speicher nicht. Vor einem Import ist weiterhin eine ausdrückliche Bestätigung erforderlich.

## Unteraufgaben und Vorlagen

In jeder Aufgabe findest du unter **Weitere Einstellungen / Aufgabe bearbeiten → Unteraufgaben** eine frei anpassbare Checkliste. Die Häkchen lassen sich auch direkt in der Aufgabenliste setzen. Bei wiederkehrenden Aufgaben wird die Checkliste nach dem Abschließen für den nächsten Termin zurückgesetzt; „Rückgängig“ stellt die bisherigen Häkchen wieder her.

Unter **Vorlagen** erstellst du wiederverwendbare Abläufe, zum Beispiel „Klassenarbeit vorbereiten“. Jeder Schritt steht in der Vorlage in einer eigenen Zeile. Beim Auswählen einer Vorlage öffnet sich ein **neuer Aufgabenentwurf** mit frischen, noch nicht abgehakten Unteraufgaben. Dort legst du individuell Projekt, geplanten Arbeitstag und Deadline fest. Eine Vorlage beeinflusst bereits angelegte Aufgaben nicht, selbst wenn du sie nachträglich bearbeitest oder löschst.

Alternativ kannst du im Aufgabeneditor **Als Vorlage speichern** wählen. Die Vorlage wird separat zur Aufgabe in der versionierten App-Datenbank gespeichert und ist Teil des JSON-Exports und der Cloud-Synchronisation. Das alte v1/v2-Format wird beim Laden/importieren schonend nach **Schema v3** migriert, ohne vorhandene Aufgaben, Termine, Projekte oder IDs zu verlieren.

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

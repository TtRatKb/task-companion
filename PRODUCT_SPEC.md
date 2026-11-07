# Task Companion — Produktspezifikation

Version: 0.1 (Projektgrundlage, 06.11.2026). Arbeitsname und visuelles Branding sind vorläufig.

## 1. Vision

Eine deutschsprachige, selbst gehostete bzw. kostenlos betreibbare persönliche Aufgabenverwaltung, die Todoists vertraute, schnelle Bedienung übernimmt und später ein optionales Companion-System ermöglicht. Zentrale Wirkung: verlässlich entlasten, ohne Selbstoptimierungsdruck und ohne ungefragtes Umplanen.

Die Nutzerin arbeitet nicht selbst am Code, sondern steuert Entwicklung und Tests mit ChatGPT/Codex. Deswegen haben einfache Einrichtung, GitHub-Workflow, reproduzierbare Tests, Datenmigrationen und klares Fehlermanagement hohe Priorität.

## 2. Produktprinzipien (verbindlich)

1. **Verlässlichkeit vor Features.** Keine Datenverluste, keine unsichtbaren Terminkollisionen, keine vorgetäuschten Erinnerungen.
2. **Planungshoheit.** Die Nutzerin plant selbst; intelligente Empfehlungen dürfen Vorschläge machen, nicht ungefragt Daten oder Termine ändern.
3. **Geplantes Datum ≠ Deadline ≠ Erinnerung.** Diese Felder sind unabhängig; keines darf stillschweigend ein anderes überschreiben.
4. **Schnelle, vertraute Bedienung.** Kompakte Listen, direktes Abhaken, schnelle Erfassung, klare Navigation, wenige Klicks.
5. **Ruhig statt überladen.** Keine künstlichen Streaks, Schuldgefühle oder verpflichtende Gamification.
6. **Aufgaben-App eigenständig.** Life RPG konsumiert später bestätigte abgeschlossene Aufgabenereignisse, verwaltet aber keine Aufgaben.
7. **Ohne laufende Zwangskosten.** Kein verpflichtendes Todoist-, KI- oder anderes Drittanbieterabo.
8. **Kein 1:1-Markenklon.** Todoist dient als UX-Referenz; keine Markenassets, kein Kopieren von geschütztem Quellcode.

## 3. Visuelles und UX-Vorbild

- Desktop: linke Seitenleiste, rechts zentrale Aufgabenliste, kompakte Typografie, großzügige Weißräume, zurückhaltende Rot-Akzente, farbliche Prioritäten.
- Mobile: klar erreichbare Navigation, einfache Schnellerfassung, Touch-Ziele groß genug; keine abgeschnittenen Dialoge.
- Hauptnavigation in Version 0.1: **Eingang**, **Heute**, **Anstehend**, **Projekte**. Weitere Ansichten wie Filter und Labels folgen später, statt nicht funktionsfähige Platzhalter zu zeigen.
- Aufgabenzeile: anklickbarer Kreis links, Titel, ggf. Beschreibungsvorschau, Projekt-/Datums-/Deadline-Metadaten, Detailansicht beim Klick auf die Zeile.
- „Heute“ zeigt ausdrücklich geplante Aufgaben für heute und überfällige geplante Aufgaben. Nicht geplante Aufgaben mit Deadline heute/überfällig erscheinen in einer klar getrennten Deadline-Gruppe; ihr `scheduledDate` bleibt unverändert.
- „Anstehend“ gruppiert die nächsten Tage nach geplantem Datum; spätere Deadline-Ansichten dürfen ergänzen, aber keinen Tag vortäuschen.
- Direkte Eingabe und Bearbeitung mit Tastatur (Schnellerfassung über `Q`, Enter speichern, Escape abbrechen); Rückgängig-Aktion für Abhaken.

## 4. Fachliches Datenmodell

Für Version 0.1 mindestens:

```
Task {
  id: string;                // stabile, zufällige ID
  title: string;
  description: string;
  projectId: string | null;  // null = Eingang
  priority: 1 | 2 | 3 | 4;   // P1 höchste Priorität
  scheduledDate: string | null; // YYYY-MM-DD; kein UTC-Zeitpunkt
  deadlineDate: string | null;  // YYYY-MM-DD; unabhängig
  recurrence: null | { kind: 'weekly'; weekday: 0|1|2|3|4|5|6 };
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}
CompletionEvent {
  id: string;
  taskId: string;
  occurredAt: string;
  previousScheduledDate: string | null;
  resultingScheduledDate: string | null;
  undoneAt: string | null;
}
```

Intern zusätzlich `schemaVersion` und Migrationslogik. Datumsfelder ohne Uhrzeit müssen als **lokale Kalenderdaten** behandelt werden (Standardzeitzone Europe/Berlin), nie als `new Date('YYYY-MM-DD')` mit unerwartetem UTC-Versatz. Für v0.1 ist nur eine wöchentliche Wiederholung erforderlich; tägliche, monatliche und komplexere Regeln folgen später.

Wiederholung: Beim Abschließen einer wöchentlichen Aufgabe wird eine Abschluss-Historie geschrieben und der nächste passende Wochentag **nach** dem Abschlusstag angesetzt. Die eigentliche Aufgabe bleibt aktiv. Ein unmittelbar angebotenes „Rückgängig“ stellt den vorherigen Zustand wieder her und verhindert doppelte Einträge. Bei erstmalig angelegten Wiederholungen ist der nächstgültige Wochentag eindeutig anzuzeigen.

## 5. Umsetzungstechnik

- React + TypeScript + Vite, Komponentenstruktur statt einer einzigen großen Datei.
- Bewusst schlanke Abhängigkeiten; Icons z. B. `lucide-react`, einfache CSS-Struktur.
- `TaskRepository`/Persistenzadapter, damit der spätere Wechsel von lokalem Speicher zu Firebase nicht die gesamte Oberfläche neu schreiben lässt.
- Version 0.1: lokale Persistenz und manueller JSON-Export/-Import mit Validierung und Bestätigung vor Ersetzen. Ohne Cloud-Sync keinen geräteübergreifenden Anspruch vermitteln.
- PWA-Grundlage (Manifest, originelles Icon, einfacher Offline-App-Shell-Cache). Keine Behauptung, Push-Erinnerungen bereits zu unterstützen.
- Später: eigene Firebase-Datenbereiche pro authentifizierter UID, Firestore-Security-Rules und Konfliktbehandlung; nicht in den Life-RPG-Hauptsave schreiben.
- Tests für Sortierung/Anzeigen, Datumslogik, Wiederholungen, CRUD, Datenpersistenz, Export/Import und Undo.

## 6. Roadmap

### M1 — Funktionierender Todoist-artiger Kern (Codex-Auftrag 01)

App-Gerüst, responsive Navigation, Eingang/Heute/Anstehend/Projekte, Aufgaben-CRUD, P1–P4, Planungsdatum, eigenständige Deadline, einfache wöchentliche Wiederholung, direktes Abhaken + Undo, lokale Speicherung, Sicherung, Basis-PWA, Tests und nachvollziehbare Vorschau-/Deployment-Anleitung.

### M2 — Verlässliche Alltags-App

Firebase-Anmeldung, Sync zwischen Geräten, Offline-/Konfliktstrategie, Backup und Restore, belastbare Wiederholungs- und Datenmigrationstests, Todoist-Datenübernahme. Vor einem produktiven Wechsel mindestens mit mehreren Geräten und neu geladenen Sitzungen prüfen.

### M3 — Erinnerungen und Deadline-Radar

Serverseitig ausgeführte Erinnerungsplanung, Web-Push soweit plattformseitig möglich, Lieferstatus und Ausweichkanal; manuelle Erinnerungsvorläufe, dringliche Aufgaben, Aufgabenschätzung. Keine versprochene Zuverlässigkeit ohne End-to-End-Tests im geschlossenen Zustand.

### M4 — Persönliche Hilfen

Filter, Labels, Unteraufgaben, Date/Time-Blocking, kurze-Zeitfenster-Vorschläge, ChatGPT-Import/-Anbindung, optionale Kalenderintegration. Vorschläge nur, keine ungefragten Verschiebungen.

### M5 — Optionaler Companion und Life-RPG-Brücke

Regelbasierte, charaktertypische Äußerungen (später Bakugo/Kirishima-inspiriert, mit unabhängig verwendbarem eigenen Artwork/Design), auswählbar und abschaltbar. Datenzugriff nur lesend, Vorschläge transparent; Life RPG erhält eindeutige, bestätigte Ereignisse und vergibt Belohnungen ohne Doppelzählung.

## 7. Datenschutz und Sicherheit

Keine echten Schülerdaten, Schulunterlagen, privaten Tokens oder Produktivdaten in Repository, Tests, Logs oder Screenshots. Demoaufgaben müssen erfunden sein. Zukünftige Cloud-Security-Rules müssen nutzerbezogene Leserechte/Schreibrechte erzwingen; die Firebase-Webkonfiguration alleine ist keine Zugriffssicherung. Kein Speichern von API-Secrets im Frontend.

## 8. Nicht verhandelbare Akzeptanzkriterien für M1

- Alle sichtbaren Hauptfunktionen sind bedienbar oder bewusst noch nicht vorhanden; keine Attrappen.
- Aufgaben und Projekte überstehen einen Reload und werden nicht versehentlich durch Updates gelöscht.
- `scheduledDate` und `deadlineDate` lassen sich separat setzen, ändern und löschen.
- Ungeplante Aufgaben ohne Deadline erscheinen nicht automatisch in „Heute“.
- Eine Deadline allein verändert nie den geplanten Arbeitstag.
- Wöchentliche Aufgabe kann abgeschlossen werden, setzt nächsten Termin und lässt den Abschluss nachvollziehbar; Undo funktioniert.
- Export enthält vollständige Daten; Import validiert und ersetzt nur nach ausdrücklicher Bestätigung.
- Tastatur- und Mobile-Bedienung funktionieren.
- Build und automatisierte Tests sind erfolgreich; Grenzen und manuelle Deployment-Schritte sind dokumentiert.

## 9. Ergänzung v0.2 — Wiederholungen und Schnellerfassung

- Wiederholungen speichern eine normalisierte, sortierte Menge von Wochentagen. Unterstützt sind täglich, Montag bis Freitag, Wochenende, ein einzelner Tag und beliebige Kombinationen.
- „Jeden Schultag“ bedeutet ausschließlich Montag bis Freitag. Es gibt keine Ferien- oder Feiertagslogik.
- Das nächste Vorkommen liegt streng nach dem tatsächlichen lokalen Abschlusstag. Die Deadline wird nicht mitverschoben.
- Pro Aufgabe und lokalem Abschlusstag entsteht höchstens ein aktives Abschlussereignis. Undo ist nur für den neuesten passenden Abschluss zulässig.
- Schema-v1-Daten und alte JSON-Sicherungen werden idempotent nach Schema v2 migriert. IDs, Termine, Projekte und Abschlussereignisse bleiben erhalten; Fehler überschreiben keine gespeicherten Daten.
- Die Inline-Schnellerfassung erkennt deterministisch deutsche Planungs-, Deadline-, Prioritäts- und Wiederholungsangaben. Nur erfolgreich erkannte Abschnitte werden aus dem Titel entfernt und alle Ergebnisse bleiben vor dem Speichern sichtbar und änderbar.


## 10. Ergänzung v0.3 — optionale Cloud-Synchronisation und Backups

- Task Companion bleibt eine eigenständige App und speichert weiterhin sofort im lokalen Browser. **Google-Cloud-Sync ist opt-in**, kein Startzwang.
- Reuse der öffentlichen Firebase-Web-Konfiguration von Life RPG (`life-rpg-3afb7`) – aber eigener Firestore-Pfad `users/{uid}/taskCompanion/state`, nicht in Life-RPG-Speicherdateien schreiben.
- Firestore-Lese-/Schreibrechte ausschließlich für authentifizierte Eigentümer:innen der jeweiligen UID; notwendige Firebase-Console-Ergänzung steht in `docs/CLOUD_SETUP.md`. Bestehende Life-RPG-Regeln bleiben unangetastet.
- Versioniertes Cloud-Dokument (Revision + AppData). Veränderungen werden durch Transaktionen mit Revisionsvergleich gegen gleichzeitige Bearbeitung geschützt. Lokale und Cloud-Daten werden niemals ungefragt aufeinander überschrieben.
- Beim ersten Verbinden und bei Konflikten muss die Nutzerin ausdrücklich wählen, welche Version sie weiterführt. Vor Ersetzen wird die andere lokale oder Cloud-Version als zusätzliche Wiederherstellungskopie im Browser gespeichert. Download/Import per JSON bleiben separat verfügbar.
- Aufträge/Änderungen, die offline entstehen, werden lokal gespeichert und bei verfügbarer Cloud wieder abgeglichen; kollidierende Änderungen werden **angezeigt statt automatisch verschmolzen**.
- Dies ist keine produktive Cloud-Freigabe, solange autorisierte Domain, Google-Anmeldung, serverseitige Firestore-Rules und echte Zwei-Geräte-Tests nicht überprüft wurden. Cloud-Sync ist kein Ersatz für externe Backups oder Push-Erinnerungen.
- Firestore-Dokumentgrenze von 1 MiB beachten; bei Wachstum künftig pro-Aufgabe-Dokumente mit kontrollierter Migration einführen.


## 11. Ergänzung v0.4 — Deadline-Radar und fokussierte Heute-Ansicht

- Das Dashboard **Heute** zeigt vier disjunkte, nach Dringlichkeit geordnete Kategorien: (1) heute/überfällig per Deadline, (2) heute oder früher bewusst geplante Aufgaben, (3) echte Deadlines innerhalb der folgenden sieben Kalendertage, (4) höchstens drei freiwillige Vorschläge unter ungeplanten und nicht kurzfristig fälligen Aufgaben. Dieselbe Aufgabe wird innerhalb der Ansicht nicht mehrfach dargestellt.
- Eine separate Navigationsseite **Deadline-Radar** führt alle offenen Aufgaben mit Deadline aus sämtlichen Projekten auf: überfällig, heute, innerhalb von sieben Tagen und langfristig. Keine Aufgaben ohne Deadline auf dieser Seite.
- Ein visuelles Radar zählt überfällige, heute fällige und bald fällige Aufgaben; es warnt zusätzlich, wenn eine Aufgabe erst **nach** ihrer Deadline zur Bearbeitung eingeplant ist.
- Aufgabenzeilen erhalten einen lesbaren Deadline-Countdown, mit diskreter farblicher Betonung. Keine Änderung an geplanten Tagen, Deadlines, Prioritäten oder Cloud-Daten durch die Radar-Berechnung.
- Kalenderarithmetik nutzt lokale `YYYY-MM-DD`-Kalendertage in Europe/Berlin und ist unabhängig von Sommer-/Winterzeit. Die Ansicht aktualisiert sich beim Fensterfokus und Tageswechsel.
- **Bewusste Grenze:** Das Radar zeigt Hinweise *innerhalb* der Anwendung, **keine** Benachrichtigungen, wenn die PWA geschlossen ist. Serverseitige Push-Erinnerungen samt tatsächlichem Lieferstatus gehören in einen späteren, separat getesteten Schritt.
- Die in v0.3 etablierte Cloud-Synchronisation und ihre Sicherungsstrategie dürfen von diesem Update nicht verändert oder zurückgesetzt werden; keine Datenmodellmigration erforderlich.


## 12. Ergänzung v0.5 — sichtbarer Build und opt-in Browser-Erinnerungen

- Die Sidebar zeigt unten links und die Einstellungen zeigen explizit die geladene App-Version. Die Build-Kennung wird bei GitHub Pages automatisch aus der tatsächlichen Commit-SHA injiziert. Eine neue Veröffentlichung lässt sich somit auch bei gleicher semantischer Versionsnummer unterscheiden.
- Browser-Benachrichtigungen sind standardmäßig **deaktiviert**. Browserberechtigung wird nur nach einem ausdrücklichen Klick angefragt.
- Erinnerungstage sind gerätespezifisch auswählbar: 7/3/1 Tage vor der Deadline und am Deadline-Tag; dazu eine früheste Uhrzeit in Europe/Berlin. Eine sichtbare Testbenachrichtigung ist möglich.
- Ein Reminder wird je Task-ID, Deadline und Vorwarnstufe lokal höchstens einmal angezeigt. Mehr als drei zeitgleiche Erinnerungen werden gebündelt. Abgeschlossene Aufgaben erzeugen keine Meldung. Benachrichtigungen verändern weder geplante Daten noch Deadlines, Abschlussereignisse oder Cloud-Status.
- **Einschränkung ausdrücklich anzeigen:** Diese Browser-Erinnerungen benötigen eine gerade geöffnete/ausgeführte App. Kein garantierter Background-Push bei vollständig geschlossener App. Serverseitiger Scheduler mit FCM/Web Push bleibt ein separates Vorhaben mit Einrichtungs- und möglicher Kostenfreigabe (siehe `docs/PUSH_NEXT_STEPS.md`).
- Keine Migration des Aufgabendatenmodells. Browser-/Geräte-Einstellungen liegen getrennt im lokalen Speicher; Cloud-Synchronisierung und JSON-Backups der Aufgaben bleiben unverändert.


## 13. Ergänzung v0.6 — Checklisten und Aufgabenvorlagen

- `Task.subtasks`: geordnete Liste eigenständiger Unteraufgaben (`id,title,completedAt`), direkt in Aufgabenlisten aufklappbar und einzeln abhackbar. Fortschritt `erledigt / gesamt` plus dezenter Fortschrittsbalken. Detail-Editor bietet Anlegen, Umbenennen, Sortieren, Entfernen und Abhaken.
- `TaskTemplate`: unabhängig gespeicherte Vorlage (`id,name,title,description,priority,subtaskTitles,createdAt,updatedAt`); bewusst **keine** festen Fälligkeits- oder Planungsdaten. Beim Anwenden öffnet sich der normale Aufgaben-Editor, damit Fach, Klasse, Projekt, Planung und Deadline individuell gesetzt werden können.
- Neue Aufgaben aus einer Vorlage erhalten vollständig neue Task- und Subtask-IDs. Häkchen sind leer, Änderungen am Task haben keine Wirkung auf die Vorlage oder andere Instanzen; Löschen einer Vorlage löscht keine bestehenden Aufgaben.
- Vorlagenbibliothek in der Hauptnavigation, mit Anlegen, Bearbeiten, Löschen und Anwenden. „Als Vorlage“ im Aufgaben-Editor und „Aus Vorlage erstellen“ in der Aufgabenliste. Vorschlag „Klassenarbeit vorbereiten“ mit Beispielschritten wird erst nach Bearbeiten und ausdrücklichem Speichern angelegt, nicht automatisch.
- Bei Abschluss einer wiederkehrenden Aufgabe werden die Schritte für das neue Vorkommen geleert. Der Abschlussverlauf enthält dafür den vorherigen Checklistenstatus, sodass Undo ihn exakt wiederherstellen kann; die bestehenden Wiederholungs- und Deadline-Regeln bleiben unberührt.
- `AppData.schemaVersion=3` migriert v1/v2 ohne Verlust von Aufgaben, Projekten, Ereignissen oder Deadlines. Alte Aufgaben erhalten `subtasks:[]` und alte Daten `templates:[]`. Validierung verweigert ungültige IDs und Formate. JSON-Sicherung und bestehendes Cloud-Dokument transportieren die zusätzlichen Felder.
- Wichtig für geräteübergreifende Nutzung: ältere, noch geöffnete v0.5-PWA-Instanzen vor weiterer Bearbeitung aktualisieren; der Cloud-Revisionsabgleich verhindert ein stilles Übertragen veralteter Stände.

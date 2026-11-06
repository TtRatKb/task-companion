# Codex-Auftrag 01 — Task Companion: lauffähige Todoist-artige Basis (v0.1)

Du arbeitest im **neuen, eigenständigen GitHub-Repository für Task Companion**. Falls es leer ist, richte das gesamte Projekt ein. Verwende das vorhandene Repo als Quelle der Wahrheit; ändere nicht Life RPG, Schulcockpit oder Kotoba Quest.

## Ziel und Kontext

Entwickle eine **wirklich bedienbare, deutschsprachige Aufgaben-PWA**, die sich in Layout, Navigation und zentralen Interaktionen eng an Todoist orientiert. Die Nutzerin entwickelt mit ChatGPT/Codex und programmiert nicht selbst; einfache Einrichtung und eine überprüfbare Live-Vorschau sind wichtig.

**Produktprinzip:** Aufgaben dürfen freiwillig geplant werden. Ein geplanter Arbeitstag (`scheduledDate`) ist unabhängig von einer tatsächlichen Deadline (`deadlineDate`). Kein automatisches, ungefragtes Umplanen. Langfristig soll eine optionale Bakugo-/Kirishima-artige Companion-Ebene möglich sein, aber **nicht in diesem Auftrag**.

Lege im Repo die Dateien `README.md`, `PRODUCT_SPEC.md` und ein knappes `AGENTS.md` mit diesen Prinzipien an. Wenn diese Dokumente bereits existieren, erhalte sie und ergänze nur bei Bedarf. Arbeitsname: **Task Companion**; vorläufiger Repo-Name `task-companion`.

## Technischer Rahmen

- Vite + React + TypeScript, wartbare Komponenten, wenige gezielte Abhängigkeiten, z. B. `lucide-react` für Icons.
- Responsive Desktop-/Smartphone-UI; helle, ruhige, kompakte Todoist-artige Ästhetik mit linker Seitenleiste, klaren Aufgabenzeilen und dezenten Rotakzenten. Keine kopierten Logos, Wortmarken, Grafiken, geschützten Assets oder Todoist-Quelltexte.
- Keine Backend-/Firebase-/Todoist-Verbindung in diesem Auftrag. Lokale Persistenz über einen austauschbaren Repository-Adapter; Datenmodell versionieren und keine Daten stillschweigend löschen.
- Basis-PWA mit Manifest, eigenem einfachen Icon und Offline-App-Shell. Push-Benachrichtigungen **noch nicht** implementieren oder suggerieren.
- UI auf Deutsch; Formatierung und Tests mit lokalen Kalenderdaten, beispielsweise Europe/Berlin. Date-only-Felder als `YYYY-MM-DD` behandeln, ohne UTC-Verschiebung.

## Umzusetzende Funktionen

1. **Navigation:** Eingang, Heute, Anstehend und selbst erstellte Projekte in einer einklappbaren Seitenleiste. Wechsel per Klick, aktive Auswahl erkennbar. Mobile alternative Navigation. Browser-Navigation/Back sinnvoll unterstützen.
2. **Aufgabenlisten:** Kompakte Todoist-ähnliche Zeilen mit klickbarem Abschlusskreis, Prioritätsdarstellung, Titel, optionaler Beschreibungszeile und unterscheidbaren Datumsinformationen. Klick auf Zeile öffnet einen funktionsfähigen Editor/Detaildialog.
3. **Aufgabenbearbeitung:** Anlegen (inkl. globaler Schnellerfassung), Titel, Beschreibung, Projektzuordnung, Priorität P1–P4, geplanter Tag und separate Deadline setzen/ändern/entfernen; Aufgabe abschließen, unmittelbar rückgängig machen, bearbeiten und nach Bestätigung löschen.
4. **Projekte:** Erstellen und umbenennen; Aufgaben zuordnen. Beim Löschen eines Projekts die darin liegenden Aufgaben **nicht** unbemerkt löschen – sichere Bestätigung und explizite Option zum Verschieben in den Eingang.
5. **Heute/Anstehend:** „Heute“ zeigt heute geplante und überfällige geplante Aufgaben; Deadline-heute/-überfällig ohne Planung in einer **getrennten** Gruppe, ohne `scheduledDate` zu setzen. „Anstehend“ zeigt die nächsten 7 Tage nach geplanten Tagen gruppiert. Eine flexible Aufgabe ohne geplanten Tag und ohne fällige Deadline wird nicht ungefragt unter „Heute“ einsortiert.
6. **Wöchentliche Routine:** Bei einer Aufgabe optional „jede Woche am [Wochentag]“ wählen. Abschluss protokollieren und nächsten passenden Wochentag nach dem Abschlusstag setzen. Stabile Aufgaben-ID beibehalten, Abschluss-Historie erhalten und Undo unterstützen. Keine doppelten Abschlüsse durch Doppelklick.
7. **Sichere lokale Speicherung:** Aufgaben, Projekte und Abschluss-Historie behalten ihren Zustand beim Neuladen. Datenmodell mit `schemaVersion`, stabile IDs und sichere Lesefehler-Behandlung. JSON-Export und validierter JSON-Import mit deutlicher Bestätigung vor Ersetzen. Kein stiller Datenreset.
8. **Bedienbarkeit:** `Q` öffnet globale Schnellerfassung (sofern nicht gerade getippt wird), Enter speichert, Escape schließt/abbricht. Tastaturfokus, sichtbare Focus-States, sinnvolle aria-Labels, ausreichend große Touch-Ziele. Keine klickbaren Attrappen.
9. **Leerzustände:** Hilfreiche deutsche Empty States; keine echten persönlichen oder schulischen Daten als Demo. Keine künstlich voreingespielten Aufgaben in den echten Speicher.

## Datenmodell

Mindestens `Task` mit stabiler ID, Titel, Beschreibung, `projectId | null`, Priorität 1–4, `scheduledDate | null`, `deadlineDate | null`, optionaler wöchentlicher Wiederholungsregel, `completedAt | null`, Zeitstempeln. `Project` mit ID, Name, Farbe. Wiederkehrende Abschlüsse separat als eindeutig identifizierte `CompletionEvent`s erfassen, damit Historie und Undo konsistent bleiben.

Trenne UI, Datums-/Wiederholungslogik und Persistenz; keine monolithische Datei. Bereite eine spätere Firebase-Anbindung durch klare Adaptergrenzen vor, baue sie aber jetzt **nicht** ein.

## Explizit nicht Teil dieses Auftrags

Kein Companion, keine Bakugo-/Kirishima-Grafiken, keine Life-RPG-Integration, keine KI-API, kein automatisches Tagesplanning, keine Push-Erinnerungen, kein Cloud-Sync, kein Kalenderimport, keine Todoist-Importfunktion, kein komplexer Regelparser, keine unnötigen Filter-, Team- oder Gamification-Features. Keine inaktiven Fake-Buttons dafür zeigen.

## Tests und Qualitätsnachweise

Richte ausführbare Build-/Testbefehle ein und teste mindestens:

- Aufgabe im Eingang erstellen → erscheint dort → nach Reload noch da.
- Projekt anlegen → Aufgabe verschieben → im Projekt sichtbar, im Eingang nicht.
- Geplant morgen, Deadline in fünf Tagen → Felder getrennt erhalten und korrekt dargestellt.
- Deadline heute ohne `scheduledDate` → eigene Deadline-Gruppe in Heute; Planung bleibt `null`.
- Flexible undatierte Aufgabe → nicht ungefragt unter Heute.
- Wöchentliche Montagsaufgabe anlegen → abschließen → nächsten Montag anzeigen; Historie korrekt; Undo stellt vorherigen Zustand wieder her.
- Doppelklick auf Abschluss → kein doppeltes Completion-Event.
- Export → validierter Import → Daten und IDs korrekt; ungültiger Import verändert nichts.
- Tastatur- und Smartphone-Navigation funktionieren; keine horizontalen Überläufe.

Nutze automatische Tests (z. B. Vitest/Testing Library) und führe Build, Typecheck und Tests aus. Wenn eine echte Browser-Vorschau verfügbar ist, prüfe sie zusätzlich auf Desktop-/Mobile-Breite. Keine Tests als ausgeführt melden, die du nicht tatsächlich ausgeführt hast.

## GitHub und Auslieferung

- Branch erstellen, implementieren, committen, pushen, PR gegen `main` öffnen.
- CI-Workflow für Build/Tests nach Möglichkeit ergänzen. Wenn alle Checks erfolgreich sind und es zulässig ist, selbstständig mergen; ansonsten PR und den erforderlichen Schritt nennen.
- Eine möglichst einfache **kostenlose** Preview/Deployment-Strecke vorbereiten (z. B. GitHub Pages, sofern das gewählte Repository/Account es unterstützt). Wenn eine einmalige manuelle Freischaltung in den Repository-Settings nötig ist, die exakten Schritte in `README.md` dokumentieren. Kein erfolgreiches Deployment behaupten, ohne die URL zu prüfen.
- Abschlussbericht: Was funktioniert, was fehlt bewusst noch, Tests/CI, PR-/Merge-Status, tatsächliche Live-URL oder konkreter noch nötiger Schritt.

**Abnahmekriterium:** Ich kann die App öffnen, mich wie in einer einfachen Todoist-Version bewegen, Aufgaben anlegen/planen/mit Deadline versehen/abhaken/wiederholen und nach einem Neuladen wiederfinden – ohne Cloud- oder Companion-Funktion zu benötigen. Weise sichtbar darauf hin, dass v0.1 nur lokal speichert und noch keine zuverlässigen Erinnerungen oder geräteübergreifende Synchronisation bietet.

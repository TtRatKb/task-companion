# Codex-Auftrag 02 — Task Companion v0.2: flexible Wiederholungen & intelligente Schnellerfassung

## Grundlage und Ziel

Implementiere die folgenden **zwei** zusammenhängenden Verbesserungen im vorhandenen Repository `TtRatKb/task-companion`. Lies `AGENTS.md`, `PRODUCT_SPEC.md`, den aktuellen `main`-Code und die Tests, bevor du etwas änderst. Bestehende Daten dürfen weder verloren gehen noch zurückgesetzt werden.

**Benutzerziel:** Eine Aufgabe wie „WebUntis eintragen jeden Wochentag #P2“ wird **einmal** angelegt und erscheint montags bis freitags. Aufgaben sollen in der Liste schnell wie bei Todoist als Text eingegeben werden können; passende Angaben für Datum, Deadline, Priorität und Wiederholung werden automatisch erkannt, vor dem Speichern sichtbar und korrigierbar.

**Nicht** in diesem Auftrag: Cloud-Sync, Push, KI, Companion, Life RPG, Schulkalender-Integration, Ferienautomatik, kollaborative Funktionen, exakte Kopie von Todoist-Assets.

## A. Flexible Wiederholungen

Die aktuelle Implementierung unterstützt in `src/types.ts` nur `{kind:'weekly', weekday}`; `src/domain.ts` setzt beim Abschluss immer den nächsten einzelnen Wochentag, und `src/components/TaskEditor.tsx` bietet nur eine Einzelauswahl. Behebe das als zusammenhängende, rückwärtskompatible Erweiterung.

1. Wiederholungsoptionen in UI:
   - Keine
   - Jeden Tag (Mo–So)
   - Jeden Wochentag (Mo–Fr)
   - Jedes Wochenende (Sa/So)
   - Jede Woche am ausgewählten einzelnen Tag
   - Benutzerdefinierte Kombination beliebiger Wochentage (z. B. Mo+Mi+Fr)
   - Optional: Label „Jeden Schultag“ als Alias für Mo–Fr, deutlich ohne Ferienkalender. **Keine** automatische Auslassung von Ferien/Feiertagen vortäuschen.
2. Erstelle ein klares, testbares Regelmodell, etwa `recurrence: null | { kind:'weekdays'; weekdays: Weekday[] }`. Für interne Presets dürfen dieselben Wochentagssätze genutzt werden. Wochentage validieren, sortieren und Duplikate entfernen.
3. **Bestehende lokale Daten müssen erhalten bleiben!** Das derzeit gespeicherte `schemaVersion:1` mit `{kind:'weekly',weekday}` automatisch und idempotent in neues Schema migrieren (z. B. v2) – bei `load()` sowie JSON-Import. Historische `CompletionEvent`s, Projekt-IDs, Aufgaben-IDs, Deadlines und andere Felder erhalten. Fehlgeschlagene Migrationen dürfen niemals lokalen Speicher überschreiben. Auch Backups der alten Version akzeptieren; keine stillschweigenden Resets.
4. Abschluss einer wiederkehrenden Aufgabe:
   - Ein einziges, stabiles Task-Objekt bleibt bestehen; keine gesonderten täglichen Aufgaben erstellen.
   - Das nächste Vorkommen ist **streng nach dem lokalen Abschlusstag** die nächste erlaubte Wochentags-Kombination (z. B. Mo→Di, Fr→Mo; Sa→So beim Wochenende).
   - Überfällige Routine bei späterem Abschluss: nächsten erlaubten Tag **nach dem tatsächlichen Abschlusstag** berechnen; keine künstliche Nachholkaskade.
   - Doppelklick oder mehrfaches schnelles Abschließen am selben lokalen Tag darf **kein zweites Completion-Event** und keine doppelte Verschiebung auslösen. Bisher ist bei wiederkehrenden Aufgaben `completedAt` null; dieser Fehler muss explizit behoben werden. Eine mehrfache echte tägliche Routine darf erst am nächsten gültigen Auftreten erneut abgeschlossen werden.
   - „Rückgängig“ stellt die vorherige Aufgabe samt vorigem Planungsdatum wieder her und annulliert das richtige Ereignis. Bei älteren Ereignissen keine gefährliche Rückabwicklung nach neueren Abschlüssen erlauben.
   - Eine bewusst gesetzte Deadline bleibt fachlich von `scheduledDate` getrennt. Sie wird bei der Wiederholung **nicht ungefragt verschoben**. UI soll klarmachen, dass die Deadline nicht automatisch periodisch mitwandert.
5. Darstellungen in `TaskList` und `TaskEditor`: „Jeden Wochentag“, „Jedes Wochenende“, „Jeden Montag und Mittwoch“ bzw. entsprechende kompakte Labels verständlich anzeigen.

## B. Schnellerfassung wie bei Todoist – inline und mit Parser

Die aktuelle Schaltfläche „Aufgabe hinzufügen“ in `src/App.tsx` öffnet immer das große modale `TaskEditor`-Formular. Dieses soll beim **Erstellen** durch eine kompakte Inline-Schnellerfassung ersetzt/ergänzt werden:

1. Im Eingang direkt unter der Aufgabenliste beim Klick auf „Aufgabe hinzufügen“ ein fokussiertes einzeiliges oder mitwachsendes Textfeld anzeigen, ohne Seitenwechsel und ohne großes Modal. Enter speichert, Escape schließt ohne Änderung. Für weitere Details optional eine Schaltfläche „Weitere Einstellungen“, die den normalen Editor erreicht. Bestehende Aufgaben bearbeiten weiterhin im normalen Editor. Globales Tastaturkürzel `Q` öffnet dieselbe Schnellerfassung, wenn nicht in anderem Eingabefeld getippt wird. In Projekten vorbelegtes Projekt, bei „Heute“ nicht ungefragt ein geplantes Datum setzen.
2. Entwickle einen **reinen, separat testbaren deutschen Parser**, z. B. `parseQuickTask(input, referenceDate)`, ohne externe KI/Service-Calls. Er erkennt deterministisch und kombiniert:
   - `#P1`, `#P2`, `#P3`, `#P4` (case-insensitive) als Priorität; normale P-Werte ebenfalls optional, sofern eindeutig.
   - `heute`, `morgen`, `am Montag` … `am Sonntag`, `am 12.11.`, `am 12.11.2026` als **geplanten Tag**, sofern in einem zeitlichen Befehl bzw. klarer Position verwendet.
   - `bis Freitag`, `bis zum 12.11.`, `bis 12.11.2026` als **Deadline**, unabhängig von geplanter Zeit.
   - `jeden Tag`, `jeden Wochentag`, `jeden Schultag` (Alias Mo–Fr, ohne Ferienlogik), `jedes Wochenende`, `jeden Montag`, `jeden Montag und Mittwoch` und weitere eindeutige Kombinationen (beliebige Wochentage) als Wiederholungsregel.
   - Optionale Kurzformen der Wochentage (z. B. `Mo`, `Di`) nur wenn eindeutig; kein unbedachtes Entfernen von normalen Titelwörtern.
3. Jeder erfolgreich erkannte Token-/Phrasenabschnitt soll nur aus dem finalen Titel entfernt werden, **wenn er eindeutig interpretiert wurde**. Ungültige, unvollständige, widersprüchliche oder unbekannte Ausdrücke bleiben Text und werden NICHT stillschweigend gelöscht. Beispiel „bis irgendwann“ ist kein gültiges Datum.
4. Bei Kombinationen hat `bis` Vorrang für **Deadline** und `am` für **Planung**. `jeden Montag` ist Wiederholung, nicht zusätzlich ein unverknüpftes Planungsdatum: Beim ersten Erstellen einer Routine beginnt die Serie am nächsten passenden Termin einschließlich heute. Das kann später manuell geändert werden.
5. **Kalenderdaten korrekt behandeln** (Europe/Berlin, keine UTC-Verschiebungen, Monats-/Jahreswechsel, Schaltjahr). Ungültige Datumsangaben wie `31.02.` nicht übernehmen. Bei fehlendem Jahr das nächste sinnvolle Vorkommen verwenden und als konkretes Datum sichtbar machen; keine unmarkierte Interpretation einer mehrdeutigen Angabe. Die Parser-Funktion muss ein festes Referenzdatum für Tests akzeptieren.
6. **Live-Vorschau / editierbare Chips** für erkannte Angaben (z. B. „Mo–Fr“, „Priorität 2“, „Geplant: Mo, 09.11.“, „Deadline: Do, 12.11.“). Nutzerin kann jede automatisch erkannte Eigenschaft einzeln verändern/entfernen; die Änderung darf nicht bei jedem weiteren Tastenanschlag ungefragt zurückgesetzt werden. Falls nötig über gezielten Bearbeitungsmodus oder klaren manuellen Override lösen.
7. Der gespeicherte Titel enthält keine erkannten Steueranweisungen. Bei leerem Titel keine Aufgabe speichern. Keine Duplikate bei Doppelsubmit und keine falsch gespeicherten Aufgaben nach Esc.
8. Parser und Inline-Erfassung nicht mit dem vorhandenen normalen Bearbeitungsdialog vermischen: klare Komponenten-/Modultrennung. Änderungen an Aufgaben über den normalen Editor sollen ihre gespeicherten Attribute erhalten.

## C. Qualität, Datenintegrität, Tests

Prüfe und ergänze automatische Tests zu:

- Alte v1-Aufgabe mit `weekly/weekday` und alten CompletionEvents laden/importieren → v2 mit gleichem Inhalt, gleicher ID, nächster Termin korrekt.
- Lokal gespeicherte alte Aufgaben bestehen nach Reload/Migration weiter; ungültiger Import überschreibt keine Daten.
- Wiederholung Mo–Fr: Montag→Dienstag und Freitag→Montag.
- Wochenende: Samstag→Sonntag und Sonntag→Samstag.
- Benutzerdefiniert Mo+Mi+Fr: Mittwoch→Freitag und Freitag→Montag.
- Bereits überfällige Wochentags-Routine wird nach realem Abschlusstag fortgesetzt.
- Zwei schnelle Klicks auf dieselbe wiederkehrende Aufgabe am selben Tag → exakt ein Abschlussereignis; Undo korrekt.
- Kombination `Elternbrief schreiben am Dienstag bis Donnerstag #P2` → reiner Titel + getrennte Planung/Deadline/Priorität.
- `WebUntis eintragen jeden Schultag #P2` → eine Aufgabe mit Wochentagsregel und Starttermin; keine Ferienautomatik.
- Ungültiges Datum, mehrdeutige Tokens und freie Titelwörter bleiben erhalten, keine stille Fehldeutung.
- Enter/Escape, Q, Inline-Fokus und mobile Darstellung (ohne horizontale Überläufe); Projektzuordnung bleibt korrekt.
- Build, Typecheck, Vitest und sinnvolle UI-Tests; zusätzlich gegebenenfalls manuelle Desktop-/Mobile-Browserprüfung.

## D. Umsetzung/Veröffentlichung

1. Entwickle auf neuem Feature-Branch, ändere nur betroffene Module und notwendige Tests; bewahre vorhandene UX und Daten.
2. Dokumentiere die neuen Regeln in `PRODUCT_SPEC.md` und `README.md` (Status/Migration). Halte `AGENTS.md` knapp.
3. Führe Tests/Build tatsächlich aus, berichte präzise.
4. Commit/Push, PR gegen `main`, erfolgreich geprüften PR möglichst selbstständig mergen. **Wenn die Codex-Umgebung erneut `GH_TOKEN`-Fehler hat, nicht wieder vom Nutzer verlangen, einen PR manuell zu erstellen:** Commit+Push im Branch sicherstellen, Branchname und konkreten Blocker nennen. Die Nutzerin kann dann ChatGPT mit GitHub-Verbindung bitten, PR/Merge und Deployment zu übernehmen.
5. Deployment nach `main` über bestehendes GitHub-Pages-Workflow prüfen; echte URL https://ttratkb.github.io/task-companion/ nicht als erfolgreich melden, bevor der Deploy-Job grün ist.

## Abnahme-Beispiele (benutzbare Schreibweise)

- `WebUntis eintragen jeden Wochentag #P2` → Titel `WebUntis eintragen`; tägliche Routine Mo–Fr; Priorität 2.
- `Elternbrief schreiben bis Freitag #P1` → Titel `Elternbrief schreiben`; Deadline Freitag; **kein geplanter Tag**.
- `Unterricht vorbereiten jeden Montag` → wöchentlich montags, eine einzige Aufgabe.
- `Müll rausbringen jedes Wochenende` → Samstag und Sonntag.
- `Material drucken am Montag bis Donnerstag` → am Montag planen, Deadline Donnerstag.
- `Korrektur jeden Dienstag und Freitag` → eine Aufgabe, jeweils Di und Fr.

Die Anwendung plant nichts ohne Zustimmung um; die Vorschau der Schnellerfassung muss jederzeit nachvollziehbar sein.

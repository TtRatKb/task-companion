# Task Companion — Codex-Regeln

Eigenständige deutschsprachige Todoist-inspirierte Aufgaben-PWA. Lies `PRODUCT_SPEC.md` und den aktuellen Auftrag; bestehender `main`-Stand ist maßgeblich.

## Produkt
- Schnelle, vertraute, kompakte Todoist-artige Bedienung; keine Todoist-Logos, Assets oder kopierter Produktcode.
- `scheduledDate` (geplant), `deadlineDate` (letzter Termin) und spätere Reminder **immer getrennt** behandeln. Nie ungefragt umplanen.
- Verlässlichkeit vor Extras; keine Streaks, Schuldmechaniken, Gamification oder Companion-Features ohne Auftrag.
- Deutsche UI, responsive Desktop/Mobile, gute Tastaturbedienung und zugängliche Controls.

## Technik & Daten
- React, TypeScript, Vite; kleine Module, klare Datentypen, Tests für Datums-/Wiederholungslogik.
- Stabile IDs, versioniertes Datenmodell, idempotente Migrationen; keine Daten löschen/zurücksetzen. Persistenzänderungen benötigen Backup/Undo oder sichere Migration.
- Kalenderdaten `YYYY-MM-DD` als lokale Tage behandeln; keine UTC-Tagesverschiebungen. Zeitzone Europe/Berlin für Beispiele.
- Lokale Version klar als nicht geräteübergreifend kennzeichnen. Keine Push-/Sync-Zuverlässigkeit behaupten, bevor sie tatsächlich implementiert und getestet ist.
- Keine realen persönlichen Daten, Tokens oder Secrets in Code, Repo, Logs, Screenshots oder Tests.
- Life RPG ist *nicht* Speicherort der Aufgaben; spätere Integrationen nur als klar getrennte Events/Schnittstellen.

## GitHub-Arbeitsweise
1. Änderungsumfang begrenzen; vor Änderungen relevante Dateien und Tests prüfen.
2. Auf Feature-Branch arbeiten, committen, Tests/Build ausführen und den Branch nach GitHub pushen.
3. Sofern GitHub-Authentifizierung funktioniert, PR gegen `main` öffnen, CI prüfen und nach erfolgreichen Prüfungen selbstständig mergen.
4. **Bekanntes Codex-Umgebungsproblem:** `GH_TOKEN` ist bei Codex wiederholt ungültig (`GitHub GraphQL: Forbidden`), obwohl Git-Push klappt. Bei diesem Fehler **keine manuelle PR-Erstellung oder Merge-Aktion von der Nutzerin verlangen**. Nur den gepushten Branch samt Head-SHA, Testresultaten und Fehler kurz melden und für PR, Merge und Deployment an die separate GitHub-Verbindung des ChatGPT-Gesprächs übergeben. Keine geheimen Tokens ausgeben oder zur Umgehung abfragen. Nicht behaupten, ein PR oder Merge sei erfolgt, wenn nur ein Push möglich war.
5. Remote-`main`, CI und tatsächliches GitHub-Pages-Deployment separat verifizieren; keine ungeprüften Erfolgsmeldungen. Keine erzwungenen Merges bei Fehlern oder Konflikten.

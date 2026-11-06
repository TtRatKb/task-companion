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
2. Auf Branch arbeiten, committen, pushen, PR gegen `main` erstellen.
3. Build, Tests und verfügbare CI prüfen; Fehler beheben, nichts überspringen.
4. Nach erfolgreichen Prüfungen selbstständig mergen, sofern das Repository es erlaubt. Andernfalls PR-Link und verbleibende manuellen Schritte nennen.
5. Remote-`main` und ggf. tatsächliches Deployment getrennt verifizieren; keine ungeprüften Erfolgsmeldungen.

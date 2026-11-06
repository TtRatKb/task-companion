# Task Companion — Projektstart

**Arbeitsname:** Task Companion  
**Repository:** `TtRatKb/task-companion`  
**Stand:** 06.11.2026  
**Status:** Projektgrundlage auf `main`; Anwendung noch nicht implementiert

Task Companion ist eine eigenständige, deutschsprachige, mobile und desktopfähige Aufgaben-PWA. In der ersten Phase soll sie sich in Aussehen, Navigation und Bedienlogik eng an Todoist orientieren, ohne dessen geschützte Logos, Illustrationen, Produktnamen oder Code zu kopieren.

## Produktziel

Ein verlässlicher Ort, an dem Verpflichtungen erfasst, bewusst geplant und rechtzeitig wiedergefunden werden. Die Nutzerin entscheidet selbst, wann sie Aufgaben erledigt. Die App unterscheidet strikt zwischen:

- **Geplant:** Wann die Aufgabe bearbeitet werden soll (`scheduledDate`).
- **Deadline:** Bis wann sie spätestens erledigt sein muss (`deadlineDate`).
- **Erinnerung:** Wann ein aktiver Benachrichtigungsversuch stattfinden soll (späterer Meilenstein).

Eine Deadline verschiebt niemals automatisch den geplanten Arbeitstag. Flexible Aufgaben ohne geplanten Tag bleiben sichtbar, ohne ungefragt in „Heute“ geschoben zu werden.

## Projektdateien

- `PRODUCT_SPEC.md` — Produktvision, Architektur, Bedienprinzipien, Datenmodell, Roadmap und Grenzen.
- `AGENTS.md` — knappe, dauerhafte Regeln für Codex.
- `CODEX_TASK_01.md` — vollständig formulierter erster Auftrag an Codex.

## Nächster Entwicklungsschritt

1. In Codex das Repository `TtRatKb/task-companion` und den Branch `main` auswählen.
2. Codex beauftragen, `CODEX_TASK_01.md` unter Beachtung von `AGENTS.md` und `PRODUCT_SPEC.md` umzusetzen.
3. Codex soll einen Feature-Branch erstellen, die erste funktionierende Anwendung entwickeln, Tests ausführen, einen Pull Request erstellen und bei erfolgreichen Checks nach Möglichkeit mergen.
4. Erst nach funktionsfähiger, getesteter Version die Anwendung mit echten Aufgaben ausprobieren. **Version 0.1 hat nur lokale Speicherung und ist kein verlässlicher Ersatz für Todoist über mehrere Geräte hinweg.**

Die Projektdokumente sind die verbindliche Grundlage. Spätere Änderungen sollen versioniert statt stillschweigend angepasst werden.

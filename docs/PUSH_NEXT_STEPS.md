# Nächster Schritt: echter Hintergrund-Push für Task Companion

Stand: 06.11.2026 · Noch **nicht aktiviert**.

## Was v0.5 bereits kann

- Deadline-Erinnerungen als native Browserbenachrichtigung, **solange die Web-App tatsächlich läuft**.
- Gerätespezifische, freiwillige Erlaubnis und Zeitwahl (7, 3, 1 oder 0 Tage vorher).
- Einmaliges Auslösen pro Aufgabe + Deadline + Vorwarnstufe im jeweiligen Browser.
- Reine Leselogik – weder Deadlines noch bestehende Cloud-Daten werden durch Erinnerungen verändert.
- Keine Benachrichtigungsversprechen für vollständig geschlossene App, ausgeschaltete Geräte oder blockierte Browsersysteme.

## Warum GitHub Pages allein keine geschlossene App erinnern kann

Eine statische Website besitzt keinen ständig laufenden Server-Timer. Bei vollständig geschlossener App muss ein externer Dienst zum fälligen Zeitpunkt Nachrichten senden, die der Browser-Service-Worker über die Web-Push-API empfängt.

Offizielle Grundlagen:
- Firebase Cloud Messaging im Web: https://firebase.google.com/docs/cloud-messaging/web/get-started
- Firebase geplante Funktionen / Cloud Scheduler: https://firebase.google.com/docs/functions/schedule-functions
- Firebase Tarifpläne und Cloud Functions: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- WebKit Web Push für installierte iOS-PWAs: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

## Geplanter vollständiger Funktionsumfang

1. **Benutzerseitige Einrichtung:** Öffentliche Firebase-Web-Push-VAPID-Kennung hinterlegen, aktiven Service Worker der bestehenden Vite-PWA ergänzen (nicht parallel registrieren), Benachrichtigungsberechtigung nur nach Klick erfragen. Geräte-Registrierung mit per-UID-Sicherheitsregeln in einem eigenen Firestore-Unterpfad speichern.
2. **Serversichere Berechnung:** Geplante Firebase Function oder anderer Cron-Worker prüft nach deutschem Kalenderdatum in definierter Frequenz per User und Gerät die gewählten Erinnerungsregeln. Der Versand berücksichtigt Zeitfenster und dedupliziert stabil (Task-ID, Deadline, Warnstufe, Gerät); abgeschlossene oder gelöschte Aufgaben werden nicht erinnert.
3. **Zustellung:** Firebase Cloud Messaging sendet Web-Push an die Geräte. Browser- und iOS-Home-Screen-Beschränkungen beachten; für mobile Apple-Geräte muss die PWA installiert sein. Keine geheimen Service-Account-Keys im Frontend oder GitHub speichern.
4. **Sichtbarkeit und Kontrolle:** Geräte in Einstellungen aktivieren/deaktivieren, Vorschau der nächsten Erinnerung, Test-Nachricht, klare Fehlermeldung bei nicht erreichbaren/abgelaufenen Tokens, möglicherweise Zustellungsstatus. Keine Werbung und keine unnötigen Benachrichtigungen.
5. **Tests vor Freigabe:** Mac Firefox, installiertes Desktop-PWA-Icon und ggf. iPhone/Android. Besonders App geschlossen, Gerät im Standby, neue Deadline, Änderung oder Abschluss kurz vor Auslösung, Synchronisierung und Sommerzeit testen.

## Kosten und Freigabe

Die Firebase-Cloud-Functions-Infrastruktur setzt bei der üblichen Einrichtung den **Blaze-Tarif mit aktiver Abrechnung** voraus. Ein Scheduler-Job kostet bei Überschreitung der freien Kontingente Geld; derzeit sind bei Cloud Scheduler drei Jobs pro Abrechnungskonto ohne Job-Gebühr enthalten, aber Funktions- oder weitere Nutzung kann zusätzlich Kosten verursachen.

**Keine automatische Tarifänderung, Aktivierung kostenpflichtiger Dienste, Secrets-Erstellung oder Server-Deployment ohne ausdrückliche Zustimmung der Nutzerin.** Vor der Implementierung ist eine tatsächliche Kostenprüfung und die Wahl einer Lösung ohne unerwartete laufende Gebühren erforderlich.

Bis dahin bleibt das Deadline-Radar die verlässliche In-App-Erinnerung. Die lokale v0.5-Option ist eine Ergänzung, kein Ersatz für echten Hintergrund-Push.

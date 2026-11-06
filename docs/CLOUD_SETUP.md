# Task Companion — Cloud-Synchronisation einrichten

Stand: 2026-11-06. Feature: v0.3, **optional**, unabhängig von der lokalen Aufgabenverwaltung.

## Was bereits im Code vorhanden ist

- Dieselbe **öffentliche Web-App-Konfiguration** und dasselbe Firebase-Projekt wie Life RPG: `life-rpg-3afb7`. Die Google-Anmeldung funktioniert über die bestehende Firebase Authentication, sofern diese den Domainnamen zulässt.
- **Kein gemeinsamer Life-RPG-Spielstand**: Task Companion schreibt ausschließlich in `users/{uid}/taskCompanion/state`. Die Life-RPG-Speicherpfade `users/{uid}/saves/current` bleiben unverändert.
- Eigene Cloud-Daten im Schema `{revision, data, updatedAt}`, wobei `data` das Task-Companion-`AppData`-Objekt ist.
- **Lokale Speicherung bleibt immer aktiv.** Erst nach Google-Anmeldung und ausdrücklicher Entscheidung, welche Daten beim erstmaligen Verbinden gelten, wird eine Cloud-Datei angelegt bzw. übernommen.
- Lokal nicht synchronisierte Änderungen werden beim nächsten Kontakt über eine Transaktion mit Revisionsvergleich hochgeladen. Werden dieselben Cloud-Daten zwischenzeitlich auf einem anderen Gerät geändert, wird **nicht überschrieben**, sondern ein Konflikt angezeigt.
- Bei Wechsel von lokal ↔ Cloud wird vor dem Ersetzen eine zusätzliche lokale Wiederherstellungskopie angelegt. Die Kopie ist in Einstellungen herunterladbar; JSON-Export und -Import bleiben erhalten.
- Firebase kann offline oder durch Browserschutz blockiert sein; die Aufgabenverwaltung funktioniert trotzdem lokal weiter, ein Cloud-Status weist auf ungesicherte Änderungen hin.

**Wichtig:** Diese neue App verwendet die **bestehende** Firestore-Datenbank und soll *keine neue* Firestore-Datenbank erstellen. Eine zweite Datenbank ist möglicherweise nicht kostenlos.

## Einmalige Einrichtung durch Projektverantwortliche

Diese Schritte benötigen Rechte auf das Firebase-Projekt; sie können nicht über die hier verbundene GitHub-App erledigt werden.

### 1. Domain für Google-Anmeldung erlauben

1. <https://console.firebase.google.com/project/life-rpg-3afb7/authentication/settings>
2. Unter **Authorized domains / Autorisierte Domains** prüfen, ob `ttratkb.github.io` vorhanden ist. Wenn nicht, nur diesen Domainnamen hinzufügen (**ohne** `https://` und **ohne** `/task-companion/`).
3. Prüfen, dass in **Authentication → Sign-in method** Google als Anmeldemethode aktiviert ist (bei funktionierendem Life RPG normalerweise schon der Fall).

### 2. Firestore-Rechte für den zusätzlichen Task-Companion-Pfad setzen

1. <https://console.firebase.google.com/project/life-rpg-3afb7/firestore/rules>
2. **Bestehende Regeln zuerst vollständig sichern.** Die Regeln von Life RPG dürfen **keinesfalls** ersetzt, gelöscht oder pauschal durch `allow read, write: if true` ersetzt werden.
3. Innerhalb des bestehenden `match /databases/{database}/documents { ... }`-Blocks folgende Zusatzregel einfügen, ohne andere Regeln zu verändern:

```firestore
match /users/{userId}/taskCompanion/{documentId} {
  allow get, list: if request.auth != null
                   && request.auth.uid == userId
                   && documentId == 'state';
  allow create, update: if request.auth != null
                        && request.auth.uid == userId
                        && documentId == 'state'
                        && request.resource.data.keys().hasOnly(['revision', 'data', 'updatedAt'])
                        && request.resource.data.revision is int
                        && request.resource.data.revision >= 1
                        && request.resource.data.data is map;
  allow delete: if false;
}
```

4. **Publish/Veröffentlichen**. Firestore-Regeln werden serverseitig angewendet und sind nicht Teil der GitHub-Pages-Veröffentlichung.
5. Prüfen, dass für eine andere UID und für nicht angemeldete Nutzer:innen kein Lesen oder Schreiben von Task-Companion-Daten möglich ist. Bei breiteren bestehenden Firestore-Regeln muss außerdem geprüft werden, dass diese nicht versehentlich zusätzlichen Zugriff erlauben – Firestore-Mehrfach-Match-Regeln funktionieren als logisches ODER.

**Wichtig:** Das ist ein zusätzlicher Schutz für den neuen Pfad; bestehende Life-RPG-Regeln zu ändern ist eine sensible Aktion. Wenn unklar ist, wo diese Regel einzufügen ist, statt blind zu kopieren die vorhandenen Regeln im Chat zur Überprüfung bereitstellen (keine Secrets).

### 3. Erste Anmeldung in Task Companion

1. <https://ttratkb.github.io/task-companion/> öffnen.
2. **Einstellungen → Daten & Einstellungen → Cloud-Synchronisation** öffnen.
3. **Mit Google verbinden** und das gewünschte Google-Konto auswählen.
4. Wenn noch keine Cloud-Aufgaben vorhanden sind: **Lokale Aufgaben in Cloud sichern**.
5. Wenn auf einem anderen Gerät bereits eine Liste vorhanden ist: Cloud-Version ausdrücklich übernehmen oder die lokale Version bewusst als neuen Stand verwenden. Bei der zweiten Option wird die bisherige Cloud-Version vorher lokal gesichert. Die App entscheidet nicht ungefragt.
6. Dasselbe Google-Konto auf dem zweiten Gerät verwenden. Aufgaben erscheinen dort nach Anmeldung und Bestätigung; anschließende Änderungen werden bei Verbindung automatisch abgeglichen.

## Daten und technische Grenzen

- Das ist eine konservative **gesamte-Datenbank-Synchronisation in einem Dokument** (Aufgaben + Projekte + Abschlussereignisse) mit Transaktionen und Konfliktauflösung, keine automatische feldweise Verschmelzung konkurrierender Änderungen. Ändern zwei Geräte ohne Abgleich gleichzeitig verschiedene Aufgaben, erscheint gegebenenfalls ein Konflikt – zum Schutz vor Datenverlust.
- Firestore-Dokumente haben eine Maximalgröße von **1 MiB**. Bei sehr großen Aufgabenbeständen müssen wir auf einzelne Dokumente je Aufgabe umstellen. Bei Schreibfehlern bleiben die lokalen Daten erhalten.
- Die App verwendet die Zeitzone Europe/Berlin für Aufgabenplanung; Cloud-Zeitstempel speichern lediglich Versionsinformationen.
- Regelmäßige **externe JSON-Exporte** bleiben wichtig. Ein Cloud-Sync ist kein Ersatz für unabhängige Backups, und automatische Firestore-Backups sind nicht Teil dieses kostenlosen Setups.
- Firebase SDK wird bei Nutzung aus dem versionierten Google-CDN geladen. **Kein zusätzlicher API-Schlüssel mit geheimen Rechten** wird im Repository gespeichert; die Web-App-Konfiguration von Firebase ist öffentlich und der eigentliche Zugriff muss über Auth + Security Rules abgesichert sein.
- Erinnerungen/Push sind weiterhin **nicht** enthalten.
- Der kostenlose Firestore-Standardtarif hat Nutzungsgrenzen; dadurch ist Kostenfreiheit bei gewöhnlicher persönlicher Nutzung realistisch, aber ohne Garantie für alle denkbaren Nutzungsprofile.

## Qualitätssicherung

- Tests für Reconciliation-Entscheidungen (gleich, neu, Cloud geändert, lokale Offline-Änderung, beidseitige Änderung, anderes Google-Konto).
- Prüfung auf zwei Geräten mit demselben Google-Konto, Verbindungsunterbrechungen, schnellem nacheinander Speichern, Tab-Wechsel und Abbruch einer Cloud-Konfliktentscheidung.
- Vor dem Umstieg von Todoist unbedingt einen echten End-to-End-Test und JSON-Export auf beiden Geräten durchführen.

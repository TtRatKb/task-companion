# Task Companion

Deutschsprachige, responsive Aufgaben-PWA mit getrennter Planung und Deadline, wöchentlichen Routinen, Undo und lokaler Speicherung.

## Direkt ausprobieren

    npm install
    npm run dev

Danach die angezeigte lokale URL öffnen. Produktionsnah: npm run build und npm run preview.

## Funktionen in v1.5

- Eingang, Heute, Anstehend (7 Tage), **Wochenplanung**, **Deadline-Radar**, **globale Suche** und eigene Projekte
- **Unteraufgaben/Checklisten** direkt an Aufgaben mit Fortschrittsanzeige, separaten Häkchen und Bearbeiten im Aufgabeneditor
- **Aufgabenvorlagen**: eigene Vorlagen erstellen, bearbeiten, löschen, als Checkliste aus bestehenden Aufgaben speichern und beliebig oft zu frischen Aufgaben machen
- **Platzhalter in Vorlagen**: z. B. `{Fach}`, `{Klasse}` und `{Thema}` in Titel, Beschreibung oder einzelnen Schritten; beim Verwenden einmal ausfüllen, live prüfen und anschließend Termine im normalen Editor setzen
- **Flexible Wiederholungen (v1.5)**: alle N Tage, Wochen oder Monate, Kalenderstart und Vorschau auf nächste Termine, auch in der Schnellerfassung; feste Rhythmen trotz verspäteter Erledigung
- **Suche & Schnellfilter (v1.4)**: Aufgaben, Notizen, Projekte, einzelne Unteraufgaben und Vorlagen durchsuchen; Status, Typ, Projekt und Priorität kombinieren; mit `/` oder `Strg/⌘ + K` öffnen
- **Unteraufgaben organisieren (v1.3)**: Schritte in Aufgaben und Vorlagen ziehen oder mit Pfeilbuttons sortieren, Checklisten ein-/ausklappen, Schritte zwischen Hauptaufgaben verschieben (Terminschutz und Rückgängig)
- **Heute-Fokus (v1.2)**: einzeln geplante Unteraufgaben werden direkt in Heute (einschließlich überfälliger Schritte) und Anstehend angezeigt und können separat abgehakt werden, mit Rückgängig und ohne doppelte Checkboxen
- **Visueller Vorlageneditor (v1.1)**: Hauptaufgabe und einzelne Checklisten-Zeilen statt eines Zeilen-Textfelds, Enter für neue Unteraufgaben, per Klick einsetzbare Syntaxbeispiele und dauerhaft sichtbare Kurzreferenz in breiten Desktop-Ansichten
- **Inbox-Turbo (v1.0)**: Eingang in einem fokussierten Tastaturdurchlauf sortieren – Projekt, Priorität, Arbeitstag und Deadline, speichern & nächste, überspringen ohne Datenverlust
- **Wochenplanung mit Zeitbudget**: geschätzte Minuten pro Aufgabe und Unteraufgabe, frei konfigurierbares Budget je Wochentag, Überlastungsanzeige und bequemes Verschieben per Datumsfeld
- **Rückwärtsplanung ab der Deadline**: Unteraufgaben können natürliche Zeitabstände wie `2 Wochen vorher`, `14 Tage vorher`, `1 Monat vorher` und `{Deadline} - 3 Tage` enthalten; sie werden einzeln geplant, ohne gleichmäßige Verteilung
- **Deadline ist der Tag, an dem alles bereits fertig sein muss**: letzter möglicher Fertigstellungstag ist der Vortag; Deadline-Radar und lokale Erinnerungen berücksichtigen das
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

### Inbox-Turbo – Eingang aufräumen (v1.0)

Im **Eingang** gibt es jetzt einen eigenen Knopf **„Eingang aufräumen“**. Er öffnet einen fokussierten Bearbeitungsmodus für die offenen Aufgaben ohne Projekt. Bei jedem Schritt siehst du genau eine Aufgabe. Du kannst ihr ein Projekt zuweisen, ihre Priorität ändern sowie einen Arbeitstag oder eine Deadline festlegen. **„Speichern & nächste“** übernimmt ausschließlich diese vier Angaben und öffnet sofort die nächste Eingangsaufgabe. **„Überspringen“** behält alles unverändert. Die Reihenfolge wird beim Start des Durchlaufs eingefroren – so taucht dieselbe Aufgabe in einer Sitzung nicht mehrfach auf.

**Tastenkürzel** (funktionieren, wenn gerade kein Formularfeld fokussiert ist):

- `1`–`4` – Priorität P1–P4 auswählen
- `H` / `M` / `W` – Arbeitstag auf heute / morgen / in sieben Kalendertagen setzen
- `0` – Arbeitstag entfernen
- `P` – Projektwahl fokussieren; `D` – Arbeitstag fokussieren; `L` – Deadline fokussieren
- `Enter` – speichern und zur nächsten Aufgabe; `S` – überspringen; `Esc` – Durchlauf schließen

Wenn du im Eingabefeld tippst, werden die Buchstabenkürzel nicht abgefangen. Einzelne bereits gespeicherte Änderungen bleiben auch bei Abbruch erhalten. **„Weiter ohne Änderung“** ist erlaubt, aber bedeutet nicht, dass die Aufgabe aus dem Eingang verschwindet: **Ohne Projektzuordnung bleibt sie dort sichtbar.** Der Modus markiert keine Aufgaben als erledigt und löscht oder verschiebt keine Unteraufgaben. Die Deadline bedeutet wie bisher: Am gewählten Tag muss die Aufgabe bereits fertig sein. Bei Planung am oder nach der Deadline fragt die App ausdrücklich nach.

Wenn eine Aufgabe während des Durchlaufs auf einem anderen Gerät geändert wurde, wird das erkannt: Der Modus überschreibt die geänderte Aufgabe nicht und fordert dich zur Prüfung auf. Cloud-Sync und alle bestehenden Datensicherungen bleiben unverändert; es gibt **keine zusätzliche Datenmigration**.

### Schnellerfassung

Mit Q oder „Aufgabe hinzufügen“ öffnet sich die Erfassung direkt in der Liste. **Enter speichert die Aufgabe und öffnet sofort das nächste leere, fokussierte Eingabefeld** – so lassen sich beliebig viele Aufgaben ohne Maus hintereinander erfassen. **Escape schließt** die Erfassung. `#P1` bis `#P4` (auch klein geschrieben) steuern die Priorität; die erkannte Priorität ist sofort in der Vorschau zu sehen und wird gespeichert. „Weitere Einstellungen“ öffnet den vollständigen Editor, auch wenn noch kein Titel eingegeben wurde. Beim Abbrechen bleibt die bisherige Schnelleingabe erhalten.

Beispiele:

- WebUntis eintragen jeden Wochentag #P2
- Elternbrief schreiben am Dienstag bis Donnerstag #P2
- Müll rausbringen jedes Wochenende
- Korrektur jeden Dienstag und Freitag

Erkannte Angaben erscheinen vor dem Speichern als editierbare Chips. „Jeden Schultag“ ist lediglich ein Alias für Montag bis Freitag; Ferien und Feiertage werden nicht automatisch berücksichtigt. Eine Deadline bleibt bei wiederkehrenden Aufgaben unverändert.

### Datenmigration

Beim Laden und Importieren werden v1-, v2-, v3-, v4- und v5-Daten automatisch in das aktuelle **v6-Datenmodell** mit Unteraufgaben und Vorlagen überführt. Frühere Wiederholungen werden dabei weiter unterstützt, und Aufgaben-, Projekt- und Ereignis-IDs bleiben erhalten. Eine fehlgeschlagene Migration überschreibt den lokalen Speicher nicht. Vor einem Import ist weiterhin eine ausdrückliche Bestätigung erforderlich.

## Flexible Wiederholungen (v1.5)

Im vollständigen Aufgabeneditor findest du unter **Wiederholung** drei neue Optionen: **Alle N Tage**, **Alle N Wochen** und **Alle N Monate**. Gib den Abstand selbst ein (1–999), lege den **ersten Arbeitstag** unter „Geplant“ fest und kontrolliere die Vorschau der folgenden Termine. Die bisherigen Wiederholungen an frei kombinierten Wochentagen funktionieren unverändert.

Du kannst die Wiederholung auch direkt in der **Schnellerfassung** angeben, beispielsweise:

- `Klassenbuch kontrollieren alle zwei Wochen #P2`
- `Materialbestand prüfen alle 3 Tage`
- `Monatsbericht jeden Monat am 15.`
- `Dienstbesprechung alle 2 Wochen am Dienstag`

**Kalenderfeste Wiederholung:** Die neuen Intervalle richten sich am ursprünglich gewählten Startdatum aus, **nicht** am tatsächlichen Tag der Erledigung. Wenn eine zweiwöchentliche Aufgabe zu spät erledigt wird, springt sie zum nächsten passenden geplanten Datum, ohne verpasste Durchläufe aufzuhäufen. Ein Monatsrhythmus am 31. wird bei kürzeren Monaten auf den Monatsletzten gesetzt, kehrt aber später zum 31. zurück (31. Januar → 28./29. Februar → 31. März). Wird das Startdatum im Editor ausdrücklich geändert, beginnt der Rhythmus von diesem neuen Datum aus.

**Wichtig:** Beim Abschließen einer wiederkehrenden Aufgabe werden die Häkchen ihrer Unteraufgaben wie bisher zurückgesetzt. Eine separat eingetragene **Deadline und individuelle Unteraufgabentermine werden nicht automatisch verschoben**; das wird im Editor zusätzlich angezeigt. Die Deadline bedeutet weiterhin, dass die Aufgabe am angegebenen Datum bereits fertig sein muss. So findet keine ungewollte Terminänderung statt.

Das Speicherformat wird zu **Schema v6** erweitert. Vorhandene Aufgaben, Vorlagen, Checklisten, Wochentag-Regeln und Cloud-Inhalte aus Schema v1–v5 werden übernommen. Die Validierung verhindert, dass ältere App-Versionen diese neuen Wiederholungsangaben unbemerkt verwerfen. **Aktualisiere Task Companion deshalb auf allen Geräten**, bevor du dort weiterarbeitest. Es gibt keine neue Firebase-Konfiguration und keinen kostenpflichtigen Dienst.

## Globale Suche & Schnellfilter (v1.4)

Über **Suche** in der Seitenleiste, den Suchbutton oben oder mit dem Tastenkürzel **`/` bzw. `Strg/⌘ + K`** erreichst du eine neue zentrale Suchansicht. Das Kürzel funktioniert, solange kein Bearbeitungsdialog geöffnet ist; das einzelne `/` wird in Textfeldern nicht abgefangen.

Die Suche durchsucht **Aufgabentitel, Beschreibungen, Unteraufgabentexte, Projektbezeichnungen sowie Vorlagennamen und Vorlagenschritte**. Mehrere Wörter dürfen an verschiedenen Stellen derselben Aufgabe vorkommen, etwa `Mathe ClassTime`. Groß- und Kleinschreibung sowie Umlaute/Akzente werden bei der Suche weitgehend vereinheitlicht.

Du kannst vier Filter kombinieren: **offen/erledigt/alle**, **Aufgaben/Vorlagen/beides**, **Projekt (einschließlich Eingang)** und **Priorität P1–P4**. Vorlagen besitzen selbst kein Projekt und keine Priorität; wenn entsprechende Filter aktiv sind, erscheinen deshalb ausschließlich passende Aufgaben. „Erledigt“ bezieht sich auf abgeschlossene einmalige Aufgaben, nicht auf die Historie einzelner Durchläufe wiederkehrender Aufgaben.

Treffer zeigen den Kontext, zum Beispiel die passende Unteraufgabe, den Fortschritt, den Namen des Projekts oder eine Deadline. Ein Klick öffnet die **volle Aufgabenbearbeitung** oder **den bestehenden visuellen Vorlageneditor**. Ergebnisse lassen sich in Seiten von 30 Einträgen nachladen.

**Sicherheitsprinzip:** Suchen und Filtern sind rein lesend. Es werden weder Aufgaben umgeplant noch erledigt, und Suchbegriffe/Filter werden nicht ungefragt in der Cloud gespeichert. Änderungen geschehen erst beim ausdrücklichen Bearbeiten und Speichern. Das bestehende **Datenschema v5** bleibt unverändert; keine Migration und kein neuer Cloud-Dienst.

## Unteraufgaben organisieren (v1.3)

**Neue Reihenfolge in Aufgaben und Vorlagen:** Im Editor hat jede Unteraufgabe einen Griff zum Ziehen. Du kannst sie am Griff per Drag-and-drop umsortieren oder die kleinen **↑/↓-Pfeile** verwenden – praktisch am Tablet oder mit der Tastatur. Die Reihenfolge wird erst beim Speichern übernommen. Bereits eingestellte Termine, Häkchen, geschätzte Minuten und Unteraufgaben-IDs bleiben dabei erhalten. In Vorlagen wird nur die Reihenfolge der Schritte geändert; daraus entstandene Aufgaben werden nicht nachträglich verändert.

**Checklisten ein-/ausklappen:** In normalen Aufgabenlisten gibt es bei Aufgaben mit Unteraufgaben einen kleinen Pfeil mit Fortschrittsanzeige, etwa `2/6`. So kannst du lange Checklisten ausblenden, ohne sie zu löschen oder abzuhaken. Innerhalb der laufenden App-Sitzung bleibt deine Auswahl beim Navigieren in derselben Ansicht erhalten; nach erneutem Laden starten die Listen wie bislang offen. Im Heute-Fokus und unter Anstehend bleiben fällige Teilaufgaben eigenständig sichtbar.

**Schritte zwischen Aufgaben verschieben:** In der Aufgabenliste und im Heute-Fokus gibt es beim einzelnen Schritt **„Verschieben“**. Im bestehenden Aufgabeneditor gibt es ebenfalls einen Pfeil zum **Speichern und Verschieben** (deine bisherigen Änderungen an der Hauptaufgabe werden vorher bewusst gespeichert). Im geöffneten Dialog kannst du eine andere offene Hauptaufgabe als Ziel auswählen. Beim Verschieben bleibt **die ID, der Text, das Häkchen, die Zeitschätzung** sowie standardmäßig der eingetragene Arbeitstag erhalten.

Wenn der Schritt mit `2 Wochen vorher` oder `{Deadline} - 3 Tage` geplant war, musst du bewusst zwischen zwei Optionen wählen:

- **Arbeitstag beibehalten** (Standard): der konkrete Termin bleibt, die alte Verknüpfung zur Deadline der Ursprungsaufgabe wird entfernt.
- **Abstand zur neuen Deadline übernehmen:** nur möglich, wenn die Zielaufgabe eine eigene Deadline hat; dann wird das neue Datum als Vorschau angezeigt und erst bei Bestätigung übernommen.

Falls der beibehaltene Arbeitstag hinter dem letzten zulässigen Fertigstellungstag der Zielaufgabe liegt, gibt es eine weitere Warnung. Nach einer Verschiebung kannst du über **„Rückgängig“** den ursprünglichen Schritt einschließlich seiner Position und relativen Verknüpfung wiederherstellen – sofern nicht zwischenzeitlich einer der beiden Task-Datensätze geändert wurde. Die App schützt damit auch gegen versehentliches Überschreiben neuerer Cloud-Daten.

Es bleibt bei **AppData-Schema v5**. JSON-Export, bestehende Vorlagen und die optionale Cloud-Synchronisation benötigen keine Migration.

## Heute-Fokus: Unteraufgaben wirklich erledigen (v1.2)

**Heute** zeigt nun eigenständig terminierte Unteraufgaben mit Arbeitstermin heute oder früher als separate, direkt abhakbare Einträge. Damit musst du die übergeordnete Klassenarbeit nicht jedes Mal öffnen, um beispielsweise „ClassTime einrichten“ als erledigt zu markieren.

- **Überfällige Arbeitsschritte** stehen vor den heute geplanten Schritten und zeigen, wann die Bearbeitung ursprünglich geplant war.
- **Heute anstehende Unteraufgaben** erscheinen mit ihrem Namen, Link zur Hauptaufgabe, deren Checklistenfortschritt, optionalem Projekt, Aufwandsschätzung und benötigt-am-Deadline.
- Mit dem **Abhak-Button** erledigst du ausschließlich diesen Schritt. Die Hauptaufgabe bleibt offen, die übrigen Schritte unverändert. Das eingeblendete **Rückgängig** kann ein versehentliches Häkchen zurücknehmen, solange die betreffende Aufgabe seitdem nicht wieder verändert wurde.
- **Anstehend** zeigt Unteraufgaben am jeweils geplanten Tag der nächsten sieben Tage, **auch wenn die Hauptaufgabe selbst noch keinen Arbeitstag hat**. Erledigte Schritte sowie abgeschlossene einmalige Hauptaufgaben erscheinen nicht.
- Eltern-Aufgaben erscheinen in der Heute-Planungsgruppe nur, wenn sie **selbst** auf heute oder früher eingeplant sind. Eltern mit lediglich einem fälligen Unteraufgabentermin werden nicht zusätzlich dort aufgelistet. In Heute und Anstehend werden die gesamten Unteraufgaben nicht noch einmal direkt unter der Hauptaufgabe wiederholt. In den übrigen Ansichten bleiben die gewohnten aufklappbaren bzw. direkt abhakbaren Checklisten unverändert.

Die Funktion berechnet die Anzeige aus den vorhandenen Task-/Subtask-Daten. **Kein neues Schema, keine Migration und keine neue Cloud-Konfiguration.** Das Zeitbudget der Wochenplanung bleibt eine separate, ebenfalls bereits vorhandene Funktion.

## Intuitiver Vorlageneditor und Kurzanleitungen (v1.1)

Vorlagen legst du jetzt **genauso wie echte Aufgaben** an: oben die Hauptaufgabe mit optionaler Beschreibung, darunter **einzelne Unteraufgaben in eigenen Zeilen**. `Enter` in einer Unteraufgaben-Zeile fügt die nächste Zeile darunter ein; `Backspace` auf einer leeren Zeile entfernt sie. `Strg/⌘ + Enter` speichert, `Esc` schließt (bei ungespeicherten Änderungen nach Rückfrage). Über das Plus kannst du auch mit der Maus weitere Unteraufgaben hinzufügen.

Die runden Häkchen zeigen im Vorlageneditor beispielhaft den späteren Aufgabenstil. **Häkchen in einer Vorlage sind nur Vorschau und werden nicht gespeichert**: Jede neu erstellte Aufgabe startet vollständig unerledigt. Bereits gespeicherte Vorlagen samt Reihenfolge, Unteraufgaben und relativen Zeitabständen können weiterhin bearbeitet werden, ohne Datenmigration.

Bei der Erstellung von Vorlagen und der Bearbeitung von Aufgaben erscheint auf breiten Bildschirmen rechts eine **dauerhaft sichtbare Kurzreferenz**. Sie erläutert:

- Platzhalter wie `{Fach}`, `{Klasse}` und `{Thema}` – nur für Vorlagen; die Angaben werden beim Verwenden abgefragt.
- Unteraufgaben-Termine wie `2 Wochen vorher`, `14 Tage vorher`, `1 Monat vorher`, `am Vortag` oder `{Deadline} - 3 Tage`.
- Die wichtigsten Tastenkürzel zur Bearbeitung.

**Besonders praktisch:** Die Beispiele in der Editor-Hilfe sind anklickbar. Setze den Cursor in ein passendes Feld und klicke auf den gewünschten Ausdruck; Task Companion fügt ihn dort ein. So musst du dir die Schreibweise nicht merken. Auf schmalen Geräten steht die Referenz unter dem Editor.

Auch in den normalen Aufgabenlisten kann bei breiten Desktop-Fenstern rechts eine **kontextabhängige Kurzanleitung** eingeblendet werden. Auf Tablets oder Smartphones bleibt die Liste einspaltig.

## Unteraufgaben und Vorlagen

In jeder Aufgabe findest du unter **Weitere Einstellungen / Aufgabe bearbeiten → Unteraufgaben** eine frei anpassbare Checkliste. Die Häkchen lassen sich auch direkt in der Aufgabenliste setzen. Bei wiederkehrenden Aufgaben wird die Checkliste nach dem Abschließen für den nächsten Termin zurückgesetzt; „Rückgängig“ stellt die bisherigen Häkchen wieder her.

Unter **Vorlagen** erstellst du wiederverwendbare Abläufe, zum Beispiel „Klassenarbeit vorbereiten“. Jeder Schritt steht in der Vorlage in einer eigenen Zeile. Beim Auswählen einer Vorlage öffnet sich ein **neuer Aufgabenentwurf** mit frischen, noch nicht abgehakten Unteraufgaben. Dort legst du individuell Projekt, geplanten Arbeitstag und Deadline fest. Eine Vorlage beeinflusst bereits angelegte Aufgaben nicht, selbst wenn du sie nachträglich bearbeitest oder löschst.

### Intelligente Platzhalter (v0.7)

Du kannst beliebige wiederverwendbare Angaben in geschweiften Klammern in die Vorlage schreiben, z. B.:

- **Titel:** `Klassenarbeit {Fach} {Klasse} vorbereiten`
- **Beschreibung:** `Thema: {Thema}`
- **Unteraufgabe:** `Erwartungshorizont zu {Thema} erstellen`

Wenn du die Vorlage verwendest, fragt Task Companion **jede unterschiedliche Angabe nur einmal** ab, zeigt sofort eine Vorschau des fertig eingesetzten Titels und aller Schritte und öffnet danach den üblichen Aufgabeneditor für Planung, Deadline, Projekt und Priorität. Zum Beispiel ergeben `Fach = Mathematik`, `Klasse = 7b` und `Thema = Bruchrechnung` den Titel „Klassenarbeit Mathematik 7b vorbereiten“. Die gespeicherte Vorlage bleibt unverändert. **Bestehende Vorlagen ohne Platzhalter funktionieren weiterhin ohne zusätzliches Formular.**

Platzhalter werden innerhalb eines Feldes durch `{Name}` gekennzeichnet; eigene Bezeichnungen (z. B. `{Schuljahr}`, `{Lerngruppe}`) sind möglich. Namen berücksichtigen Groß-/Kleinschreibung und können Buchstaben, Zahlen nach dem ersten Zeichen, Bindestriche und Unterstriche enthalten. Das erste Zeichen muss ein Buchstabe oder Unterstrich sein; Leerzeichen im Platzhalternamen sind nicht vorgesehen. Werte werden wörtlich eingesetzt, ohne Befehle auszuführen.

Alternativ kannst du im Aufgabeneditor **Als Vorlage speichern** wählen. Die Vorlage wird separat zur Aufgabe in der versionierten App-Datenbank gespeichert und ist Teil des JSON-Exports und der Cloud-Synchronisation. Das alte v1/v2-Format wird beim Laden/importieren schonend nach **Schema v5** migriert, ohne vorhandene Aufgaben, Termine, Projekte oder IDs zu verlieren.

## Rückwärtsplanung (v0.8)

**Deine Deadline bedeutet: An diesem Datum muss die Aufgabe bereits fertig bereitstehen.** Beispiel: „Kompetenz-Checks drucken, Deadline 10.11.“ heißt: Die Checks müssen spätestens am **9.11.** ausgedruckt sein. Das Deadline-Radar zählt darum den letzten Fertigstellungstag, zeigt aber weiterhin das tatsächliche Datum an, an dem das Material benötigt wird. Es verschiebt **keine** Termine automatisch auf Werktage: Wenn der Vortag ein Sonntag ist, wird er zunächst korrekt als Sonntag angezeigt. Das kannst du im Editor manuell vorziehen.

Du kannst die gewünschte Bearbeitungsplanung direkt in den Unteraufgabentext schreiben – entweder im Aufgabeneditor oder in einer wiederverwendbaren Vorlage:

- `Aufgaben zusammenstellen – 2 Wochen vorher`
- `Erwartungshorizont erstellen 14 Tage vorher`
- `ClassTime-Aufgaben eintragen – {Deadline} - 7 Tage`
- `ClassTime-Terminierung prüfen – 3 Tage vorher`
- `Kompetenz-Checks kopieren – am Vortag`
- `Layout kontrollieren – einen Monat vorher`

**Wochen** bedeuten exakt 7 Kalendertage, **Monate** werden als echte Kalendermonate gerechnet (31. März minus ein Monat ist der 28./29. Februar). Der Bezugspunkt dieser Formulierungen ist **immer die eingetragene Hauptdeadline**; `{Deadline}` wird automatisch als solcher erkannt und **nicht** als normaler Eingabe-Platzhalter abgefragt. `2 Wochen vorher` und `14 Tage vorher` ergeben dasselbe Datum.

Im Aufgaben-Editor werden die fertigen Termine sofort neben jedem Schritt angezeigt. Jeder Schritt kann auch ein eigenes, direkt eingegebenes Datum erhalten; dann ist er unabhängig von der relativen Planung. Beim erstmaligen Festlegen einer Deadline berechnet die App die angegebenen Abstände automatisch. Bei **nachträglicher Änderung** der Deadline musst du ausdrücklich wählen, ob du relative Unteraufgaben neu berechnen oder bisherige Termine behalten möchtest. Abgehakte Schritte und manuell gewählte Termine bleiben beim Neuberechnen unberührt.

In der Heute-Ansicht werden übergeordnete Aufgaben auch dann eingeblendet, wenn eine **offene Unteraufgabe für heute** geplant ist. Die einzelnen Schritttermine stehen direkt unter den Unteraufgaben. Die bisherige Cloud-Synchronisation und JSON-Backups speichern diese Informationen mit; das erweiterte Schema v4 wird automatisch aus bestehenden v1–v3-Daten erzeugt.

## Wochenplanung und Zeitbudget (v0.9)

Der neue Menüpunkt **Wochenplanung** zeigt dir eine sieben Tage umfassende Übersicht (Montag bis Sonntag) mit einer Vor-/Zurück-Navigation und einer Taste **„Diese Woche“**.

- Im Aufgabeneditor kannst du bei der Hauptaufgabe sowie bei einzelnen Unteraufgaben die **geschätzte Dauer in Minuten** eintragen. Fehlende Schätzungen werden als „Dauer offen“ angezeigt – diese Einträge gelten nicht als kostenlos/zeitlos.
- Jede geplante Hauptaufgabe erscheint am eingetragenen Arbeitstag. Jede **offene, individuell terminierte Unteraufgabe** erscheint separat auf ihrem Tag, ohne dass die Hauptdeadline verschoben wird. Bereits erledigte Schritte zählen nicht mehr.
- Die Dauer der Hauptaufgabe wird nur dann zum Tagesbudget gezählt, wenn **keine offene Unteraufgabe eine eigene Zeitschätzung** besitzt. So werden geschätzte Arbeitsstunden bei großen Aufgaben nicht doppelt gezählt.
- Für Montag bis Sonntag kannst du einmalig deine persönliche verfügbare Arbeitszeit in Minuten festlegen. Die Werte gelten für alle Wochen, sind vollständig optional (leeres Feld = noch kein Budget) und werden mit der Cloud/JSON-Sicherung übertragen. Der Wert `0` bedeutet ausdrücklich, dass du an diesem Wochentag gar keine Arbeitszeit einplanen möchtest.
- Nur wenn eine konkrete Budgetgrenze gesetzt ist, signalisiert die App bei Überschreitung Überlastung. Bei unbekannten Aufwänden ist dies **eine Mindestbelastung**, kein vollständiger Zeitplan.
- Ein Arbeitstag lässt sich direkt in der Wochenansicht durch ein Datumsfeld ändern. Das gilt auch für einzelne Unteraufgaben; diese lösen dabei ihre relative Bindung an die Deadline. Die App fragt vor dem Auflösen der Bindung oder dem Verschieben hinter den letzten Fertigstellungstag nach. **Keine eigenmächtige automatische Neuverteilung.**
- Noch nicht terminierte Aufgaben und Unteraufgaben stehen unter **„Ohne Arbeitstag“** und lassen sich direkt dort einplanen. Zur Übersicht zeigt die App höchstens 16 davon gleichzeitig, der Rest kann im üblichen Editor terminiert werden.

Die Woche ist eine **Arbeitsplanung**, keine stundenweise Kalenderbelegung: 60 Minuten bedeuten geschätzter Arbeitsaufwand und noch keinen festen Termin von z. B. 14:00–15:00 Uhr. Die neue Speicherung verwendet **Schema v5**. Alte v1–v4-Daten werden ohne Änderung von Aufgaben- und Projekt-IDs migriert. Ältere App-Versionen können die neue Schema-Version nicht sicher bearbeiten: vor der Verwendung auf einem zweiten Gerät deshalb die PWA dort aktualisieren.

## Versionsanzeige und Benachrichtigungen

Unten links in der Seitenleiste sowie unter **Daten & Einstellungen** steht die aktuell geladene Versionsnummer (z. B. `v1.5.0 · Build 1234abcd`). Bei GitHub-Pages-Veröffentlichungen wird die Build-Kennung direkt aus der Commit-ID generiert; damit lässt sich nach einem Seitenreload erkennen, ob die App tatsächlich aktualisiert wurde. Lokal erscheint `Build lokal`.

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

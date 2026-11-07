import {BookOpen,CalendarClock,Keyboard,Lightbulb} from 'lucide-react';
import type {View} from './Sidebar';

/** Persistent desktop quick reference; richer clickable examples live in editors. */
export function AppShortcutRail({view}:{view:View}){
 const templates=view.kind==='templates';
 const inbox=view.kind==='inbox';
 const calendar=view.kind==='calendar';
 return <aside className="app-shortcut-rail" aria-label="Kurzanleitung und Shortcuts">
  <header><Keyboard size={17} aria-hidden="true"/>
   <div><strong>Kurzanleitung</strong><small>Immer griffbereit</small></div>
  </header>
  <section>
   <h3><Lightbulb size={14} aria-hidden="true"/> Schnellstart</h3>
   <p><kbd>Q</kbd> Neue Aufgabe schnell erfassen – solange du kein Textfeld bearbeitest.</p>
   <p><kbd>/</kbd> oder <kbd>Strg/⌘ + K</kbd> öffnet die globale Suche nach Aufgaben, Schritten und Vorlagen.</p>
   <p>Für zusätzliche Angaben nutze <b>Weitere Einstellungen</b> oder klicke auf eine bestehende Aufgabe.</p>
   <p>Unteraufgaben kannst du über den kleinen Pfeil ein- und ausklappen. Mit <b>Verschieben</b> ordnest du einen Schritt einer anderen Hauptaufgabe zu.</p>
  </section>
  {inbox&&<section>
   <h3><Keyboard size={14} aria-hidden="true"/> Eingang aufräumen</h3>
   <p>Im Inbox-Turbo: <kbd>1</kbd>–<kbd>4</kbd> für Prioritäten, <kbd>H</kbd> heute, <kbd>M</kbd> morgen und <kbd>S</kbd> zum Überspringen.</p>
   <p><kbd>Enter</kbd> speichert und öffnet die nächste Aufgabe.</p>
  </section>}
  {calendar&&<section>
   <h3><CalendarClock size={14} aria-hidden="true"/> Monatskalender lesen</h3>
   <p><b>Blau</b> zeigt eingeplante Arbeit, <b>Orange</b> den letzten Fertigstellungstag und <b>Rot</b> den Tag, an dem alles bereits benötigt wird.</p>
   <p>Klicke auf einen Kalendertag für die Details. Dort kannst du Aufgaben öffnen, Arbeitstage ändern oder eine neue Aufgabe für diesen Tag erfassen.</p>
   <p><b>Neu:</b> Unter „Ohne Arbeitstag“ einen Schritt am Griff auf den gewünschten Tag ziehen – oder erst „Tag wählen“ anklicken und dann den Kalendertag. <kbd>Esc</kbd> bricht die Auswahl ab.</p>
   <p>Auch bereits geplante Aufgaben lassen sich aus den Tagesdetails neu zuordnen. Ein versehentlicher Schritt lässt sich direkt rückgängig machen.</p>
   <p>In den Tagesdetails kannst du Unteraufgaben und ganze Aufgaben direkt <b>abhaken</b>. Über <b>Rückgängig</b> lässt sich ein versehentliches Häkchen zurücknehmen.</p>
   <p>Mit <b>Projekt</b> blendest du andere Bereiche aus. <b>Erledigte anzeigen</b> macht abgeschlossene Schritte sichtbar – diese zählen nicht mehr zur geplanten Arbeitszeit.</p>
   <p>Bei wiederkehrenden Aufgaben können Häkchen für die nächste Runde zurückgesetzt werden. Die App fragt bei vorhandenen Einzelterminen oder Deadlines vorher nach.</p>
   <p>Relative Terminverschiebungen und Planungen nach der Deadline benötigen deine ausdrückliche Bestätigung.</p>
  </section>}
  {templates&&<section>
   <h3><BookOpen size={14} aria-hidden="true"/> Vorlagen schreiben</h3>
   <p><code>{'{Fach}'}</code>, <code>{'{Klasse}'}</code> und <code>{'{Thema}'}</code> sind <b>Platzhalter</b>. Du füllst sie erst beim Verwenden einer Vorlage aus.</p>
   <p>In der Vorlagenbearbeitung erzeugt <kbd>Enter</kbd> eine neue Unteraufgabe. Rechts gibt es anklickbare Beispiele.</p>
   <p>Beispiel: <code>ClassTime einrichten – 2 Wochen vorher</code></p>
  </section>}
  <section>
   <h3><CalendarClock size={14} aria-hidden="true"/> Deadlines</h3>
   <p>Deadline bedeutet: <b>An diesem Tag muss alles bereits fertig sein.</b> Spätester Fertigstellungstag ist der Vortag.</p>
   <p><code>14 Tage vorher</code> oder <code>{'{Deadline}'} - 3 Tage</code> können in Unteraufgaben stehen.</p>
  </section>
 </aside>;
}

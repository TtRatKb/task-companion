import { BookOpenCheck, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import type { TaskTemplate } from '../types';

export function TemplateLibrary({
  templates, onCreate, onExample, onUse, onEdit, onDelete
}: {
  templates: TaskTemplate[];
  onCreate: () => void;
  onExample: () => void;
  onUse: (template: TaskTemplate) => void;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (template: TaskTemplate) => void;
}) {
  return <section className="template-library" aria-label="Aufgabenvorlagen">
    <div className="template-intro">
      <div className="template-intro-heading">
        <BookOpenCheck size={21} aria-hidden="true" />
        <h2>Wiederkehrende Abläufe? Einmal vorbereiten.</h2>
      </div>
      <p>Speichere typische Aufgaben mit einer festen Checkliste als Vorlage. Beim Anwenden
        entsteht eine <strong>neue, unabhängige Aufgabe</strong>: Du kannst Titel, Fach, Klasse,
        Deadline und Projekt jedes Mal neu festlegen.</p>
      <div className="template-actions">
        <button className="primary" type="button" onClick={onCreate}>
          <Plus size={17}/> Neue Vorlage
        </button>
        <button className="ghost" type="button" onClick={onExample}>
          <ClipboardList size={17}/> Beispiel „Klassenarbeit vorbereiten“
        </button>
      </div>
    </div>

    {templates.length === 0 ? <div className="empty template-empty">
      <div className="empty-check"><BookOpenCheck size={22}/></div>
      <h2>Noch keine Vorlagen</h2>
      <p>Du kannst eine leere Vorlage anlegen, das Klassenarbeits-Beispiel anpassen oder eine bestehende Aufgabe über „Als Vorlage“ übernehmen.</p>
    </div> :
    <div className="template-cards">
      {templates.map(template => <article className="template-card" key={template.id}>
        <div className="template-card-info">
          <strong>{template.name}</strong>
          <p>{template.title}</p>
          <small>{template.subtaskTitles.length} Standardschritte · P{template.priority}</small>
        </div>
        <div className="template-card-actions">
          <button className="primary" type="button" onClick={() => onUse(template)}>
            <Plus size={16}/> Aufgabe erstellen
          </button>
          <button className="ghost" type="button" onClick={() => onEdit(template)}>
            <Pencil size={16}/> Bearbeiten
          </button>
          <button className="icon-button" type="button" aria-label={`Vorlage „${template.name}“ löschen`}
            onClick={() => onDelete(template)}><Trash2 size={17}/></button>
        </div>
      </article>)}
    </div>}
  </section>;
}

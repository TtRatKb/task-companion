import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import type { TaskTemplate } from '../types';
import type { TemplateDraft } from '../templates';

export function TemplateEditor({
  initial, editing, onSave, onCancel
}: {
  initial: TemplateDraft;
  editing?: TaskTemplate;
  onSave: (draft: TemplateDraft, editing?: TaskTemplate) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<TemplateDraft>(() => ({
    ...initial, subtaskTitles: [...initial.subtaskTitles]
  }));
  const [newStep, setNewStep] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef<HTMLInputElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  const addStep = () => {
    const title = newStep.trim();
    if (!title) return;
    setDraft(old => ({ ...old, subtaskTitles: [...old.subtaskTitles, title] }));
    setNewStep('');
    stepRef.current?.focus();
  };
  const move = (index: number, amount: number) => {
    const next = [...draft.subtaskTitles];
    const target = index + amount;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft({ ...draft, subtaskTitles: next });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.title.trim()) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      title: draft.title.trim(),
      subtaskTitles: draft.subtaskTitles.map(x => x.trim()).filter(Boolean)
    }, editing);
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => {
    if (e.target === e.currentTarget) onCancel();
  }}>
    <form className="modal template-editor" role="dialog" aria-modal="true"
      aria-labelledby="template-editor-title" onSubmit={submit}
      onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}>
      <header>
        <h2 id="template-editor-title">{editing ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</h2>
        <button type="button" className="icon-button" aria-label="Schließen" onClick={onCancel}><X/></button>
      </header>
      <label>Name der Vorlage
        <input ref={titleRef} required value={draft.name} placeholder="z. B. Klassenarbeit vorbereiten"
          onChange={e => setDraft({ ...draft, name: e.target.value })}/>
      </label>
      <label>Standardtitel der Aufgabe
        <input required value={draft.title} placeholder="z. B. Klassenarbeit Mathematik vorbereiten"
          onChange={e => setDraft({ ...draft, title: e.target.value })}/>
      </label>
      <label>Beschreibung (optional)
        <textarea value={draft.description} placeholder="Optionaler Standardtext"
          onChange={e => setDraft({ ...draft, description: e.target.value })}/>
      </label>
      <label>Standardpriorität
        <select value={draft.priority} onChange={e => setDraft({
          ...draft, priority: Number(e.target.value) as TemplateDraft['priority']
        })}>
          {[1,2,3,4].map(p => <option value={p} key={p}>P{p}</option>)}
        </select>
      </label>
      <section className="checklist-editor" aria-label="Schritte der Vorlage">
        <div className="checklist-heading">
          <h3>Standard-Checkliste</h3>
          <small>{draft.subtaskTitles.length} Schritte</small>
        </div>
        {draft.subtaskTitles.map((step, index) =>
          <div className="template-step-row" key={index}>
            <span className="template-step-number">{index + 1}.</span>
            <input aria-label={`Vorlagenschritt ${index + 1}`} value={step}
              onChange={e => setDraft(old => ({
                ...old, subtaskTitles: old.subtaskTitles.map((item,i) => i === index ? e.target.value : item)
              }))}/>
            <button type="button" className="icon-button" disabled={index === 0}
              aria-label={`Schritt ${index+1} nach oben`} onClick={() => move(index,-1)}><ArrowUp/></button>
            <button type="button" className="icon-button" disabled={index === draft.subtaskTitles.length-1}
              aria-label={`Schritt ${index+1} nach unten`} onClick={() => move(index,1)}><ArrowDown/></button>
            <button type="button" className="icon-button" aria-label={`Schritt ${index+1} entfernen`}
              onClick={() => setDraft(old => ({
                ...old, subtaskTitles: old.subtaskTitles.filter((_,i) => i !== index)
              }))}><Trash2/></button>
          </div>
        )}
        <div className="checklist-add">
          <input ref={stepRef} value={newStep} aria-label="Neuer Vorlagenschritt"
            placeholder="Weiteren Standardschritt hinzufügen …" onChange={e => setNewStep(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}/>
          <button type="button" className="ghost" disabled={!newStep.trim()} onClick={addStep}>
            <Plus size={16}/> Hinzufügen
          </button>
        </div>
        <small>Jede neue Aufgabe startet mit eigenen, noch nicht abgehakten Schritten. Die Vorlage selbst bleibt unverändert.</small>
      </section>
      <footer><span/><div>
        <button type="button" className="ghost" onClick={onCancel}>Abbrechen</button>
        <button className="primary">Vorlage speichern</button>
      </div></footer>
    </form>
  </div>;
}

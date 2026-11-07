import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, BookmarkPlus, Plus, Trash2, X } from 'lucide-react';
import { weekdayNames } from '../date';
import { id } from '../domain';
import { DAILY, WEEKEND, WORKDAYS, recurrence } from '../recurrence';
import type { Priority, Project, Task, Weekday } from '../types';

type Draft = Omit<Task, 'id'|'createdAt'|'updatedAt'|'completedAt'>;
const blank = (): Draft => ({
  title: '', description: '', projectId: null, priority: 4,
  scheduledDate: null, deadlineDate: null, recurrence: null, subtasks: []
});

export function TaskEditor({
  task, initialDraft, projects, initialProject, onSave, onSaveAsTemplate, onDelete, onClose
}: {
  task?: Task;
  initialDraft?: Draft;
  projects: Project[];
  initialProject?: string|null;
  onSave: (value: Draft) => void;
  onSaveAsTemplate?: (value: Draft) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [v, setV] = useState<Draft>(() => task ? {
    title: task.title, description: task.description, projectId: task.projectId,
    priority: task.priority, scheduledDate: task.scheduledDate,
    deadlineDate: task.deadlineDate, recurrence: task.recurrence,
    subtasks: task.subtasks.map(step => ({ ...step }))
  } : initialDraft ?? { ...blank(), projectId: initialProject ?? null });
  const [stepTitle, setStepTitle] = useState('');
  const title = useRef<HTMLInputElement>(null);
  const stepInput = useRef<HTMLInputElement>(null);
  useEffect(() => title.current?.focus(), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (v.title.trim()) onSave({ ...v, title: v.title.trim() });
  };

  const addStep = () => {
    const text = stepTitle.trim();
    if (!text) return;
    setV(old => ({ ...old, subtasks: [...old.subtasks, { id: id(), title: text, completedAt: null }] }));
    setStepTitle('');
    stepInput.current?.focus();
  };
  const moveStep = (index: number, direction: number) => {
    setV(old => {
      const next = old.subtasks.slice();
      const target = index + direction;
      if (target < 0 || target >= next.length) return old;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...old, subtasks: next };
    });
  };
  const days = v.recurrence?.weekdays ?? [];
  const preset = days.join() === DAILY.join() ? 'daily'
    : days.join() === WORKDAYS.join() ? 'workdays'
    : days.join() === WEEKEND.join() ? 'weekend'
    : days.length === 1 ? 'weekly' : 'custom';

  const setPreset = (value: string) => {
    if (value === '') setV({ ...v, recurrence: null });
    else if (value === 'daily') setV({ ...v, recurrence: recurrence(DAILY) });
    else if (value === 'workdays') setV({ ...v, recurrence: recurrence(WORKDAYS) });
    else if (value === 'weekend') setV({ ...v, recurrence: recurrence(WEEKEND) });
    else if (value === 'weekly')
      setV({ ...v, recurrence: recurrence([v.recurrence?.weekdays[0] ?? 1]) });
    else setV({
      ...v, recurrence: recurrence(v.recurrence?.weekdays.length ? v.recurrence.weekdays : [1,3,5])
    });
  };

  return <div className="modal-backdrop" role="presentation"
    onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <form className="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"
      onSubmit={submit} onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <header>
        <h2 id="editor-title">{task ? 'Aufgabe bearbeiten' : 'Aufgabe hinzufügen'}</h2>
        <button type="button" className="icon-button" aria-label="Schließen" onClick={onClose}><X/></button>
      </header>

      <label>Titel
        <input ref={title} value={v.title} onChange={event => setV({ ...v, title: event.target.value })}
          required placeholder="Was steht an?"/>
      </label>
      <label>Beschreibung
        <textarea value={v.description} onChange={event => setV({ ...v, description: event.target.value })}
          placeholder="Notizen (optional)"/>
      </label>

      <div className="form-grid">
        <label>Projekt
          <select value={v.projectId ?? ''} onChange={event => setV({ ...v, projectId: event.target.value || null })}>
            <option value="">Eingang</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>Priorität
          <select value={v.priority}
            onChange={event => setV({ ...v, priority: Number(event.target.value) as Priority })}>
            {[1,2,3,4].map(p => <option key={p} value={p}>P{p}</option>)}
          </select>
        </label>
        <label>Geplant
          <input type="date" value={v.scheduledDate ?? ''}
            onChange={event => setV({ ...v, scheduledDate: event.target.value || null })}/>
        </label>
        <label>Deadline
          <input type="date" value={v.deadlineDate ?? ''}
            onChange={event => setV({ ...v, deadlineDate: event.target.value || null })}/>
          <small>Bleibt bei Wiederholungen unverändert.</small>
        </label>
        <label>Wiederholung
          <select value={v.recurrence ? preset : ''} onChange={event => setPreset(event.target.value)}>
            <option value="">Keine</option>
            <option value="daily">Jeden Tag</option>
            <option value="workdays">Jeden Wochentag (Mo–Fr)</option>
            <option value="weekend">Jedes Wochenende</option>
            <option value="weekly">Jede Woche an einem Tag</option>
            <option value="custom">Benutzerdefinierte Tage</option>
          </select>
        </label>
      </div>
      {v.recurrence && (preset === 'weekly' || preset === 'custom') &&
        <fieldset className="weekday-picker">
          <legend>{preset === 'weekly' ? 'Wochentag' : 'Wochentage'}</legend>
          {weekdayNames.map((name, index) => <label key={name}>
            <input type={preset === 'weekly' ? 'radio' : 'checkbox'} name="weekday"
              checked={days.includes(index as Weekday)}
              onChange={() => setV({
                ...v,
                recurrence: recurrence(preset === 'weekly' ? [index]
                  : days.includes(index as Weekday) ? days.filter(day => day !== index)
                    : [...days, index])
              })}/>
            {name.slice(0,2)}
          </label>)}
        </fieldset>
      }

      <section className="checklist-editor" aria-label="Unteraufgaben">
        <div className="checklist-heading">
          <h3>Unteraufgaben</h3>
          <small>{v.subtasks.filter(step => step.completedAt).length}/{v.subtasks.length} erledigt</small>
        </div>
        {v.subtasks.map((step, index) =>
          <div className="checklist-edit-row" key={step.id}>
            <input type="checkbox" aria-label={`„${step.title}“ abhaken`}
              checked={step.completedAt !== null} onChange={event => setV(old => ({
                ...old,
                subtasks: old.subtasks.map(item => item.id === step.id
                  ? { ...item, completedAt: event.target.checked ? new Date().toISOString() : null }
                  : item)
              }))}/>
            <input aria-label={`Unteraufgabe ${index+1}`} value={step.title}
              onChange={event => setV(old => ({
                ...old,
                subtasks: old.subtasks.map(item => item.id === step.id
                  ? { ...item, title: event.target.value } : item)
              }))}/>
            <button type="button" className="icon-button" aria-label={`„${step.title}“ nach oben`}
              disabled={index === 0} onClick={() => moveStep(index,-1)}><ArrowUp/></button>
            <button type="button" className="icon-button" aria-label={`„${step.title}“ nach unten`}
              disabled={index === v.subtasks.length-1} onClick={() => moveStep(index,1)}><ArrowDown/></button>
            <button type="button" className="icon-button" aria-label={`„${step.title}“ entfernen`}
              onClick={() => setV(old => ({
                ...old, subtasks: old.subtasks.filter(item => item.id !== step.id)
              }))}><Trash2/></button>
          </div>
        )}
        <div className="checklist-add">
          <input ref={stepInput} aria-label="Neue Unteraufgabe"
            value={stepTitle} placeholder="Nächsten Schritt eintragen …"
            onChange={event => setStepTitle(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') { event.preventDefault(); addStep(); }
            }}/>
          <button type="button" className="ghost" disabled={!stepTitle.trim()} onClick={addStep}>
            <Plus size={16}/> Hinzufügen
          </button>
        </div>
        <small>Unteraufgaben sind einzeln abhakbar; bei wiederkehrenden Aufgaben starten sie nach jedem Abschluss neu.</small>
      </section>

      <footer className="task-editor-footer">
        {task && onDelete
          ? <button type="button" className="danger ghost" onClick={onDelete}><Trash2/> Löschen</button>
          : <span/>}
        <div>
          {onSaveAsTemplate && <button type="button" className="ghost" disabled={!v.title.trim()}
            onClick={() => onSaveAsTemplate({
              ...v,
              title: v.title.trim(),
              subtasks: v.subtasks.filter(step => step.title.trim()).map(step => ({ ...step, title: step.title.trim() }))
            })}>
            <BookmarkPlus size={16}/> Als Vorlage
          </button>}
          <button type="button" className="ghost" onClick={onClose}>Abbrechen</button>
          <button className="primary">Speichern</button>
        </div>
      </footer>
    </form>
  </div>;
}

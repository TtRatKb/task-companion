import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { addDays, todayLocal } from './date';
import { emptyData, type Task } from './types';
import { STORAGE_KEY } from './repository';

function sample(id: string, changes: Partial<Task> = {}): Task {
  const time = '2026-11-01T07:00:00Z';
  return {
    id, title: id, description: '', projectId: null, priority: 4,
    scheduledDate: null, deadlineDate: null, recurrence: null,
    completedAt: null, createdAt: time, updatedAt: time, ...changes
  };
}

describe('Deadline-Radar in der Anwendung', () => {
  beforeEach(() => {
    localStorage.clear();
    location.hash = '';
  });

  it('zeigt dringend, geplant, bald und freiwillig ohne Doppelanzeige', async () => {
    const today = todayLocal();
    const tasks = [
      sample('Abgabe dringend', { scheduledDate: addDays(today, 3), deadlineDate: today }),
      sample('Heute arbeiten', { scheduledDate: today }),
      sample('Demnächst fällig', { deadlineDate: addDays(today, 4) }),
      sample('Freiwillige Idee')
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyData(), tasks }));
    location.hash = '#today';
    render(<App />);

    await waitFor(() => expect(screen.getByText('Abgabe dringend')).toBeInTheDocument());
    expect(screen.getByRole('heading',{name:/Überfällige Aufgaben/})).toBeInTheDocument();
    expect(screen.getByText('Für heute geplant')).toBeInTheDocument();
    expect(screen.getByText('Bald fällig')).toBeInTheDocument();
    expect(screen.getByText('Wenn du noch Zeit hast')).toBeInTheDocument();
    for (const task of tasks) expect(screen.getAllByText(task.title)).toHaveLength(1);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.tasks[0].scheduledDate).toBe(addDays(today, 3));
  });

  it('zeigt den Radar-Link und die Detailseite für Deadlines aus allen Projekten', async () => {
    const today = todayLocal();
    const tasks = [
      sample('Alte Abgabe', { deadlineDate: addDays(today, -2), projectId: 'private' }),
      sample('Spätere Abgabe', { deadlineDate: addDays(today, 12), projectId: 'private' }),
      sample('Ohne Deadline')
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...emptyData(), tasks,
      projects: [{ id: 'private', name: 'Privates', color: '#888888', createdAt: '2026-11-01T07:00:00Z' }]
    }));
    location.hash = '#today';
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Alle Deadlines/ })).toBeInTheDocument());

    await userEvent.setup().click(screen.getByRole('button', { name: /Alle Deadlines/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Deadline-Radar' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /Überfällig/ })).toBeInTheDocument();
    expect(screen.getByText('Langfristig')).toBeInTheDocument();
    expect(screen.getByText('Alte Abgabe')).toBeInTheDocument();
    expect(screen.getByText('Spätere Abgabe')).toBeInTheDocument();
    expect(screen.queryByText('Ohne Deadline')).not.toBeInTheDocument();
    expect(screen.getByText('3 Tage überfällig', { exact: false })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });
    expect(within(nav).getByRole('button', { name: /Deadline-Radar/ })).toBeInTheDocument();
  });

  it('verändert beim Navigieren keine Aufgaben oder Cloud-Daten', async () => {
    const today = todayLocal();
    const tasks = [sample('Frist', { scheduledDate: addDays(today, 5), deadlineDate: today })];
    const saved = { ...emptyData(), tasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    location.hash = '#today';
    render(<App />);
    await waitFor(() => expect(screen.getByText('Frist')).toBeInTheDocument());
    await userEvent.setup().click(screen.getByRole('button', { name: /Alle Deadlines/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Deadline-Radar' })).toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(saved);
  });
});

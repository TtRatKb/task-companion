import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Inline-Schnellerfassung', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    location.hash = '';
  });

  it('öffnet mit Q, speichert mit Enter und lädt eine Aufgabe erneut', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.keyboard('q');
    const input = screen.getByLabelText('Aufgabe schnell erfassen');
    expect(input).toHaveFocus();
    await user.type(input, 'WebUntis eintragen jeden Wochentag #P2{Enter}');
    expect(screen.getByText('WebUntis eintragen')).toBeInTheDocument();
    expect(screen.getByText('Jeden Wochentag')).toBeInTheDocument();
    view.unmount();
    render(<App />);
    await waitFor(() => expect(screen.getByText('WebUntis eintragen')).toBeInTheDocument());
  });

  it('bleibt nach Enter offen und lässt beliebig viele Aufgaben ohne Maus erfassen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('q');
    const first = screen.getByLabelText('Aufgabe schnell erfassen');
    await user.type(first, 'Erste Aufgabe #P1{Enter}');
    expect(screen.getByText('Erste Aufgabe')).toBeInTheDocument();

    const second = screen.getByLabelText('Aufgabe schnell erfassen');
    expect(second).toHaveFocus();
    expect(second).toHaveValue('');
    await user.type(second, 'Zweite Aufgabe #p3{Enter}');
    expect(screen.getByText('Zweite Aufgabe')).toBeInTheDocument();

    const third = screen.getByLabelText('Aufgabe schnell erfassen');
    expect(third).toHaveFocus();
    expect(third).toHaveValue('');

    const saved = JSON.parse(localStorage.getItem('task-companion:data')!);
    expect(saved.tasks).toHaveLength(2);
    expect(saved.tasks.map((task: { title: string; priority: number }) => [task.title, task.priority]))
      .toEqual([['Erste Aufgabe', 1], ['Zweite Aufgabe', 3]]);
    expect(new Set(saved.tasks.map((task: { id: string }) => task.id)).size).toBe(2);
  });

  it('Escape verwirft die aktuelle Eingabe und schließt das Feld', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('q');
    await user.type(screen.getByLabelText('Aufgabe schnell erfassen'), 'Nicht speichern{Escape}');
    expect(screen.queryByLabelText('Aufgabe schnell erfassen')).not.toBeInTheDocument();
    expect(localStorage.getItem('task-companion:data')).toBeNull();
  });

  it('behält die Projektzuordnung auch bei mehreren Aufgaben', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'prompt').mockReturnValue('Demo');
    render(<App />);
    await user.click(screen.getByLabelText('Projekt erstellen'));
    await user.keyboard('q');
    await user.type(screen.getByLabelText('Aufgabe schnell erfassen'), 'Projektaufgabe{Enter}');
    await user.type(screen.getByLabelText('Aufgabe schnell erfassen'), 'Noch eine{Enter}');
    const saved = JSON.parse(localStorage.getItem('task-companion:data')!);
    expect(saved.tasks).toHaveLength(2);
    expect(saved.tasks.every((task: { projectId: string }) => task.projectId === saved.projects[0].id)).toBe(true);
  });

  it('öffnet Weitere Einstellungen auch ohne bereits getippten Titel', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('q');
    await user.click(screen.getByRole('button', { name: 'Weitere Einstellungen' }));
    const editor = screen.getByRole('dialog');
    expect(within(editor).getByLabelText('Titel')).toHaveValue('');
  });

  it('übernimmt die erkannte Priorität in Weitere Einstellungen und zurück in die Schnellerfassung', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('q');
    await user.type(screen.getByLabelText('Aufgabe schnell erfassen'), 'Abgabe vorbereiten #P2');
    expect(screen.getByLabelText('Erkannte Priorität')).toHaveValue('2');
    await user.click(screen.getByRole('button', { name: 'Weitere Einstellungen' }));
    const editor = screen.getByRole('dialog');
    expect(within(editor).getByLabelText('Titel')).toHaveValue('Abgabe vorbereiten');
    expect(within(editor).getByLabelText('Priorität')).toHaveValue('2');
    await user.click(within(editor).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.getByLabelText('Aufgabe schnell erfassen')).toHaveValue('Abgabe vorbereiten #P2');
    await user.click(screen.getByRole('button', { name: 'Weitere Einstellungen' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Speichern' }));
    expect(screen.getByText('Abgabe vorbereiten')).toBeInTheDocument();
    expect(screen.getByLabelText('Aufgabe schnell erfassen')).toHaveFocus();
    const saved = JSON.parse(localStorage.getItem('task-companion:data')!);
    expect(saved.tasks[0].priority).toBe(2);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { addDays,todayLocal } from './date';
import { REMINDER_SENT_KEY, REMINDER_SETTINGS_KEY } from './reminders';
import { emptyData, type Task } from './types';
import { STORAGE_KEY } from './repository';

const notifications: { title: string; options: NotificationOptions }[] = [];

class FakeNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn(async (): Promise<NotificationPermission> => 'granted');
  onclick: (() => void) | null = null;
  constructor(public title: string, public options: NotificationOptions = {}) {
    notifications.push({ title, options });
  }
  close() {}
}

function dueTask(): Task {
  return {
    id: 'test-task', title: 'Wichtige Abgabe', description: '',
    projectId: null, priority: 1, scheduledDate: null,
    deadlineDate: addDays(todayLocal(),1), recurrence: null, completedAt: null,
    createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-01T10:00:00Z'
  };
}

describe('Version & Benachrichtigungen', () => {
  beforeEach(() => {
    notifications.length = 0;
    localStorage.clear();
    location.hash = '';
    vi.stubGlobal('Notification', FakeNotification);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the exact release and build identity in the sidebar and settings', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/v1\.1\.0 · Build /)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Daten & Einstellungen' }));
    expect(screen.getByText(/Aktuell installiert: v1\.1\.0 · Build /)).toBeInTheDocument();
  });

  it('does not enable notifications until the user explicitly opts in', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...emptyData(), tasks: [dueTask()]
    }));
    render(<App />);
    await waitFor(() => expect(screen.getByText('Wichtige Abgabe')).toBeInTheDocument());
    expect(notifications).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Daten & Einstellungen' }));
    await user.click(screen.getByRole('button', { name: 'Benachrichtigungen aktivieren' }));
    await waitFor(() => expect(screen.getByText(/Benachrichtigungen aktiv, solange Task Companion läuft/)).toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem(REMINDER_SETTINGS_KEY)!).enabled).toBe(true);
    expect(notifications.length).toBeLessThanOrEqual(1); // A due reminder may fire on opt-in, depending on the time of day.
  });

  it('reminds only once for a due task, even after navigation and reload', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...emptyData(), tasks: [dueTask()]
    }));
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({
      enabled: true, leadDays: [0], time: '00:00'
    }));
    const view = render(<App />);
    await waitFor(() => expect(notifications).toHaveLength(1));
    expect(notifications[0].title).toMatch(/Wichtige Abgabe/);
    expect(localStorage.getItem(REMINDER_SENT_KEY)).toContain('test-task');
    await user.click(screen.getByRole('button', { name: 'Heute' }));
    expect(notifications).toHaveLength(1);
    view.unmount();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Wichtige Abgabe')).toBeInTheDocument());
    expect(notifications).toHaveLength(1);
  });

  it('allows choosing multiple lead times and a local reminder time', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Daten & Einstellungen' }));
    await user.click(screen.getByRole('checkbox', { name: '7 Tage vorher' }));
    fireEvent.change(screen.getByLabelText('Uhrzeit für Deadline-Erinnerungen'), {target:{value:'07:30'}});
    await waitFor(() => {
      const prefs = JSON.parse(localStorage.getItem(REMINDER_SETTINGS_KEY)!);
      expect(prefs.leadDays).toContain(7);
    });
  });
});

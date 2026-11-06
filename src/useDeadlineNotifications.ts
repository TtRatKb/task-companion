import { useEffect, useState } from 'react';
import {
  REMINDER_SENT_KEY, REMINDER_SETTINGS_KEY,
  loadReminderSettings, normalizeReminderSettings, remindersDue,
  reminderText, writeReminderSettings, type ReminderSettings
} from './reminders';
import type { Task } from './types';

function readSent(): Record<string, string> {
  try {
    const json = localStorage.getItem(REMINDER_SENT_KEY);
    const parsed: unknown = json ? JSON.parse(json) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) =>
        typeof key === 'string' && typeof value === 'string')
    ) as Record<string, string>;
  } catch { return {}; }
}

function recordSent(key: string) {
  const entries = readSent();
  entries[key] = new Date().toISOString();
  // Bound storage usage: retain only 500 most recent reminder IDs.
  const last = Object.entries(entries)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 500);
  localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(Object.fromEntries(last)));
}

export function useDeadlineNotifications(tasks: Task[]) {
  const [settings, setSettings] = useState<ReminderSettings>(() => loadReminderSettings());

  const updateSettings = (changes: Partial<ReminderSettings>) => {
    setSettings(previous => {
      const next = normalizeReminderSettings({ ...previous, ...changes });
      try { return writeReminderSettings(next); }
      catch { return previous; }
    });
  };

  useEffect(() => {
    if (!settings.enabled || !('Notification' in window)) return;
    const run = () => {
      if (Notification.permission !== 'granted') return;
      const sent = new Set(Object.keys(readSent()));
      const due = remindersDue(tasks, new Date(), settings, sent);
      if (!due.length) return;

      // Limit interruption: at most three individual notifications per sweep.
      // If more are due, show one combined notice and mark those reminders as sent.
      if (due.length > 3) {
        try {
          const notification = new Notification('Task Companion · Deadline-Radar', {
            body: `${due.length} Aufgaben haben eine bevorstehende Deadline. Öffne dein Deadline-Radar.`,
            tag: 'task-companion-deadlines-batch'
          });
          notification.onclick = () => { window.focus(); location.hash = '#deadlines'; notification.close(); };
          for (const item of due) recordSent(item.key);
        } catch { /* Permission, platform or storage may be unavailable. */ }
        return;
      }

      for (const item of due) {
        try {
          const notification = new Notification('Task Companion · ' + item.title.slice(0, 90), {
            body: reminderText(item.daysUntil),
            tag: 'task-companion-' + item.id + '-' + item.deadlineDate + '-' + item.daysUntil
          });
          notification.onclick = () => { window.focus(); location.hash = '#deadlines'; notification.close(); };
          recordSent(item.key);
        } catch { /* Never interrupt the task app if notifications are blocked. */ }
      }
    };

    run();
    const timer = window.setInterval(run, 60_000);
    const onFocus = () => run();
    const onVisibility = () => { if (!document.hidden) run(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tasks, settings]);

  return { reminderSettings: settings, updateReminderSettings: updateSettings };
}

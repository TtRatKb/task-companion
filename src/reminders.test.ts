import { describe, expect, it } from 'vitest';
import { addDays } from './date';
import {
  berlinTime, defaultReminderSettings, loadReminderSettings, normalizeReminderSettings,
  reminderKey, reminderText, remindersDue, writeReminderSettings
} from './reminders';
import type { Task } from './types';

const today = '2026-11-06';
const now = new Date('2026-11-06T08:10:00Z'); // 09:10 in Berlin (winter).
function task(id: string, fields: Partial<Task> = {}): Task {
  return {
    id, title: id, description: '', projectId: null, priority: 4,
    scheduledDate: null, deadlineDate: addDays(today,1), recurrence: null,
    completedAt: null, createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z', ...fields
  };
}
const configured = { enabled: true, leadDays: [7, 3, 1, 0], time: '09:00' };

describe('Deadline-Browser-Erinnerungen', () => {
  it('starts opt-out and never auto-enables on corrupt stored preferences', () => {
    expect(defaultReminderSettings().enabled).toBe(false);
    expect(normalizeReminderSettings({ enabled: 'true', time: '99:99', leadDays: [3, 999, -1, 3] }))
      .toEqual({ enabled: false, time: '09:00', leadDays: [3] });
    expect(loadReminderSettings({ getItem: () => '{broken' })).toEqual(defaultReminderSettings());
  });

  it('persists valid reminder settings separately from task data', () => {
    const state = new Map<string, string>();
    const saved = writeReminderSettings(
      { enabled: true, leadDays: [0, 3], time: '07:30' },
      { setItem: (key, value) => { state.set(key, value); } }
    );
    expect(loadReminderSettings({ getItem: key => state.get(key) ?? null })).toEqual(saved);
  });

  it('correctly uses Berlin time, including the DST change', () => {
    expect(berlinTime(now)).toBe('09:10');
    expect(berlinTime(new Date('2026-07-06T07:10:00Z'))).toBe('09:10');
    expect(berlinTime(new Date('2026-11-06T07:10:00Z'))).toBe('08:10');
  });

  it('does not notify before the selected time or before explicit opt-in', () => {
    const items = [task('today')];
    expect(remindersDue(items, new Date('2026-11-06T07:59:00Z'), configured)).toEqual([]);
    expect(remindersDue(items, now, { ...configured, enabled: false })).toEqual([]);
    expect(remindersDue(items, now, { ...configured, leadDays: [] })).toEqual([]);
  });

  it('offers reminders at exactly selected day offsets, never after the deadline', () => {
    const items = [
      task('today'),
      task('tomorrow', { deadlineDate: addDays(today, 2) }),
      task('three', { deadlineDate: addDays(today, 4) }),
      task('seven', { deadlineDate: addDays(today, 8) }),
      task('five', { deadlineDate: addDays(today, 6) }),
      task('late', { deadlineDate: addDays(today, -1) })
    ];
    expect(remindersDue(items, now, configured).map(item => item.id))
      .toEqual(['today', 'tomorrow', 'three', 'seven']);
  });

  it('does not remind about completed tasks and does not duplicate a previously sent reminder', () => {
    const completed = task('completed', { completedAt: '2026-11-06T08:00:00Z' });
    const open = task('open');
    const sent = new Set([reminderKey(open, 0)]);
    expect(remindersDue([completed, open], now, configured, sent)).toEqual([]);
  });

  it('does not remind again today for an already completed recurring instance', () => {
    const recurring = task('routine', {
      recurrence: { kind: 'weekdays', weekdays: [1, 2, 3, 4, 5] },
      completedAt: '2026-11-06T07:30:00Z'
    });
    expect(remindersDue([recurring], now, configured)).toEqual([]);
  });

  it('does not mutate the input task or change its scheduled date', () => {
    const item = task('test', { scheduledDate: addDays(today, 7) });
    const snapshot = JSON.stringify(item);
    const candidates = remindersDue([item], now, configured);
    expect(candidates[0].key).toBe('test|2026-11-07|0');
    expect(JSON.stringify(item)).toBe(snapshot);
  });

  it('contains short, human-readable reminder text', () => {
    expect(reminderText(0)).toMatch(/heute/i);
    expect(reminderText(1)).toMatch(/morgen/i);
    expect(reminderText(3)).toMatch(/3 Tage/i);
  });
});

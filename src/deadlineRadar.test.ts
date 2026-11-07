import { describe, expect, it } from 'vitest';
import { addDays } from './date';
import {
  allDeadlineGroups, calendarDaysBetween, deadlineCountdown,
  deadlineOverview, deadlineState, planningAfterDeadline, todayRadarGroups
} from './deadlineRadar';
import type { Task } from './types';

const today = '2026-11-06'; // Friday
function task(id: string, changes: Partial<Task> = {}): Task {
  return {
    id, title: id, description: '', projectId: null, priority: 4,
    scheduledDate: null, deadlineDate: null, recurrence: null, subtasks: [],
    completedAt: null, createdAt: '2026-11-01T11:00:00Z',
    updatedAt: '2026-11-01T11:00:00Z', ...changes
  };
}

describe('Deadline-Radar', () => {
  it('counts calendar days correctly across daylight-saving time, year and month boundaries', () => {
    expect(calendarDaysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(calendarDaysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(calendarDaysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(calendarDaysBetween('2026-11-06', '2026-11-04')).toBe(-2);
  });

  it('recognizes deadline states, including exact seven-day boundary', () => {
    expect(deadlineState('2026-11-05', today)).toBe('overdue');
    expect(deadlineState(today, today)).toBe('today');
    expect(deadlineState('2026-11-07', today)).toBe('soon');
    expect(deadlineState('2026-11-13', today)).toBe('soon');
    expect(deadlineState('2026-11-14', today)).toBe('later');
    expect(deadlineCountdown(today, today)).toBe('Heute fällig');
    expect(deadlineCountdown('2026-11-05', today)).toBe('Seit gestern überfällig');
    expect(deadlineCountdown('2026-11-04', today)).toBe('2 Tage überfällig');
    expect(deadlineCountdown('2026-11-07', today)).toBe('Morgen fällig');
  });

  it('puts urgent deadlines ahead of the planned day, without mutating scheduledDate', () => {
    const item = task('hard', { scheduledDate: '2026-11-10', deadlineDate: today });
    const groups = todayRadarGroups([item], today);
    expect(groups[0].tasks).toEqual([item]);
    expect(groups[1].tasks).toEqual([]);
    expect(item.scheduledDate).toBe('2026-11-10');
    expect(planningAfterDeadline(item)).toBe(true);
  });

  it('never duplicates a task across Today groups', () => {
    const tasks = [
      task('critical-overdue', { deadlineDate: '2026-11-05', scheduledDate: '2026-11-04' }),
      task('critical-today', { deadlineDate: today }),
      task('planned', { scheduledDate: today, deadlineDate: '2026-12-01' }),
      task('soon', { deadlineDate: '2026-11-09' }),
      task('planned-and-soon', { scheduledDate: today, deadlineDate: '2026-11-09' }),
      task('optional'),
      task('later-deadline', { deadlineDate: '2026-12-01' }),
      task('future-scheduled', { scheduledDate: '2026-11-25' })
    ];
    const groups = todayRadarGroups(tasks, today);
    expect(groups[0].tasks.map(t => t.id)).toEqual(['critical-overdue', 'critical-today']);
    expect(groups[1].tasks.map(t => t.id)).toEqual(['planned-and-soon', 'planned']);
    expect(groups[2].tasks.map(t => t.id)).toEqual(['soon']);
    expect(groups[3].tasks.map(t => t.id)).toEqual(['later-deadline', 'optional']);
    const displayed = groups.flatMap(group => group.tasks.map(t => t.id));
    expect(new Set(displayed).size).toBe(displayed.length);
    expect(displayed).not.toContain('future-scheduled');
  });

  it('limits voluntary suggestions to three and prefers priority', () => {
    const tasks = ['a', 'b', 'c', 'd', 'e'].map((name, index) => task(name, { priority: (index % 4 + 1) as Task['priority'] }));
    const suggestions = todayRadarGroups(tasks, today).find(g => g.key === 'optional')!.tasks;
    expect(suggestions).toHaveLength(3);
    expect(suggestions.map(t => t.id)).toEqual(['a', 'e', 'b']);
  });

  it('does not include completed tasks, but still includes future instances of recurring tasks', () => {
    const openRoutine = task('routine', { recurrence: { kind: 'weekdays', weekdays: [1, 2, 3, 4, 5] }, scheduledDate: today, completedAt: '2026-11-05T11:00:00Z' });
    const completed = task('completed', { deadlineDate: today, completedAt: '2026-11-05T11:00:00Z' });
    const groups = todayRadarGroups([openRoutine, completed], today);
    expect(groups[1].tasks.map(t => t.id)).toEqual(['routine']);
    expect(groups.flatMap(g => g.tasks.map(t => t.id))).not.toContain('completed');
  });

  it('lists every deadline exactly once in deadline overview, ordered by urgency', () => {
    const tasks = [
      task('later', { deadlineDate: '2026-11-30' }),
      task('today', { deadlineDate: today }),
      task('soon', { deadlineDate: '2026-11-09' }),
      task('overdue', { deadlineDate: '2026-11-02' }),
      task('undated'),
      task('done', { deadlineDate: today, completedAt: '2026-11-02T09:00:00Z' })
    ];
    const groups = allDeadlineGroups(tasks, today);
    expect(groups.map(group => group.tasks.map(t => t.id))).toEqual([['overdue'], ['today'], ['soon'], ['later']]);
    expect(deadlineOverview(tasks, today)).toEqual({ overdue: 1, today: 1, soon: 1, planningConflicts: 0 });
  });

  it('counts scheduling conflicts independently from urgency', () => {
    const tasks = [
      task('bad', { scheduledDate: addDays(today, 3), deadlineDate: addDays(today, 2) }),
      task('good', { scheduledDate: addDays(today, 1), deadlineDate: addDays(today, 2) }),
      task('no-schedule', { deadlineDate: today })
    ];
    expect(deadlineOverview(tasks, today)).toEqual({ overdue: 0, today: 1, soon: 2, planningConflicts: 1 });
  });
});

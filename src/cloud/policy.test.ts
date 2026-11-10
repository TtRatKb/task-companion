import { describe, expect, it } from 'vitest';
import { emptyData, type AppData } from '../types';
import { isEmptyData, resolveInitial, sameData, toFirestoreData, type CloudMeta, type CloudSnapshot } from './policy';

function data(title?: string): AppData {
  const result = emptyData();
  if (title) result.tasks.push({
    id: 'stable-id',
    title,
    description: '',
    projectId: null,
    priority: 2,
    scheduledDate: null,
    deadlineDate: null,
    recurrence: null,
    completedAt: null,
    createdAt: '2026-11-06T09:00:00Z',
    updatedAt: '2026-11-06T09:00:00Z'
  });
  return result;
}
const uid = 'my-private-uid';
const local = data('Lokale Aufgabe');
const cloudData = data('Cloud-Aufgabe');
const cloud: CloudSnapshot = { revision: 3, data: cloudData };

describe('cloud conflict policy', () => {
  it('never replaces local tasks on a new cloud without a choice', () => {
    expect(resolveInitial(uid, local, cloud, null)).toBe('choose');
  });

  it('does not overwrite the cloud when a new device is empty', () => {
    expect(resolveInitial(uid, emptyData(), cloud, null)).toBe('choose');
  });

  it('can safely load remote changes if local matches the last synced snapshot', () => {
    const meta: CloudMeta = { uid, revision: 2, lastSyncedData: local };
    expect(resolveInitial(uid, local, cloud, meta)).toBe('pull-cloud');
  });

  it('can safely upload local offline edits if cloud has not moved', () => {
    const meta: CloudMeta = { uid, revision: 3, lastSyncedData: cloudData };
    expect(resolveInitial(uid, local, cloud, meta)).toBe('upload-local');
  });

  it('requires explicit resolution for concurrent edits', () => {
    const meta: CloudMeta = { uid, revision: 2, lastSyncedData: data('Vorher') };
    expect(resolveInitial(uid, local, cloud, meta)).toBe('choose');
  });

  it('requires explicit choice when account changes', () => {
    const meta: CloudMeta = { uid: 'someone-else', revision: 3, lastSyncedData: local };
    expect(resolveInitial(uid, local, cloud, meta)).toBe('choose');
  });

  it('does not unnecessarily write equivalent snapshots', () => {
    expect(resolveInitial(uid, cloudData, cloud, null)).toBe('already-equal');
    expect(sameData({ ...cloudData, schemaVersion: 8 }, cloudData)).toBe(true);
  });

  it('notices different interval settings as a real cloud change',()=>{
    const first=data('Routine');
    first.tasks[0].scheduledDate='2026-11-07';
    first.tasks[0].recurrence={kind:'interval',every:2,unit:'weeks',anchorDate:'2026-11-07'};
    const second={...first,tasks:first.tasks.map(t=>({...t,recurrence:{kind:'interval',every:3,unit:'weeks',anchorDate:'2026-11-07'} as const}))};
    expect(sameData(first,second)).toBe(false);
    expect(resolveInitial(uid,first,{revision:3,data:second},{uid,revision:2,lastSyncedData:first})).toBe('pull-cloud');
  });

  it('considers event history when checking for unsynced data', () => {
    const modified = { ...local, completionEvents: [{
      id: 'event-1', taskId: 'stable-id', occurredAt: '2026-11-06T10:00:00Z',
      previousScheduledDate: null, resultingScheduledDate: null,
      previousCompletedAt: null, undoneAt: null
    }] };
    expect(sameData(modified, local)).toBe(false);
  });

  it('keeps independent week budgets in cloud comparisons and backup decisions', () => {
    const customized={...emptyData(),weeklyBudgetMinutes:[120,120,60,120,90,0,0]};
    expect(isEmptyData(customized)).toBe(false);
    expect(sameData(customized,emptyData())).toBe(false);
  });

  it('strips undefined from every nested cloud field while retaining tasks and explicit nulls', () => {
    const raw: AppData = {
      ...local,
      tasks: local.tasks.map(task => ({ ...task, subtasks: undefined })),
      completionEvents: [{
        id: 'e1', taskId: 'stable-id', occurredAt: '2026-11-06T10:00:00Z',
        previousScheduledDate: null, resultingScheduledDate: null,
        previousCompletedAt: null, undoneAt: null, previousSubtasks: undefined
      }]
    };
    const safe = toFirestoreData(raw);
    expect(safe.tasks[0]).not.toHaveProperty('subtasks');
    expect(safe.completionEvents[0]).not.toHaveProperty('previousSubtasks');
    expect(safe.completionEvents[0].previousScheduledDate).toBeNull();
    expect(safe.tasks[0].title).toBe('Lokale Aufgabe');
    expect(raw.completionEvents[0]).toHaveProperty('previousSubtasks'); // No local mutation.
    expect(sameData(raw, safe)).toBe(true);
  });

  it('distinguishes truly empty local state', () => {
    expect(isEmptyData(emptyData())).toBe(true);
    expect(isEmptyData(local)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { emptyData, type AppData } from '../types';
import { isEmptyData, resolveInitial, sameData, type CloudMeta, type CloudSnapshot } from './policy';

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
    expect(sameData({ ...cloudData, schemaVersion: 2 }, cloudData)).toBe(true);
  });

  it('considers event history when checking for unsynced data', () => {
    const modified = { ...local, completionEvents: [{
      id: 'event-1', taskId: 'stable-id', occurredAt: '2026-11-06T10:00:00Z',
      previousScheduledDate: null, resultingScheduledDate: null,
      previousCompletedAt: null, undoneAt: null
    }] };
    expect(sameData(modified, local)).toBe(false);
  });

  it('distinguishes truly empty local state', () => {
    expect(isEmptyData(emptyData())).toBe(true);
    expect(isEmptyData(local)).toBe(false);
  });
});

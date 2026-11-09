import type { AppData } from '../types';

export interface CloudMeta {
  uid: string;
  revision: number;
  lastSyncedData: AppData;
}

export interface CloudSnapshot {
  revision: number;
  data: AppData;
}

/** Firestore rejects undefined in nested objects, while local JSON safely omits it.
 * Make a detached, JSON-safe snapshot before any cloud write; preserve explicit nulls.
 */
export function toFirestoreData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData;
}

/** Compare data by content, not Firestore's object-property ordering. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return '{' + Object.entries(value).filter(([, val]) => val !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => JSON.stringify(key) + ':' + canonical(val)).join(',') + '}';
  return value === undefined ? 'null' : JSON.stringify(value);
}

export function sameData(left: AppData, right: AppData): boolean {
  return canonical(left) === canonical(right);
}

export type Resolution = 'new-cloud' | 'already-equal' | 'pull-cloud' | 'upload-local' | 'choose';

/**
 * Never blindly overwrite an independently changed local or cloud snapshot.
 * First login on another device requires an explicit source choice if the
 * device's data differs from cloud.
 */
export function resolveInitial(
  uid: string, local: AppData, cloud: CloudSnapshot | null, meta: CloudMeta | null
): Resolution {
  if (!cloud) return 'new-cloud';
  if (sameData(local, cloud.data)) return 'already-equal';
  if (meta?.uid === uid && sameData(local, meta.lastSyncedData)) return 'pull-cloud';
  if (meta?.uid === uid && meta.revision === cloud.revision &&
      sameData(cloud.data, meta.lastSyncedData)) return 'upload-local';
  return 'choose';
}

export function isEmptyData(data: AppData): boolean {
  return data.tasks.length === 0 && data.projects.length === 0 && data.completionEvents.length === 0 && data.templates.length === 0 && data.weeklyBudgetMinutes.every(value=>value===null);
}

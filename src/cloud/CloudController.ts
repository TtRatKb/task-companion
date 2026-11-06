import { firebaseServices, type FirebaseServices } from './firebase';
import { isEmptyData, resolveInitial, sameData, type CloudMeta, type CloudSnapshot } from './policy';
import { LocalTaskRepository } from '../repository';
import type { AppData } from '../types';

const META_KEY = 'task-companion:cloud-meta-v1';
const BACKUP_PREFIX = 'task-companion:recovery:';
const OPT_IN_KEY = 'task-companion:cloud-enabled-v1';
const DOC_COLLECTION = 'taskCompanion';
const DOC_ID = 'state';
const repository = new LocalTaskRepository();

export type CloudPhase =
  | 'checking' | 'signed-out' | 'new-cloud' | 'choose'
  | 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';

export interface CloudStatus {
  phase: CloudPhase;
  email?: string;
  remoteTaskCount?: number;
  updatedAt?: string;
  message?: string;
  pending?: boolean;
}

type Services = FirebaseServices;
type User = { uid: string; email?: string | null };

/**
 * Cloud is opt-in, per-UID, and is NEVER the only copy of tasks.
 * Local saves continue to work independently if Firebase is offline.
 * A single versioned cloud document is intentionally used for v0.3
 * (Firestore's 1 MiB document limit will be checked before writes).
 */
export class CloudController {
  private services: Services | null = null;
  private initPromise: Promise<void> | null = null;
  private unlisten: (() => void) | null = null;
  private user: User | null = null;
  private remote: CloudSnapshot | null = null;
  private meta: CloudMeta | null = null;
  private state: CloudStatus = { phase: 'checking' };
  private disposed = false;
  private busy = false;
  private queued = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onFocus = () => { if (this.state.phase === 'synced' || this.state.phase === 'offline') void this.refresh(); };
  private readonly onOnline = () => { if (this.user) void this.refresh(); };

  constructor(
    private readonly getLocal: () => AppData,
    private readonly applyRemote: (data: AppData) => void,
    private readonly report: (value: CloudStatus) => void,
  ) {}

  private emit(phase: CloudPhase, message?: string) {
    this.state = {
      phase,
      email: this.user?.email ?? undefined,
      remoteTaskCount: this.remote?.data.tasks.length,
      updatedAt: phase === 'synced' ? new Date().toISOString() : this.state.updatedAt,
      pending: ['syncing', 'offline'].includes(phase),
      message
    };
    if (!this.disposed) this.report(this.state);
  }

  private readMeta(): CloudMeta | null {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return null;
      const meta: unknown = JSON.parse(raw);
      if (!meta || typeof meta !== 'object') return null;
      const parsed = meta as Record<string, unknown>;
      if (typeof parsed.uid !== 'string' || !Number.isSafeInteger(parsed.revision) ||
          Number(parsed.revision) < 1 || !parsed.lastSyncedData) return null;
      const lastSyncedData = repository.parseImport(JSON.stringify(parsed.lastSyncedData));
      return { uid: parsed.uid, revision: Number(parsed.revision), lastSyncedData };
    } catch {
      return null;
    }
  }

  private saveMeta(meta: CloudMeta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    this.meta = meta;
  }

  private documentRef() {
    if (!this.services || !this.user) throw new Error('Keine Cloud-Verbindung.');
    return this.services.firestoreSDK.doc(
      this.services.db, 'users', this.user.uid, DOC_COLLECTION, DOC_ID
    );
  }

  private snapshot(raw: unknown): CloudSnapshot {
    if (!raw || typeof raw !== 'object') throw new Error('Ungültiges Cloud-Dokument. Lokale Daten bleiben unverändert.');
    const v = raw as Record<string, unknown>;
    if (!Number.isSafeInteger(v.revision) || Number(v.revision) < 1)
      throw new Error('Unbekannte Cloud-Version. Lokale Daten bleiben unverändert.');
    return { revision: Number(v.revision), data: repository.parseImport(JSON.stringify(v.data)) };
  }

  private failure(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/offline|unavailable|network|failed to fetch|internet|timeout/i.test(msg) || !navigator.onLine) {
      this.emit('offline', 'Cloud momentan nicht erreichbar. Deine Änderungen bleiben lokal gespeichert.');
    } else if (/permission-denied|Missing or insufficient permissions/i.test(msg)) {
      this.emit('error', 'Cloud-Zugriff verweigert. Bitte die Firebase-Sicherheitsregeln prüfen; deine lokalen Aufgaben sind sicher.');
    } else {
      this.emit('error', msg);
    }
  }

  async start() {
    // Do not even contact Firebase until cloud sync has been opted into.
    if (!this.initPromise && localStorage.getItem(OPT_IN_KEY) !== '1') {
      this.emit('signed-out');
      return;
    }
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const services = await firebaseServices();
        if (this.disposed) return;
        this.services = services;
        await services.authSDK.setPersistence(services.auth, services.authSDK.browserLocalPersistence);
        if (this.disposed) return;
        this.unlisten = services.authSDK.onAuthStateChanged(
          services.auth,
          (user: User | null) => {
            if (this.disposed) return;
            this.user = user;
            this.meta = this.readMeta();
            if (user) void this.refresh(true);
            else {
              this.remote = null;
              this.emit('signed-out');
            }
          },
          (error: unknown) => this.failure(error)
        );
        window.addEventListener('focus', this.onFocus);
        window.addEventListener('online', this.onOnline);
      } catch (error) {
        if (!this.disposed) this.failure(error);
      }
    })();
    return this.initPromise;
  }

  async signIn() {
    localStorage.setItem(OPT_IN_KEY, '1');
    await this.start();
    if (!this.services) return;
    try {
      const provider = new this.services.authSDK.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await this.services.authSDK.signInWithPopup(this.services.auth, provider);
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/popup-closed-by-user') return;
      this.failure(error);
    }
  }

  async signOut() {
    try {
      localStorage.removeItem(OPT_IN_KEY);
      if (this.services) await this.services.authSDK.signOut(this.services.auth);
    } catch (error) { this.failure(error); }
  }

  async refresh(initial = false) {
    if (!this.user || !this.services || this.disposed || this.busy) return;
    try {
      if (initial) this.emit('checking');
      const snap = await this.services.firestoreSDK.getDocFromServer(this.documentRef());
      if (this.disposed || !this.user) return;
      this.remote = snap.exists() ? this.snapshot(snap.data()) : null;
      this.meta = this.readMeta();
      const resolution = resolveInitial(this.user.uid, this.getLocal(), this.remote, this.meta);

      if (resolution === 'new-cloud') {
        this.emit('new-cloud'); // Explicit first-time cloud creation.
      } else if (resolution === 'already-equal') {
        this.saveMeta({ uid: this.user.uid, revision: this.remote!.revision, lastSyncedData: this.remote!.data });
        this.emit('synced');
      } else if (resolution === 'pull-cloud') {
        this.applyCloud(this.remote!);
      } else if (resolution === 'upload-local') {
        this.emit('syncing');
        await this.flush();
      } else {
        this.emit(this.meta?.uid === this.user.uid ? 'conflict' : 'choose',
          'Lokale und Cloud-Aufgaben unterscheiden sich. Es wurde nichts überschrieben.');
      }
    } catch (error) { this.failure(error); }
  }

  private backup(data: AppData, label: string) {
    // A persistent rollback copy is created BEFORE replacing the on-device data.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = BACKUP_PREFIX + stamp + ':' + label;
    localStorage.setItem(key, JSON.stringify(data));
    return key;
  }

  private applyCloud(snapshot: CloudSnapshot) {
    if (!this.user) return;
    const local = this.getLocal();
    try {
      if (!sameData(local, snapshot.data) && !isEmptyData(local)) this.backup(local, 'local-before-cloud');
      this.applyRemote(snapshot.data);
      this.saveMeta({ uid: this.user.uid, revision: snapshot.revision, lastSyncedData: snapshot.data });
      this.remote = snapshot;
      this.emit('synced');
    } catch (error) { this.failure(error); }
  }

  /** Called only after the user explicitly decides to use the remote copy. */
  useCloud() { if (this.remote) this.applyCloud(this.remote); }

  async createCloud() {
    if (!this.services || !this.user || this.remote) return;
    const local = this.getLocal();
    this.emit('syncing');
    try {
      const ref = this.documentRef();
      await this.services.firestoreSDK.runTransaction(this.services.db, async (tx: any) => {
        const snap = await tx.get(ref);
        if (snap.exists()) throw new Error('Cloud wurde zwischenzeitlich angelegt. Bitte neu prüfen.');
        tx.set(ref, { revision: 1, data: local, updatedAt: this.services!.firestoreSDK.serverTimestamp() });
      });
      this.remote = { revision: 1, data: local };
      this.saveMeta({ uid: this.user.uid, revision: 1, lastSyncedData: local });
      this.emit('synced');
    } catch (error) { this.failure(error); }
  }

  /**
   * Explicit last-resort choice. Requires a confirm in the UI.
   * The old cloud data is backed up locally BEFORE overwriting the cloud.
   */
  async replaceCloud() {
    if (!this.remote || !this.services || !this.user) return;
    try {
      this.backup(this.remote.data, 'cloud-before-replace');
      const expected = this.remote.revision;
      const local = this.getLocal();
      const ref = this.documentRef();
      this.emit('syncing');
      await this.services.firestoreSDK.runTransaction(this.services.db, async (tx: any) => {
        const snap = await tx.get(ref);
        if (!snap.exists() || Number(snap.data().revision) !== expected)
          throw new Error('Cloud wurde inzwischen geändert. Bitte zuerst aktualisieren.');
        tx.update(ref, { revision: expected + 1, data: local, updatedAt: this.services!.firestoreSDK.serverTimestamp() });
      });
      this.remote = { revision: expected + 1, data: local };
      this.saveMeta({ uid: this.user.uid, revision: expected + 1, lastSyncedData: local });
      this.emit('synced');
    } catch (error) { this.failure(error); }
  }

  /** Called after every successful local repository commit. */
  notifyLocalChange() {
    if (!this.user || !this.meta || this.meta.uid !== this.user.uid) return;
    if (!['synced', 'syncing', 'offline'].includes(this.state.phase)) return;
    this.queued = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 550);
  }

  private async flush() {
    if (!this.user || !this.services || !this.meta || this.meta.uid !== this.user.uid || this.disposed) return;
    if (this.busy) { this.queued = true; return; }
    this.busy = true;
    const uid = this.user.uid;
    try {
      do {
        this.queued = false;
        const local = this.getLocal();
        const meta = this.meta;
        if (!meta || meta.uid !== uid) break;
        if (sameData(local, meta.lastSyncedData)) {
          this.emit('synced');
          break;
        }
        this.emit('syncing');
        const ref = this.documentRef();
        // Transaction provides compare-and-swap; conflicting device changes
        // are NOT silently overwritten.
        await this.services.firestoreSDK.runTransaction(this.services.db, async (tx: any) => {
          const snap = await tx.get(ref);
          if (!snap.exists() || Number(snap.data().revision) !== meta.revision)
            throw new Error('SYNC_CONFLICT');
          tx.update(ref, {
            revision: meta.revision + 1,
            data: local,
            updatedAt: this.services!.firestoreSDK.serverTimestamp()
          });
        });
        if (!this.user || this.user.uid !== uid) return;
        this.remote = { revision: meta.revision + 1, data: local };
        this.saveMeta({ uid, revision: meta.revision + 1, lastSyncedData: local });
        this.emit('synced');
      } while (this.queued || (this.meta && !sameData(this.getLocal(), this.meta.lastSyncedData)));
    } catch (error) {
      if (String(error).includes('SYNC_CONFLICT')) {
        this.emit('conflict', 'Ein anderes Gerät hat inzwischen neue Aufgaben gespeichert. Lokale Änderungen bleiben erhalten. Bitte beide Versionen vergleichen.');
        // Refresh the remote snapshot without deciding which one wins.
        try {
          const snap = await this.services.firestoreSDK.getDocFromServer(this.documentRef());
          if (snap.exists()) this.remote = this.snapshot(snap.data());
        } catch { /* stay in conflict; do not overwrite local data */ }
      } else this.failure(error);
    } finally {
      this.busy = false;
    }
  }

  /** Export recovery snapshots created during conflict decisions. */
  availableBackups(): { key: string; label: string }[] {
    return Object.keys(localStorage).filter(key => key.startsWith(BACKUP_PREFIX))
      .sort().reverse().map(key => ({ key, label: key.slice(BACKUP_PREFIX.length) }));
  }

  downloadBackup(key: string) {
    if (!key.startsWith(BACKUP_PREFIX)) return;
    const text = localStorage.getItem(key);
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'task-companion-recovery.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.unlisten) this.unlisten();
    window.removeEventListener('focus', this.onFocus);
    window.removeEventListener('online', this.onOnline);
  }
}

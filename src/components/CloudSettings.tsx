import type { CloudController, CloudStatus } from '../cloud/CloudController';
import type { AppData } from '../types';

export function CloudSettings({
  controller,
  status,
  localData
}: {
  controller: CloudController | null;
  status: CloudStatus;
  localData: AppData;
}) {
  const backups = controller?.availableBackups() ?? [];
  const busy = status.phase === 'checking' || status.phase === 'syncing';
  const hasAccount = !!status.email;

  return <section className="cloud-settings" aria-labelledby="cloud-title">
    <h3 id="cloud-title">Cloud-Synchronisation</h3>
    <p className="cloud-note">
      Optional über dein Google-Konto. Die Aufgaben bleiben zusätzlich auf diesem Gerät
      gespeichert. Cloud-Daten liegen getrennt von deinen Life-RPG-Spielständen.
    </p>
    <div className="cloud-status" aria-live="polite">
      <strong>{({
        'checking': 'Cloud-Verbindung wird geprüft …',
        'signed-out': 'Noch nicht verbunden',
        'new-cloud': 'Cloud ist noch leer',
        'choose': 'Zwei unterschiedliche Aufgabenlisten',
        'synced': 'Cloud synchronisiert',
        'syncing': 'Änderungen werden übertragen …',
        'offline': 'Offline – lokale Daten bleiben erhalten',
        'conflict': 'Konflikt: Beide Versionen wurden verändert',
        'error': 'Cloud-Verbindung nicht verfügbar'
      } as Record<CloudStatus['phase'], string>)[status.phase]}</strong>
      {hasAccount && <small>Google-Konto: {status.email}</small>}
      {status.message && <p role="status">{status.message}</p>}
      {status.updatedAt && status.phase === 'synced' &&
        <small>Letzter erfolgreicher Abgleich: {new Date(status.updatedAt).toLocaleString('de-DE')}</small>}
    </div>

    {status.phase === 'signed-out' &&
      <button type="button" className="primary" onClick={() => void controller?.signIn()}>
        Mit Google verbinden
      </button>}

    {status.phase === 'new-cloud' &&
      <>
        <p>In der Cloud liegt noch keine Task-Companion-Liste. Du kannst deine
          <strong> {localData.tasks.length} lokalen Aufgaben</strong> jetzt als Ausgangspunkt übernehmen.</p>
        <button type="button" className="primary" onClick={() => void controller?.createCloud()}>
          Lokale Aufgaben in Cloud sichern
        </button>
      </>}

    {(status.phase === 'choose' || status.phase === 'conflict') &&
      <div className="cloud-choices">
        <p><strong>Auf diesem Gerät:</strong> {localData.tasks.length} Aufgaben<br/>
          <strong>In der Cloud:</strong> {status.remoteTaskCount ?? 'unbekannt'} Aufgaben</p>
        <p>Es wurde nichts überschrieben. Wähle bewusst, welche Version weitergeführt
          werden soll. Die bisherige Version wird vor dem Ersetzen als lokale Sicherung aufbewahrt.</p>
        <div className="settings-actions">
          <button type="button" onClick={() => {
            if (confirm('Cloud-Aufgaben übernehmen? Deine jetzige lokale Liste wird zuerst zusätzlich gesichert.')) controller?.useCloud();
          }}>Cloud-Version auf dieses Gerät laden</button>
          <button type="button" className="danger ghost" onClick={() => {
            if (confirm('Lokale Aufgaben anstelle der Cloud-Version speichern? Die bisherige Cloud-Version wird vorher auf diesem Gerät gesichert. Andere Geräte können dadurch später einen Konflikt melden.'))
              void controller?.replaceCloud();
          }}>Lokale Version in Cloud übernehmen</button>
        </div>
      </div>}

    {(status.phase === 'synced' || status.phase === 'offline' || status.phase === 'error') &&
      <div className="settings-actions">
        <button type="button" disabled={busy} onClick={() => void controller?.refresh()}>Jetzt abgleichen</button>
        {status.phase === 'error' && <span className="cloud-note">Prüfe zunächst die Firebase-Konfiguration und Sicherheitsregeln.</span>}
      </div>}

    {(status.phase !== 'signed-out' && status.phase !== 'checking') &&
      <div className="cloud-footer">
        <button type="button" className="ghost" onClick={() => void controller?.signOut()}>Google-Verbindung trennen</button>
        <small>Abmelden löscht keine lokalen Aufgaben.</small>
      </div>}

    {backups.length > 0 &&
      <div className="cloud-recovery">
        <h4>Lokale Wiederherstellungskopien</h4>
        <p>Vor jedem Wechsel zwischen unterschiedlichen Versionen wird automatisch eine
          Sicherheitskopie abgelegt. Du kannst sie herunterladen und über „JSON importieren“ wiederherstellen.</p>
        {backups.slice(0, 8).map(item =>
          <button type="button" key={item.key} onClick={() => controller?.downloadBackup(item.key)}>
            Sicherung {item.label.split(':')[0].replace('T', ' ')} herunterladen
          </button>)}
      </div>}
  </section>;
}

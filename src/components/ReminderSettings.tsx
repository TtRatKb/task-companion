import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  REMINDER_LEADS, type ReminderSettings as ReminderPreferences
} from '../reminders';

function browserPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function ReminderSettings({
  preferences, onChange
}: {
  preferences: ReminderPreferences;
  onChange: (changes: Partial<ReminderPreferences>) => void;
}) {
  const [permission, setPermission] = useState(browserPermission);
  const [message, setMessage] = useState('');

  const allow = () => {
    if (!('Notification' in window)) return;
    // Call from the direct button click to preserve the required user gesture.
    void Notification.requestPermission().then(result => {
      setPermission(result);
      if (result === 'granted') {
        onChange({ enabled: true });
        setMessage('Aktiviert. Hinweise erscheinen nur, solange der Browser die App ausführt.');
      } else {
        onChange({ enabled: false });
        setMessage('Die Benachrichtigungserlaubnis wurde nicht erteilt.');
      }
    }).catch(() => setMessage('Der Browser konnte die Erlaubnis nicht anfordern.'));
  };

  const testNotification = () => {
    if (browserPermission() !== 'granted') return;
    try {
      const notification = new Notification('Task Companion · Test', {
        body: 'Benachrichtigungen funktionieren auf diesem Gerät, solange die App läuft.',
        tag: 'task-companion-notification-test'
      });
      notification.onclick = () => { window.focus(); notification.close(); };
      setMessage('Testbenachrichtigung angefordert. Prüfe gegebenenfalls deine Systemeinstellungen.');
    } catch {
      setMessage('Der Browser konnte keine Testbenachrichtigung anzeigen.');
    }
  };

  const enabled = preferences.enabled && permission === 'granted';

  return <section className="reminder-settings" aria-labelledby="reminders-title">
    <h3 id="reminders-title"><Bell size={18} aria-hidden="true" /> Deadline-Erinnerungen</h3>
    <p className="cloud-note">
      Wähle selbst, wann du vor dem letzten Fertigstellungstag erinnert werden möchtest.
      Die Einstellungen gelten <strong>für diesen Browser</strong>; deine Aufgaben bleiben unverändert.
    </p>
    <div className="reminder-status" aria-live="polite">
      {enabled ? <Bell size={17} aria-hidden="true" /> : <BellOff size={17} aria-hidden="true" />}
      <span>{enabled ? 'Benachrichtigungen aktiv, solange Task Companion läuft'
        : 'Browser-Benachrichtigungen derzeit nicht aktiv'}</span>
    </div>
    {permission === 'unsupported' ?
      <p className="reminder-help">Dieser Browser unterstützt hier keine Benachrichtigungen. Das Deadline-Radar in der App bleibt verfügbar.</p> :
      permission === 'denied' ?
        <p className="reminder-help">Benachrichtigungen sind im Browser blockiert. Bitte in den Website-/Systemeinstellungen erlauben und die App neu öffnen.</p> :
        <div className="settings-actions reminder-buttons">
          {!enabled && <button type="button" className="primary"
            onClick={permission === 'granted' ? () => onChange({ enabled: true }) : allow}>
            <Bell size={16} aria-hidden="true" /> Benachrichtigungen aktivieren
          </button>}
          {enabled && <>
            <button type="button" onClick={testNotification}>Testbenachrichtigung</button>
            <button type="button" onClick={() => onChange({ enabled: false })}>Deaktivieren</button>
          </>}
        </div>}
    {message && <p role="status" className="reminder-help">{message}</p>}
    <fieldset className="reminder-days">
      <legend>Erinnern vor dem letzten Fertigstellungstag</legend>
      {REMINDER_LEADS.map(days =>
        <label key={days}>
          <input type="checkbox" checked={preferences.leadDays.includes(days)}
            onChange={event => onChange({
              leadDays: event.target.checked
                ? [...preferences.leadDays, days]
                : preferences.leadDays.filter(value => value !== days)
            })} />
          {days === 0 ? 'Am Tag der Deadline' : days === 1 ? '1 Tag vorher' : `${days} Tage vorher`}
        </label>)}
    </fieldset>
    <label className="reminder-time">Frühestens um
      <input aria-label="Uhrzeit für Deadline-Erinnerungen" type="time"
        value={preferences.time} onChange={event => onChange({ time: event.target.value })} />
      <small>Ortszeit Deutschland (Europe/Berlin)</small>
    </label>
    <p className="reminder-limit">
      <strong>Wichtig:</strong> Das ist die erste Erinnerungsstufe. Sie prüft Fristen, solange Task Companion
      im Browser geöffnet ist, auch beim erneuten Aktivieren. <strong>Bei vollständig geschlossener App
      werden noch keine Push-Mitteilungen zugestellt.</strong> Dafür richten wir später einen
      eigenen Push-Dienst ein. Aufgabentitel können bei aktivierten Hinweisen auf dem Sperrbildschirm erscheinen.
    </p>
  </section>;
}
